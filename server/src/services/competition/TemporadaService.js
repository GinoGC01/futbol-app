import { temporadaRepository } from "../../repositories/temporadaRepository.js";
import { ligaRepository } from "../../repositories/ligaRepository.js";
import LigaService from "../identity/LigaService.js";
import AppError from "../../utils/AppError.js";

export const TemporadaService = {
  /**
   * Verifica transaccionalmente si la temporada está finalizada (y de paso el ownership,
   * aunque el ownership primario es la liga_id). Usada internamente.
   */
  async validateNotFinalizada(temporadaId) {
    if (!temporadaId) throw new AppError("ID de temporada requerido", 400);

    const { data, error } = await temporadaRepository.findTemporadaCheck(temporadaId)

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
  },

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
        const { data: f } = await temporadaRepository.findFormatoCompetenciaById(data.formato_id);
        formato = f;
      }

      // B. Intentar coincidencia exacta por tipo (slug)
      if (!formato && formato_tipo) {
        const { data: formats } = await temporadaRepository.findFormatoCompetenciaByTipo(formato_tipo);
        
        if (formats && formats.length > 0) {
          formato = formats[0];
        }
      }

      // C. Si aún no lo encuentra, intentar por nombre (case-insensitive)
      if (!formato && formato_tipo) {
        const { data: fallbacks } = await temporadaRepository.findFormatoCompetenciaByNombre(formato_tipo);
        
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
      const { data: liga, error: ligaErr } = await ligaRepository.findLigaTipoFutbol(ligaId)
      if (ligaErr || !liga) throw new AppError("No se pudo obtener datos de la liga", 500);
      
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

      const result = await temporadaRepository.createTemporada(payload)

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
  },

  async getTemporadasByLiga(ligaId, organizadorId, filterArchived = 'active') {
    await LigaService.verifyOwnership(ligaId, organizadorId);

    const { data: temporadas, error } = await temporadaRepository.findTemporadasByLiga(ligaId, filterArchived)

    if (error) {
      throw new AppError(`Error al listar temporadas: ${error.message}`, 500);
    }

    return temporadas || [];
  },

  async updateEstado(temporadaId, organizadorId, nuevoEstado) {
    if (!["borrador", "activa", "finalizada"].includes(nuevoEstado)) {
      throw new AppError("Estado no válido.", 400);
    }

    // Aislamiento a través del ID y el ownership del organizador
    const { data: seasonCheck, error: checkError } = await temporadaRepository.findTemporadaByIdCheck(temporadaId)

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

    const { data, error } = await temporadaRepository.updateTemporadaEstado(temporadaId, nuevoEstado)

    if (error)
      throw new AppError(`Error al actualizar estado: ${error.message}`, 500);

    return data;
  },

  /**
   * Obtiene la temporada con todas sus fases y jornadas anidadas.
   * "Un solo golpe de vista para el admin".
   */
  async getTemporadaCompleta(temporadaId, organizadorId) {
    // 1. Verificar existencia y Aislamiento Indirecto
    const { data: temporadaCheck, error: tempError } = await temporadaRepository.findTemporadaByIdCheck(temporadaId)

    if (tempError || !temporadaCheck)
      throw new AppError("Temporada no encontrada", 404);
    await LigaService.verifyOwnership(temporadaCheck.liga_id, organizadorId);

    // 2. Traer el árbol completo desde Supabase (Relaciones anidadas)
    const { data: temporadaCompleta, error: arbolError } = await temporadaRepository.findTemporadaCompletaTree(temporadaId)

    if (arbolError)
      throw new AppError(
        `Error al consultar árbol de competencia: ${arbolError.message}`,
        500,
      );

    // Ordenar las fases por orden y sus jornadas por numero en memoria
    if (temporadaCompleta.fases) {
      temporadaCompleta.fases.sort((a, b) => a.orden - b.orden);
      temporadaCompleta.fases.forEach((fase) => {
        if (fase.jornadas) {
          fase.jornadas.sort((a, b) => a.numero - b.numero);
        }
      });
    }

    return temporadaCompleta;
  },

  /**
   * Obtiene todos los formatos de competencia disponibles
   */
  async getFormatos() {
    const { data, error } = await temporadaRepository.findFormatosCompetencia()

    if (error)
      throw new AppError(`Error al listar formatos: ${error.message}`, 500);

    return data || [];
  },

  /**
   * Actualiza los detalles de una temporada (nombre, fechas)
   */
  async updateTemporada(temporadaId, organizadorId, updateData) {
    const { nombre, fecha_inicio, fecha_fin, estado: nuevoEstado } = updateData;

    // 1. Verificar existencia y Aislamiento 
    const { data: seasonCheck, error: checkError } = await temporadaRepository.findTemporadaByIdCheck(temporadaId)

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

    // 3. Actualizar en BD
    const result = await temporadaRepository.updateTemporada(temporadaId, payload)

    if (result.error) {
      throw new AppError(`Error al actualizar temporada: ${result.error.message}`, 500);
    }

    return result.data;
  },

  async deleteTemporada(temporadaId, organizadorId) {
    // 1. Verify existence & ownership
    const { data: seasonCheck, error: checkError } = await temporadaRepository.findTemporadaByIdCheck(temporadaId)

    if (checkError || !seasonCheck) {
      throw new AppError("Temporada no encontrada o ya archivada", 404);
    }

    await LigaService.verifyOwnership(seasonCheck.liga_id, organizadorId);

    // 2. Delete temporada (Soft Delete)
    const { error } = await temporadaRepository.updateTemporadaDeletedAt(temporadaId, new Date().toISOString())

    if (error) {
      throw new AppError(`Error al archivar temporada: ${error.message}`, 500);
    }

    return { message: "Temporada archivada exitosamente" };
  },

  /**
   * Restaura una temporada archivada (limpia el deleted_at)
   */
  async restoreTemporada(temporadaId, organizadorId) {
    // 1. Verify existence & ownership (sin filtrar deleted_at para poder encontrarla)
    const { data: seasonCheck, error: checkError } = await temporadaRepository.findTemporadaByIdCheckNoDeletedFilter(temporadaId)

    if (checkError || !seasonCheck) {
      throw new AppError("Temporada no encontrada", 404);
    }

    await LigaService.verifyOwnership(seasonCheck.liga_id, organizadorId);

    // 2. Restore temporada
    const { error } = await temporadaRepository.updateTemporadaDeletedAt(temporadaId, null)

    if (error) {
      throw new AppError(`Error al restaurar temporada: ${error.message}`, 500);
    }

    return { message: "Temporada restaurada exitosamente" };
  }
}

export default TemporadaService;
