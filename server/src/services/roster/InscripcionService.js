import { inscripcionRepository } from "../../repositories/inscripcionRepository.js";
import LigaService from "../identity/LigaService.js";
import TemporadaService from "../competition/TemporadaService.js";
import AppError from "../../utils/AppError.js";

const InscripcionService = {
  /**
   * Inscribe un equipo en una temporada.
   * 1. Verifica que la temporada no esté finalizada (Hard Lock).
   * 2. Verifica que el equipo y la temporada pertenezcan a la MISMA liga (Integridad).
   * 3. Crea inscripcion_equipo.
   * 4. Crea automáticamente el plantel asociado.
   */
  async inscribirEquipoEnTemporada(
    equipoId,
    temporadaId,
    organizadorId,
    data = {},
  ) {
    const { monto_total = 0, limite_jugadores = 20 } = data;

    // 1. Obtener temporada y su liga_id + Hard Lock
    const temporada = await TemporadaService.validateNotFinalizada(temporadaId);

    // 2. Aislamiento: verificar propiedad de la liga
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId);

    // 3. Verificar que el equipo pertenece a la MISMA liga que la temporada
    const { data: equipo, error: eqError } = await inscripcionRepository.findEquipoById(equipoId);

    if (eqError || !equipo) throw new AppError("Equipo no encontrado", 404);

    if (equipo.liga_id !== temporada.liga_id) {
      throw new AppError(
        `El equipo "${equipo.nombre}" pertenece a otra liga. No se puede inscribir en esta temporada.`,
        400,
      );
    }

    // 4. Crear inscripcion_equipo
    const { data: inscripcion, error: inscError } = await inscripcionRepository.createInscripcionEquipo({
      equipo_id: equipoId,
      temporada_id: temporadaId,
      monto_total: Number(temporada.liga?.monto_inscripcion || 0),
      monto_abonado: 0,
      estado_pago: "pendiente",
    });

    if (inscError) {
      if (inscError.code === "23505") {
        throw new AppError(
          "Este equipo ya está inscrito en esta temporada",
          409,
        );
      }
      throw new AppError(
        `Error al inscribir equipo: ${inscError.message}`,
        500,
      );
    }

    // 5. Crear plantel automáticamente
    const { data: plantel, error: plantelError } = await inscripcionRepository.createPlantel({
      equipo_id: equipoId,
      temporada_id: temporadaId,
      limite_jugadores: Number(limite_jugadores),
    });

    if (plantelError) {
      // Rollback de la inscripcion si el plantel falla
      await inscripcionRepository.deleteInscripcionEquipo(inscripcion.id);

      if (plantelError.code === "23505") {
        throw new AppError(
          "Ya existe un plantel para este equipo en esta temporada",
          409,
        );
      }
      throw new AppError(
        `Error al crear plantel: ${plantelError.message}`,
        500,
      );
    }

    return { inscripcion, plantel };
  },

  /**
   * Agrega un jugador a un plantel.
   * 1. Verifica que el plantel no esté lleno (limite_jugadores).
   * 2. Verifica que el jugador no esté ya inscrito en otro equipo de la MISMA temporada.
   */
  async agregarJugadorAPlantel(plantelId, jugadorId, organizadorId, data = {}) {
    const { dorsal, posicion } = data;

    // 1. Obtener plantel con su temporada y equipo para verificar ownership
    const { data: plantel, error: plantelError } = await inscripcionRepository.findPlantelById(plantelId);

    if (plantelError || !plantel)
      throw new AppError("Plantel no encontrado", 404);

    // 2. Aislamiento
    await LigaService.verifyOwnership(plantel.equipo.liga_id, organizadorId);

    // 3. Hard Lock de temporada
    await TemporadaService.validateNotFinalizada(plantel.temporada_id);

    // 4. Verificar cupo en el plantel
    const { count: jugadoresActuales, error: countError } = await inscripcionRepository.countJugadoresInPlantel(plantelId);

    if (countError)
      throw new AppError(`Error verificando cupo: ${countError.message}`, 500);

    if (jugadoresActuales >= plantel.limite_jugadores) {
      throw new AppError(
        `El plantel ya tiene ${jugadoresActuales}/${plantel.limite_jugadores} jugadores. No hay cupo disponible.`,
        400,
      );
    }

    // 5. Verificar que el jugador NO esté inscrito en OTRO equipo de la MISMA temporada
    const { data: inscripcionExistente, error: dupError } = await inscripcionRepository.findJugadorInscripcionInTemporada(jugadorId, plantel.temporada_id);

    if (dupError && !dupError.message.includes("rows")) {
      throw new AppError(
        `Error verificando duplicidad: ${dupError.message}`,
        500,
      );
    }

    if (inscripcionExistente) {
      const equipoNombre =
        inscripcionExistente.plantel?.equipo?.nombre || "otro equipo";
      throw new AppError(
        `Este jugador ya está inscrito en "${equipoNombre}" para esta temporada. Un jugador no puede estar en dos equipos a la vez.`,
        409,
      );
    }

    // 6. Validar posición si viene
    const posicionesValidas = [
      "arquero",
      "defensor",
      "mediocampista",
      "delantero",
    ];
    if (posicion && !posicionesValidas.includes(posicion)) {
      throw new AppError(
        `Posición no válida. Permitidas: ${posicionesValidas.join(", ")}`,
        400,
      );
    }

    // 7. Inscribir jugador
    const payload = {
      jugador_id: jugadorId,
      plantel_id: plantelId,
      estado: "activo",
    };
    if (dorsal !== undefined && dorsal !== null)
      payload.dorsal = Number(dorsal);
    if (posicion) payload.posicion = posicion;

    const { data: inscripcion, error: insError } = await inscripcionRepository.createInscripcionJugador(payload);

    if (insError) {
      if (insError.code === "23505") {
        throw new AppError("Este jugador ya está en este plantel", 409);
      }
      throw new AppError(
        `Error al inscribir jugador: ${insError.message}`,
        500,
      );
    }

    return inscripcion;
  },

  /**
   * Actualiza el pago de una inscripción de equipo.
   */
  async actualizarPago(inscripcionId, organizadorId, montoAbonado) {
    // 1. Obtener inscripcion con datos del equipo para verificar ownership
    const { data: inscripcion, error: insError } = await inscripcionRepository.findInscripcionEquipoById(inscripcionId);

    if (insError || !inscripcion)
      throw new AppError("Inscripción no encontrada", 404);

    // 2. Aislamiento
    await LigaService.verifyOwnership(
      inscripcion.equipo.liga_id,
      organizadorId,
    );

    const nuevoAbonado = Number(montoAbonado);
    if (isNaN(nuevoAbonado) || nuevoAbonado < 0) {
      throw new AppError("El monto abonado debe ser un número positivo", 400);
    }

    if (nuevoAbonado > Number(inscripcion.monto_total)) {
      throw new AppError(
        `El monto abonado ($${nuevoAbonado}) no puede superar el total ($${inscripcion.monto_total})`,
        400,
      );
    }

    // Determinar estado_pago automáticamente
    let estadoPago = "pendiente";
    if (nuevoAbonado >= Number(inscripcion.monto_total)) {
      estadoPago = "pagado";
    } else if (nuevoAbonado > 0) {
      estadoPago = "parcial";
    }

    const { data: updated, error: upError } = await inscripcionRepository.updateInscripcionEquipoPago(inscripcionId, {
      monto_abonado: nuevoAbonado,
      estado_pago: estadoPago,
    });

    if (upError)
      throw new AppError(`Error actualizando pago: ${upError.message}`, 500);

    return updated;
  },

  /**
   * Lista los equipos inscritos en una temporada con datos de pago y plantel.
   */
  async getInscripcionesByTemporada(temporadaId, organizadorId) {
    // Aislamiento indirecto
    const temporada = await TemporadaService.validateNotFinalizada(temporadaId);
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId);

    const { data: inscripciones, error: iErr } = await inscripcionRepository.findInscripcionesByTemporada(temporadaId);

    if (iErr)
      throw new AppError(`Error listando inscripciones: ${iErr.message}`, 500);

    const { data: planteles, error: pErr } = await inscripcionRepository.findPlantelesByTemporada(temporadaId);

    if (pErr)
      throw new AppError(`Error listando planteles: ${pErr.message}`, 500);

    // Unificar en memoria
    const data = (inscripciones || []).map((ins) => {
      const plantel =
        (planteles || []).find((p) => p.equipo_id === ins.equipo_id) || null;
      return {
        ...ins,
        plantel,
      };
    });

    return data;
  },

  /**
   * Lista las inscripciones y planteles de un equipo específico en todas las temporadas.
   */
  async getInscripcionesByEquipo(equipoId, organizadorId) {
    // 1. Obtener equipo para verificar ownership
    const { data: equipo, error: eqError } = await inscripcionRepository.findEquipoById(equipoId);

    if (eqError || !equipo) throw new AppError("Equipo no encontrado", 404);
    // 2. Aislamiento
    await LigaService.verifyOwnership(equipo.liga_id, organizadorId);

    // 3. Obtener planteles con sus inscripciones de jugadores
    const { data: planteles, error: pError } = await inscripcionRepository.findPlantelesByEquipo(equipoId);

    if (pError)
      throw new AppError(`Error listando planteles: ${pError.message}`, 500);

    // 4. Obtener datos de pago (inscripcion_equipo) para cruzarlos
    const { data: inscripciones, error: iError } = await inscripcionRepository.findInscripcionesByEquipo(equipoId);

    if (iError)
      throw new AppError(`Error listando pagos: ${iError.message}`, 500);

    // 5. Unificar datos
    const resultado = planteles.map((p) => {
      const pago =
        inscripciones.find(
          (i) => String(i.temporada_id) === String(p.temporada_id),
        ) || null;

      // Si no hay pago, usamos un objeto vacío pero conservamos el id del plantel como fallback
      // para evitar que el front se rompa, aunque idealmente siempre debería haber pago.
      const pagoData = pago || {};

      return {
        ...p,
        ...pagoData,
        // Forzamos que el ID principal sea el de la inscripción si existe
        id: pagoData.id || p.id,
        inscripcion_id: pagoData.id || null,
        monto_total: Number(pagoData.monto_total || 0),
        monto_abonado: Number(pagoData.monto_abonado || 0),
        // Mantener estructura esperada por el front (plantel: { ... })
        plantel: {
          id: p.id,
          limite_jugadores: p.limite_jugadores,
          inscripciones: p.inscripciones,
        },
      };
    });

    return resultado;
  },

  /**
   * Inscribe múltiples equipos en una temporada por bloques.
   */
  async inscribirEquiposBatch(equipoIds, temporadaId, organizadorId, data = {}) {
    if (!Array.isArray(equipoIds) || equipoIds.length === 0) {
      throw new AppError("Se requiere una lista de IDs de equipos", 400);
    }

    const { limite_jugadores = 20 } = data;

    // 1. Validar temporada y propiedad de la liga
    const temporada = await TemporadaService.validateNotFinalizada(temporadaId);
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId);

    // 2. Obtener detalles de los equipos para validar que pertenecen a la misma liga
    const { data: equipos, error: eqError } = await inscripcionRepository.findEquiposInIds(equipoIds);

    if (eqError)
      throw new AppError(`Error al validar equipos: ${eqError.message}`, 500);

    // Verificar que todos los equipos pertenecen a la liga de la temporada
    const ajenos = equipos.filter((e) => e.liga_id !== temporada.liga_id);
    if (ajenos.length > 0) {
      throw new AppError(
        `Los siguientes equipos pertenecen a otra liga: ${ajenos.map((e) => e.nombre).join(", ")}`,
        400,
      );
    }

    // 3. Verificar inscripciones existentes para evitar duplicados
    const { data: inscripcionesExistentes, error: checkError } = await inscripcionRepository.findInscripcionesByTemporadaAndEquipos(temporadaId, equipoIds);

    if (checkError)
      throw new AppError(
        `Error al verificar inscripciones: ${checkError.message}`,
        500,
      );

    const idsExistentes = new Set(
      inscripcionesExistentes.map((i) => i.equipo_id),
    );
    const idsAInscribir = equipoIds.filter((id) => !idsExistentes.has(id));

    if (idsAInscribir.length === 0) {
      return {
        message: "Todos los equipos seleccionados ya estaban inscritos",
        count: 0,
      };
    }

    // 4. Realizar inscripciones y creación de planteles
    const inscripcionesPayload = idsAInscribir.map((id) => ({
      equipo_id: id,
      temporada_id: temporadaId,
      monto_total: Number(temporada.liga?.monto_inscripcion || 0),
      monto_abonado: 0,
      estado_pago: "pendiente",
    }));

    const { data: nuevasInscripciones, error: batchInscError } = await inscripcionRepository.createInscripcionesEquipoBatch(inscripcionesPayload);

    if (batchInscError)
      throw new AppError(
        `Error en inscripción masiva: ${batchInscError.message}`,
        500,
      );

    const plantelesPayload = idsAInscribir.map((id) => ({
      equipo_id: id,
      temporada_id: temporadaId,
      limite_jugadores: Number(limite_jugadores),
    }));

    const { error: batchPlantelError } = await inscripcionRepository.createPlantelesBatch(plantelesPayload);

    if (batchPlantelError) {
      console.error("Error al crear planteles en lote:", batchPlantelError);
    }

    return {
      message: `Se inscribieron ${idsAInscribir.length} equipos correctamente`,
      count: idsAInscribir.length,
      inscripciones: nuevasInscripciones,
    };
  },

  /**
   * Inscribe múltiples jugadores a un plantel en lote.
   */
  async agregarJugadoresBatch(plantelId, jugadores, organizadorId) {
    if (!Array.isArray(jugadores) || jugadores.length === 0) {
      throw new AppError("Se requiere una lista de jugadores", 400);
    }

    // 1. Obtener plantel con su temporada y equipo para verificar ownership
    const { data: plantel, error: plantelError } = await inscripcionRepository.findPlantelById(plantelId);

    if (plantelError || !plantel)
      throw new AppError("Plantel no encontrado", 404);

    // 2. Aislamiento
    await LigaService.verifyOwnership(plantel.equipo.liga_id, organizadorId);

    // 3. Hard Lock de temporada
    await TemporadaService.validateNotFinalizada(plantel.temporada_id);

    // 4. Verificar cupo actual
    const { count: jugadoresActuales, error: countError } = await inscripcionRepository.countJugadoresInPlantel(plantelId);

    if (countError)
      throw new AppError(`Error verificando cupo: ${countError.message}`, 500);

    const espacioDisponible = plantel.limite_jugadores - jugadoresActuales;
    if (jugadores.length > espacioDisponible) {
      throw new AppError(
        `No hay cupo suficiente. Espacio disponible: ${espacioDisponible}. Intentas inscribir: ${jugadores.length}`,
        400
      );
    }

    // 5. Verificar duplicidad de jugadores en la misma temporada (en cualquier equipo)
    const jugadorIds = jugadores.map(j => j.jugador_id);
    const { data: inscripcionesExistentes, error: dupError } = await inscripcionRepository.findJugadoresInscripcionesInTemporada(jugadorIds, plantel.temporada_id);

    if (dupError) throw new AppError(`Error verificando duplicidad: ${dupError.message}`, 500);

    if (inscripcionesExistentes.length > 0) {
      const nombresEquipos = [...new Set(inscripcionesExistentes.map(i => i.plantel?.equipo?.nombre))].join(", ");
      throw new AppError(
        `Algunos jugadores ya están inscritos en otros equipos (${nombresEquipos}) para esta temporada.`,
        409
      );
    }

    // 6. Preparar payload
    const payload = jugadores.map(j => ({
      jugador_id: j.jugador_id,
      plantel_id: plantelId,
      dorsal: j.dorsal ? Number(j.dorsal) : null,
      posicion: j.posicion || 'mediocampista',
      estado: "activo"
    }));

    // 7. Insertar en lote
    const { data: nuevasInscripciones, error: insError } = await inscripcionRepository.createInscripcionesJugadorBatch(payload);

    if (insError) {
      if (insError.code === "23505") {
        throw new AppError("Uno o más jugadores ya están en este plantel o tienen dorsales duplicados", 409);
      }
      throw new AppError(`Error al inscribir jugadores en bloque: ${insError.message}`, 500);
    }

    return nuevasInscripciones;
  }
};

export default InscripcionService;
