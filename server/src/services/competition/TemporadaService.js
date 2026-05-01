import { supabaseAdmin } from "../../lib/supabase.js";
import LigaService from "../identity/LigaService.js";
import AppError from "../../utils/AppError.js";

class TemporadaService {
  /**
   * Verifica transaccionalmente si la temporada está finalizada (y de paso el ownership,
   * aunque el ownership primario es la liga_id). Usada internamente.
   */
  async validateNotFinalizada(temporadaId) {
    if (!temporadaId) throw new AppError("ID de temporada requerido", 400);

    const { data, error } = await supabaseAdmin
      .from("temporada")
      .select("estado, liga_id, liga:liga_id(monto_inscripcion)")
      .eq("id", temporadaId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error)
      throw new AppError(`Error al verificar temporada: ${error.message}`, 500);
    if (!data) throw new AppError("Temporada no encontrada", 404);

    if (data.estado === "finalizada") {
      throw new AppError(
        "Operación denegada: La temporada está finalizada (Modo Bóveda). No se permiten más modificaciones.",
        403,
      );
    }

    return data;
  }

  async createTemporada(ligaId, organizadorId, data) {
    try {
      // 1. Aislamiento Total
      await LigaService.verifyOwnership(ligaId, organizadorId);

      const { formato_tipo, nombre, fecha_inicio, fecha_fin, modalidad } = data;
      if (!formato_tipo || !nombre) {
        throw new AppError("formato_tipo y nombre son requeridos", 400);
      }

      // 2. Resolución de Formato: Buscar basado en ID, Tipo (slug) o Nombre
      let formato = null;

      // A. Intentar por ID si se proporciona (máxima consistencia)
      if (data.formato_id) {
        const { data: f } = await supabaseAdmin
          .from("formato_competencia")
          .select("id, tipo, nombre")
          .eq("id", data.formato_id)
          .maybeSingle();
        formato = f;
      }

      // B. Intentar coincidencia exacta por tipo (slug)
      if (!formato && formato_tipo) {
        const { data: formats, error: formatError } = await supabaseAdmin
          .from("formato_competencia")
          .select("id, tipo, nombre")
          .eq("tipo", formato_tipo.toLowerCase())
          .limit(1); // Tomamos el primero si hay varios del mismo tipo (ej: copa)
        
        if (formats && formats.length > 0) {
          formato = formats[0];
        }
      }

      // C. Si aún no lo encuentra, intentar por nombre (case-insensitive)
      if (!formato && formato_tipo) {
        const { data: fallbacks } = await supabaseAdmin
          .from("formato_competencia")
          .select("id, tipo, nombre")
          .ilike("nombre", `%${formato_tipo}%`)
          .limit(1);
        
        if (fallbacks && fallbacks.length > 0) {
          formato = fallbacks[0];
        }
      }

      if (!formato) {
        throw new AppError(
          `Formato de competencia '${formato_tipo || data.formato_id}' no reconocido o no disponible.`,
          400,
        );
      }

      // 3. Extraer modalidad por defecto de la liga
      const { data: liga, error: ligaErr } = await supabaseAdmin
        .from("liga")
        .select("tipo_futbol")
        .eq("id", ligaId)
        .single();
      
      const modalidadDefault = liga.tipo_futbol ? parseInt(liga.tipo_futbol.replace(/\D/g, "")) : 5;

      // 4. Insert en BD (Resiliencia ante esquema desactualizado)
      const payload = {
        liga_id: ligaId,
        formato_id: formato.id,
        nombre: nombre.trim(),
        modalidad: Number(modalidad) || modalidadDefault
      };
      if (fecha_inicio) payload.fecha_inicio = fecha_inicio;
      if (fecha_fin) payload.fecha_fin = fecha_fin;

      let result = await supabaseAdmin
        .from("temporada")
        .insert([payload])
        .select("id, nombre, estado, fecha_inicio, fecha_fin, formato_id, modalidad, liga:liga_id(id, tipo_futbol)")
        .maybeSingle();

      // Si falla porque no existe la columna 'modalidad', reintentamos sin ella
      if (result.error && (result.error.message.includes("modalidad") || result.error.code === '42703')) {
        delete payload.modalidad;
        result = await supabaseAdmin
          .from("temporada")
          .insert([payload])
          .select("id, nombre, estado, fecha_inicio, fecha_fin, formato_id, liga:liga_id(id, tipo_futbol)")
          .single();
        
        // Adjuntamos el valor en memoria para que el resto del sistema lo use
        if (result.data) {
           result.data.modalidad = Number(modalidad) || modalidadDefault;
        }
      }

      if (result.error) {
        if (result.error.code === "23503")
          throw new AppError("El Formato especificado no es válido", 400);
        throw new AppError(`Error al crear temporada: ${result.error.message}`, 500);
      }

      return result.data;
    } catch (error) {
      console.log("Error al crear temporada:", error);
      throw error;
    }
  }

  async getTemporadasByLiga(ligaId, organizadorId, filterArchived = 'active') {
    await LigaService.verifyOwnership(ligaId, organizadorId);

    // 2. Consultar BD con formato anidado para ligas
    let query = supabaseAdmin
      .from("temporada")
      .select(`
        id, nombre, estado, fecha_inicio, fecha_fin, modalidad,
        liga:liga_id(id, tipo_futbol),
        formato:formato_competencia(id, nombre, tipo)
      `)
      .eq("liga_id", ligaId)
      .order("created_at", { ascending: false });

    if (filterArchived === 'active') {
      query = query.is("deleted_at", null);
    } else if (filterArchived === 'archived') {
      query = query.not("deleted_at", "is", null);
    }

    const { data: temporadas, error } = await query;

    if (error) {
      throw new AppError(`Error al listar temporadas: ${error.message}`, 500);
    }

    return temporadas || [];
  }

  async updateEstado(temporadaId, organizadorId, nuevoEstado) {
    if (!["borrador", "activa", "finalizada"].includes(nuevoEstado)) {
      throw new AppError("Estado no válido.", 400);
    }

    // Aislamiento a través del ID y el ownership del organizador
    const { data: seasonCheck, error: checkError } = await supabaseAdmin
      .from("temporada")
      .select("estado, liga_id")
      .eq("id", temporadaId)
      .is("deleted_at", null)
      .maybeSingle();

    if (checkError || !seasonCheck) {
      throw new AppError("Temporada no encontrada", 404);
    }

    await LigaService.verifyOwnership(seasonCheck.liga_id, organizadorId);

    // Validar máquina de estados: no volver de finalizada
    if (seasonCheck.estado === "finalizada") {
      throw new AppError(
        "Una temporada finalizada no puede cambiar su estado (Modo Bóveda)",
        403,
      );
    }

    // Y no se debe volver a borrador si ya estaba activa
    if (seasonCheck.estado === "activa" && nuevoEstado === "borrador") {
      throw new AppError(
        "Una temporada activa no puede retroceder a borrador",
        400,
      );
    }

    const { data, error } = await supabaseAdmin
      .from("temporada")
      .update({ estado: nuevoEstado })
      .eq("id", temporadaId)
      .select("id, nombre, estado")
      .single();

    if (error)
      throw new AppError(`Error al actualizar estado: ${error.message}`, 500);

    return data;
  }

  /**
   * Obtiene la temporada con todas sus fases y jornadas anidadas.
   * "Un solo golpe de vista para el admin".
   */
  async getTemporadaCompleta(temporadaId, organizadorId) {
    // 1. Verificar existencia y Aislamiento Indirecto
    const { data: temporadaCheck, error: tempError } = await supabaseAdmin
      .from("temporada")
      .select("liga_id")
      .eq("id", temporadaId)
      .is("deleted_at", null)
      .maybeSingle();

    if (tempError || !temporadaCheck)
      throw new AppError("Temporada no encontrada", 404);
    await LigaService.verifyOwnership(temporadaCheck.liga_id, organizadorId);

    // 2. Traer el árbol completo desde Supabase (Relaciones anidadas)
    const { data: temporadaCompleta, error: arbolError } = await supabaseAdmin
      .from("temporada")
      .select(
        `
        id, nombre, estado, fecha_inicio, fecha_fin, modalidad,
        liga:liga_id(id, tipo_futbol),
        formato:formato_competencia(id, nombre, tipo),
        fases:fase(
          id, nombre, tipo, orden, puntos_victoria, puntos_empate, ida_y_vuelta,
          jornadas:jornada(id, numero, estado, fecha_tentativa)
        )
      `,
      )
      .eq("id", temporadaId)
      .is("deleted_at", null)
      .single();

    if (arbolError)
      throw new AppError(
        `Error al consultar árbol de competencia: ${arbolError.message}`,
        500,
      );

    // 3. Ya no necesitamos post-procesar modalidad aquí, 
    // la UI la calculará desde temporada.liga.tipo_futbol

    // Ordenar las fases por orden y sus jornadas por numero en memoria
    // (A veces Supabase PostgREST no garantiza el orden anidado sin tricks sintácticos y es más robusto un simple sort aquí).
    if (temporadaCompleta.fases) {
      temporadaCompleta.fases.sort((a, b) => a.orden - b.orden);
      temporadaCompleta.fases.forEach((fase) => {
        if (fase.jornadas) {
          fase.jornadas.sort((a, b) => a.numero - b.numero);
        }
      });
    }

    return temporadaCompleta;
  }

  /**
   * Obtiene todos los formatos de competencia disponibles
   */
  async getFormatos() {
    const { data, error } = await supabaseAdmin
      .from("formato_competencia")
      .select("id, nombre, tipo")
      .order("nombre", { ascending: true });

    if (error)
      throw new AppError(`Error al listar formatos: ${error.message}`, 500);

    return data || [];
  }

  /**
   * Actualiza los detalles de una temporada (nombre, fechas)
   */
  async updateTemporada(temporadaId, organizadorId, updateData) {
    const { nombre, fecha_inicio, fecha_fin, estado: nuevoEstado } = updateData;

    // 1. Verificar existencia y Aislamiento 
    const { data: seasonCheck, error: checkError } = await supabaseAdmin
      .from("temporada")
      .select("id, estado, liga_id")
      .eq("id", temporadaId)
      .is("deleted_at", null)
      .maybeSingle();

    if (checkError || !seasonCheck) {
      throw new AppError("Temporada no encontrada", 404);
    }

    await LigaService.verifyOwnership(seasonCheck.liga_id, organizadorId);

    // 2. No permitir cambios si está finalizada (Modo Bóveda)
    if (seasonCheck.estado === "finalizada") {
      throw new AppError(
        "No se puede modificar una temporada finalizada (Modo Bóveda)",
        403,
      );
    }

    // 3. Payload
    const payload = {};
    if (nombre) payload.nombre = nombre.trim();
    if (fecha_inicio) payload.fecha_inicio = fecha_inicio;
    if (fecha_fin) payload.fecha_fin = fecha_fin;

    // 4. State Machine Validation (Integración con updateEstado)
    if (nuevoEstado && nuevoEstado !== seasonCheck.estado) {
      if (!["borrador", "activa", "finalizada"].includes(nuevoEstado)) {
        throw new AppError("Estado no válido.", 400);
      }
      
      // No se debe volver a borrador si ya estaba activa
      if (seasonCheck.estado === "activa" && nuevoEstado === "borrador") {
        throw new AppError(
          "Una temporada activa no puede retroceder a borrador",
          400,
        );
      }
      payload.estado = nuevoEstado;
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError("No hay datos para actualizar", 400);
    }

    // 3. Actualizar en BD (Resiliencia ante esquema desactualizado)
    let result = await supabaseAdmin
      .from("temporada")
      .update(payload)
      .eq("id", temporadaId)
      .select("id, nombre, estado, fecha_inicio, fecha_fin, modalidad, liga:liga_id(id, tipo_futbol)")
      .maybeSingle();

    // Si falla por la columna modalidad, reintentar omitiéndola
    if (result.error && (result.error.message.includes("modalidad") || result.error.code === '42703')) {
       delete payload.modalidad;
       result = await supabaseAdmin
         .from("temporada")
         .update(payload)
         .eq("id", temporadaId)
         .select("id, nombre, estado, fecha_inicio, fecha_fin, liga:liga_id(id, tipo_futbol)")
         .single();
    }

    if (result.error) {
      throw new AppError(`Error al actualizar temporada: ${result.error.message}`, 500);
    }

    return result.data;
  }
  async deleteTemporada(temporadaId, organizadorId) {
    // 1. Verify existence & ownership
    const { data: seasonCheck, error: checkError } = await supabaseAdmin
      .from("temporada")
      .select("id, liga_id")
      .eq("id", temporadaId)
      .is("deleted_at", null)
      .maybeSingle();

    if (checkError || !seasonCheck) {
      throw new AppError("Temporada no encontrada o ya archivada", 404);
    }

    await LigaService.verifyOwnership(seasonCheck.liga_id, organizadorId);

    // 2. Delete temporada (Soft Delete)
    const { error } = await supabaseAdmin
      .from("temporada")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", temporadaId);

    if (error) {
      throw new AppError(`Error al archivar temporada: ${error.message}`, 500);
    }

    return { message: "Temporada archivada exitosamente" };
  }

  /**
   * Restaura una temporada archivada (limpia el deleted_at)
   */
  async restoreTemporada(temporadaId, organizadorId) {
    // 1. Verify existence & ownership (sin filtrar deleted_at para poder encontrarla)
    const { data: seasonCheck, error: checkError } = await supabaseAdmin
      .from("temporada")
      .select("id, liga_id")
      .eq("id", temporadaId)
      .maybeSingle();

    if (checkError || !seasonCheck) {
      throw new AppError("Temporada no encontrada", 404);
    }

    await LigaService.verifyOwnership(seasonCheck.liga_id, organizadorId);

    // 2. Restore temporada
    const { error } = await supabaseAdmin
      .from("temporada")
      .update({ deleted_at: null })
      .eq("id", temporadaId);

    if (error) {
      throw new AppError(`Error al restaurar temporada: ${error.message}`, 500);
    }

    return { message: "Temporada restaurada exitosamente" };
  }
}

export default new TemporadaService();
