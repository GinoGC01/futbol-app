import { partidoRepository } from '../../repositories/partidoRepository.js'
import LigaService from '../identity/LigaService.js'
import TemporadaService from '../competition/TemporadaService.js'
import FixtureEngine from './FixtureEngine.js'
import AppError from '../../utils/AppError.js'

/**
 * Máquina de estados válida para partido:
 *   programado → en_juego → finalizado
 *   programado → postergado
 *   en_juego → suspendido
 *   en_juego → entre_tiempo → en_juego  (pausa de entretiempo)
 * Transiciones inválidas lanzan AppError.
 */
const TRANSICIONES_VALIDAS = {
  programado:     ['en_juego', 'postergado'],
  en_juego:       ['finalizado', 'suspendido', 'entre_tiempo'],
  entre_tiempo:   ['en_juego'],
  postergado:     ['programado'],
  suspendido:     ['programado'],
  finalizado:     []  // Terminal — inmutable
}

class PartidoService {
  /**
   * Resuelve la cadena de ownership de un partido:
   * partido → jornada → fase → temporada → liga → organizador_id
   * Devuelve { partido, temporada_id, liga_id } o lanza AppError.
   */
  async resolveOwnershipChain(partidoId, organizadorId) {
    const { data: partido, error } = await partidoRepository.findPartidoWithOwnership(partidoId)

    if (error || !partido) throw new AppError('Partido no encontrado', 404)

    const ligaId = partido.jornada.fase.temporada.liga_id
    const temporadaId = partido.jornada.fase.temporada.id
    const temporadaEstado = partido.jornada.fase.temporada.estado
    const jornadaEstado = partido.jornada.estado

    // Aislamiento Total
    await LigaService.verifyOwnership(ligaId, organizadorId)

    return { partido, temporadaId, ligaId, temporadaEstado, jornadaEstado }
  }

  /**
   * Crea un partido dentro de una jornada.
   */
  async createPartido(jornadaId, organizadorId, data) {
    const { equipo_local_id, equipo_visitante_id, fecha_hora, cancha } = data

    // 1. Resolver cadena: jornada → fase → temporada → liga
    const { data: jornada, error: jErr } = await partidoRepository.findJornadaForPartidoCreation(jornadaId)

    if (jErr || !jornada) throw new AppError('Jornada no encontrada', 404)

    const ligaId = jornada.fase.temporada.liga_id
    await LigaService.verifyOwnership(ligaId, organizadorId)

    // 2. Hard Lock
    if (jornada.fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se pueden agregar partidos (Modo Bóveda)', 403)
    }

    if (jornada.estado === 'cerrada') {
      throw new AppError('La jornada está cerrada: no se pueden agregar partidos', 403)
    }

    // 3. Validar que ambos equipos pertenezcan a la misma liga
    const { data: equipos, error: eqErr } = await partidoRepository.findEquiposForValidation([equipo_local_id, equipo_visitante_id])

    if (eqErr || !equipos || equipos.length !== 2) {
      throw new AppError('Uno o ambos equipos no fueron encontrados', 404)
    }

    for (const eq of equipos) {
      if (eq.liga_id !== ligaId) {
        throw new AppError(`El equipo ${eq.id} no pertenece a esta liga`, 400)
      }
    }

    const payload = {
      jornada_id: jornadaId,
      equipo_local_id,
      equipo_visitante_id,
      estado: 'programado'
    }
    if (fecha_hora) payload.fecha_hora = fecha_hora
    if (cancha) payload.cancha = cancha.trim()

    const { data: nuevoPartido, error: insErr } = await partidoRepository.createPartido(payload)

    if (insErr) {
      if (insErr.message?.includes('equipos_distintos')) {
        throw new AppError('Un equipo no puede jugar contra sí mismo', 400)
      }
      throw new AppError(`Error al crear partido: ${insErr.message}`, 500)
    }

    return nuevoPartido
  }

  /**
   * Cambia el estado de un partido respetando la máquina de estados.
   */
  async cambiarEstado(partidoId, organizadorId, nuevoEstado) {
    const { partido, temporadaEstado } = await this.resolveOwnershipChain(partidoId, organizadorId)

    // Hard Lock
    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede modificar el estado del partido (Modo Bóveda)', 403)
    }

    if (partido.jornada.estado === 'cerrada') {
      throw new AppError('La jornada está cerrada: no se puede modificar el estado del partido', 403)
    }

    const transicionesPermitidas = TRANSICIONES_VALIDAS[partido.estado]
    if (!transicionesPermitidas || !transicionesPermitidas.includes(nuevoEstado)) {
      throw new AppError(
        `Transición inválida: "${partido.estado}" → "${nuevoEstado}". Permitidas: [${(transicionesPermitidas || []).join(', ')}]`,
        400
      )
    }

    const { data: updated, error } = await partidoRepository.updatePartidoEstado(partidoId, nuevoEstado)

    if (error) throw new AppError(`Error cambiando estado: ${error.message}`, 500)

    return updated
  }

  /**
   * Registra el resultado final (goles_local, goles_visitante).
   * Solo se permite si el partido está en_juego o finalizado.
   */
  async registrarResultado(partidoId, organizadorId, golesLocal, golesVisitante) {
    const { partido, temporadaEstado } = await this.resolveOwnershipChain(partidoId, organizadorId)

    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se pueden editar resultados (Modo Bóveda)', 403)
    }

    if (partido.jornada.estado === 'cerrada') {
      throw new AppError('La jornada está cerrada: no se pueden editar resultados', 403)
    }

    if (!['en_juego', 'entre_tiempo', 'finalizado'].includes(partido.estado)) {
      throw new AppError(
        `No se pueden registrar goles con el partido en estado "${partido.estado}". Debe estar "en_juego", "entre_tiempo" o "finalizado".`,
        400
      )
    }

    const { data: updated, error } = await partidoRepository.updatePartidoResultado(partidoId, golesLocal, golesVisitante)

    if (error) throw new AppError(`Error registrando resultado: ${error.message}`, 500)

    return updated
  }

  /**
   * Obtiene el fixture completo de una jornada con resultados.
   */
  async getFixtureByJornada(jornadaId, organizadorId) {
    // Resolver ownership de la jornada
    const { data: jornada, error: jErr } = await partidoRepository.findJornadaWithOwnership(jornadaId)

    if (jErr || !jornada) throw new AppError('Jornada no encontrada', 404)
    await LigaService.verifyOwnership(jornada.fase.temporada.liga_id, organizadorId)

    const { data: partidos, error: pErr } = await partidoRepository.findPartidosByJornada(jornadaId)

    if (pErr) throw new AppError(`Error obteniendo fixture: ${pErr.message}`, 500)

    return {
      jornada: { id: jornada.id, numero: jornada.numero, estado: jornada.estado, fecha_tentativa: jornada.fecha_tentativa },
      partidos: partidos || []
    }
  }

  /**
   * Returns all live/halftime matches for a temporada in a single query.
   * Minimal payload for the live widget — no stats, no players, no history.
   */
  async getLiveMatches(temporadaId, organizadorId) {
    // Verify ownership through temporada → liga
    const { data: temporada, error: tErr } = await partidoRepository.findTemporadaWithOwnership(temporadaId)

    if (tErr || !temporada) throw new AppError('Temporada no encontrada', 404)
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId)

    // Fetch all jornadas for this temporada
    const { data: fases, error: fErr } = await partidoRepository.findJornadasByTemporada(temporadaId)

    if (fErr) throw new AppError(`Error resolviendo jornadas: ${fErr.message}`, 500)

    const jornadaIds = fases?.flatMap(f => f.jornada?.map(j => j.id) || []) || []

    if (jornadaIds.length === 0) return []

    // Fetch live matches using the array of jornadaIds
    const { data: partidos, error: pErr } = await partidoRepository.findLiveMatchesByJornadas(jornadaIds)

    if (pErr) throw new AppError(`Error obteniendo partidos en vivo: ${pErr.message}`, 500)

    return partidos || []
  }

  /**
   * Actualiza datos logísticos del partido (cancha, hora).
   */
  async updateLogistica(partidoId, organizadorId, updateData) {
    const { partido, temporadaEstado } = await this.resolveOwnershipChain(partidoId, organizadorId)

    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede modificar la logística (Modo Bóveda)', 403)
    }

    if (partido.jornada.estado === 'cerrada') {
      throw new AppError('La jornada está cerrada: no se puede modificar la logística', 403)
    }

    const permitidos = ['fecha_hora', 'cancha']
    const payload = {}
    for (const key of permitidos) {
      if (updateData[key] !== undefined) payload[key] = updateData[key]
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay campos válidos para actualizar', 400)
    }

    const { data: updated, error } = await partidoRepository.updatePartidoLogistica(partidoId, payload)

    if (error) throw new AppError(`Error actualizando partido: ${error.message}`, 500)

    return updated
  }

  /**
   * Genera fixture automático usando el FixtureEngine (R1-R7 compliant).
   * - Valida ownership, equipos y planteles.
   * - Auto-crea jornadas faltantes si es necesario.
   * - Borra todos los partidos existentes de las jornadas de la fase antes de regenerar.
   * - Delega al FixtureEngine para la generación algorítmica.
   * - equipoIds: array de UUIDs de equipos seleccionados por el organizador.
   */
  async generateRoundRobin(faseId, organizadorId, equipoIds) {
    // 1. Obtener datos de la fase y liga asociada
    const { data: fase, error: faseErr } = await partidoRepository.findFaseForGeneration(faseId)

    if (faseErr || !fase) throw new AppError('Fase no encontrada', 404)

    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    if (fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede generar fixture (Modo Bóveda)', 403)
    }

    if (!equipoIds || equipoIds.length < 2) {
      throw new AppError('Se necesitan al menos 2 equipos para generar el fixture', 400)
    }

    // Validar que todos los equipos pertenecen a la liga
    const { data: equiposValidos, error: eqErr } = await partidoRepository.findEquiposValidosInLiga(fase.temporada.liga_id, equipoIds)

    if (eqErr) throw new AppError(`Error validando equipos: ${eqErr.message}`, 500)
    if (equiposValidos.length !== equipoIds.length) {
      throw new AppError('Uno o más equipos no pertenecen a esta liga', 400)
    }

    // 1.1 Validar que todos los equipos están inscritos en esta temporada específica
    const { data: inscripcionesTemporada, error: insCheckErr } = await partidoRepository.findInscripcionesTemporada(fase.temporada.id, equipoIds)

    if (insCheckErr) throw new AppError(`Error validando inscripciones: ${insCheckErr.message}`, 500)
    if (inscripcionesTemporada.length !== equipoIds.length) {
      throw new AppError('Uno o más equipos seleccionados no están inscritos en esta temporada', 400)
    }

    // 2. Validación de Jugadores Activos por Equipo
    const { data: planteles, error: pError } = await partidoRepository.findPlantelesForRosterCheck(fase.temporada.id, equipoIds)

    if (pError) throw new AppError(`Error al validar planteles: ${pError.message}`, 500)

    const rosterWarnings = []
    const tipoFutbol = fase.temporada.liga?.tipo_futbol || 'f5'
    const modalidad = parseInt(tipoFutbol.replace(/\D/g, '')) || 5

    equipoIds.forEach(eid => {
      const p = planteles.find(plt => plt.equipo_id === eid)
      const activos = p?.inscripciones?.filter(i => i.estado === 'activo')?.length || 0
      
      if (activos < modalidad) {
        rosterWarnings.push({
          equipo_id: eid,
          mensaje: `El equipo tiene solo ${activos} de ${modalidad} jugadores activos requeridos.`
        })
      }
    })

    // 3. Calcular jornadas necesarias vía FixtureEngine
    const totalRoundsNeeded = FixtureEngine.calculateRequiredRounds(equipoIds.length, fase.ida_y_vuelta)

    // Sort jornadas existentes by number
    let jornadas = (fase.jornadas || []).sort((a, b) => a.numero - b.numero)

    // Auto-crear jornadas faltantes si es necesario
    if (jornadas.length < totalRoundsNeeded) {
      const faltantes = totalRoundsNeeded - jornadas.length
      const startNumber = jornadas.length > 0 ? jornadas[jornadas.length - 1].numero + 1 : 1

      const nuevasJornadas = []
      for (let i = 0; i < faltantes; i++) {
        nuevasJornadas.push({
          fase_id: faseId,
          numero: startNumber + i,
          estado: 'programada'
        })
      }

      const { data: insertadas, error: jorErr } = await partidoRepository.createJornadas(nuevasJornadas)

      if (jorErr) throw new AppError(`Error creando jornadas automáticas: ${jorErr.message}`, 500)

      jornadas = [...jornadas, ...insertadas].sort((a, b) => a.numero - b.numero)
    }

    // 4. Borrar partidos existentes de TODAS las jornadas de esta fase
    const jornadaIds = jornadas.map(j => j.id)
    const { error: deleteErr } = await partidoRepository.deletePartidosByJornadas(jornadaIds)

    if (deleteErr) throw new AppError(`Error eliminando partidos existentes: ${deleteErr.message}`, 500)

    // 5. Generar fixture con FixtureEngine (R1-R7)
    const fixtureResult = FixtureEngine.generate(equipoIds, fase.ida_y_vuelta)

    // 6. Mapear rounds a jornadas y construir payload de inserciones
    const allPartidos = []
    for (let r = 0; r < fixtureResult.rounds.length; r++) {
      const jornadaId = jornadas[r].id
      for (const match of fixtureResult.rounds[r].matches) {
        allPartidos.push({
          jornada_id: jornadaId,
          equipo_local_id: match.local,
          equipo_visitante_id: match.visitante,
          estado: 'programado'
        })
      }
    }

    // 7. Insertar en batch
    const { data: insertados, error: insErr } = await partidoRepository.createPartidosBatch(allPartidos)

    if (insErr) throw new AppError(`Error insertando partidos: ${insErr.message}`, 500)

    return {
      message: `Fixture generado: ${insertados.length} partidos en ${fixtureResult.totalRounds} jornadas`,
      partidos_creados: insertados.length,
      jornadas_usadas: fixtureResult.totalRounds,
      jornadas_autocreadas: Math.max(0, totalRoundsNeeded - (fase.jornadas || []).length),
      ida_y_vuelta: fase.ida_y_vuelta,
      warnings: [...fixtureResult.warnings, ...rosterWarnings.map(w => w.mensaje)]
    }
  }

  /**
   * Genera un cuadro de eliminación directa usando el FixtureEngine.
   * - Valida ownership, equipos y planteles.
   * - Auto-crea jornadas (una por ronda, o dos si ida y vuelta).
   * - Construye el bracket completo con BYEs, slots vacíos y partidos reales.
   * - Solo inserta partidos de la primera ronda (y rondas con avances automáticos por BYE).
   * - Las rondas futuras se representan como slots vacíos.
   */
  async generateKnockout(faseId, organizadorId, equipoIds) {
    // 1. Obtener datos de la fase y liga asociada
    const { data: fase, error: faseErr } = await partidoRepository.findFaseForGeneration(faseId)

    if (faseErr || !fase) throw new AppError('Fase no encontrada', 404)

    // Reglas de negocio C-02: Dependencia de fases
    // R1: Si la fase de eliminación no es la primera, no se permite generación automática.
    if (fase.orden > 1) {
      throw new AppError('No se permite la generación automática de brackets para fases que dependen de una etapa anterior. Debes crear los partidos manualmente para definir los cruces según la clasificación.', 403)
    }

    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    if (fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede generar bracket (Modo Bóveda)', 403)
    }

    if (fase.tipo !== 'eliminacion_directa') {
      throw new AppError('Esta fase no es de eliminación directa. Usa generateRoundRobin para todos contra todos.', 400)
    }

    if (!equipoIds || equipoIds.length < 2) {
      throw new AppError('Se necesitan al menos 2 equipos para generar el cuadro de eliminación', 400)
    }

    // Validar que todos los equipos pertenecen a la liga
    const { data: equiposValidos, error: eqErr } = await partidoRepository.findEquiposValidosInLiga(fase.temporada.liga_id, equipoIds)

    if (eqErr) throw new AppError(`Error validando equipos: ${eqErr.message}`, 500)
    if (equiposValidos.length !== equipoIds.length) {
      throw new AppError('Uno o más equipos no pertenecen a esta liga', 400)
    }

    // Validar inscripciones en la temporada
    const { data: inscripcionesTemporada, error: insCheckErr } = await partidoRepository.findInscripcionesTemporada(fase.temporada.id, equipoIds)

    if (insCheckErr) throw new AppError(`Error validando inscripciones: ${insCheckErr.message}`, 500)
    if (inscripcionesTemporada.length !== equipoIds.length) {
      throw new AppError('Uno o más equipos seleccionados no están inscritos en esta temporada', 400)
    }

    // Validación de planteles
    const { data: planteles, error: pError } = await partidoRepository.findPlantelesForRosterCheck(fase.temporada.id, equipoIds)

    if (pError) throw new AppError(`Error al validar planteles: ${pError.message}`, 500)

    const rosterWarnings = []
    const tipoFutbol = fase.temporada.liga?.tipo_futbol || 'f5'
    const modalidad = parseInt(tipoFutbol.replace(/\D/g, '')) || 5

    equipoIds.forEach(eid => {
      const p = planteles.find(plt => plt.equipo_id === eid)
      const activos = p?.inscripciones?.filter(i => i.estado === 'activo')?.length || 0
      if (activos < modalidad) {
        rosterWarnings.push({
          equipo_id: eid,
          mensaje: `El equipo tiene solo ${activos} de ${modalidad} jugadores activos requeridos.`
        })
      }
    })

    // 2. Generar bracket con FixtureEngine
    const knockoutResult = FixtureEngine.generateKnockout(equipoIds, {
      idaYVuelta: fase.ida_y_vuelta
    })

    // 3. Calcular jornadas necesarias (una por ronda, o dos si ida y vuelta)
    const totalJornadasNeeded = fase.ida_y_vuelta
      ? knockoutResult.totalRounds * 2
      : knockoutResult.totalRounds

    let jornadas = (fase.jornadas || []).sort((a, b) => a.numero - b.numero)

    // Auto-crear jornadas faltantes
    if (jornadas.length < totalJornadasNeeded) {
      const faltantes = totalJornadasNeeded - jornadas.length
      const startNumber = jornadas.length > 0 ? jornadas[jornadas.length - 1].numero + 1 : 1

      const nuevasJornadas = []
      for (let i = 0; i < faltantes; i++) {
        nuevasJornadas.push({
          fase_id: faseId,
          numero: startNumber + i,
          estado: 'programada'
        })
      }

      const { data: insertadas, error: jorErr } = await partidoRepository.createJornadas(nuevasJornadas)

      if (jorErr) throw new AppError(`Error creando jornadas automáticas: ${jorErr.message}`, 500)

      jornadas = [...jornadas, ...insertadas].sort((a, b) => a.numero - b.numero)
    }

    // 4. Borrar partidos existentes de TODAS las jornadas de esta fase
    const jornadaIds = jornadas.map(j => j.id)
    const { error: deleteErr } = await partidoRepository.deletePartidosByJornadas(jornadaIds)

    if (deleteErr) throw new AppError(`Error eliminando partidos existentes: ${deleteErr.message}`, 500)

    // 5. Insertar partidos reales (primera ronda + avances automáticos)
    const allPartidos = []
    const bracketMap = [] // Track matchNumber -> jornada mapping for the bracket

    for (let r = 0; r < knockoutResult.rounds.length; r++) {
      const round = knockoutResult.rounds[r]
      const jornadaIdx = fase.ida_y_vuelta ? r * 2 : r

      for (const match of round.matches) {
        // Skip BYE matches — they don't need DB records
        if (match.isBye) continue

        // Only insert matches that have both teams resolved
        if (match.local && match.visitante) {
          allPartidos.push({
            jornada_id: jornadas[jornadaIdx].id,
            equipo_local_id: match.local,
            equipo_visitante_id: match.visitante,
            estado: 'programado'
          })

          // R8: Insert return leg match
          if (match.idaYVuelta && match.vuelta && jornadaIdx + 1 < jornadas.length) {
            allPartidos.push({
              jornada_id: jornadas[jornadaIdx + 1].id,
              equipo_local_id: match.vuelta.local,
              equipo_visitante_id: match.vuelta.visitante,
              estado: 'programado'
            })
          }
        }

        bracketMap.push({
          matchNumber: match.matchNumber,
          jornada_id: jornadas[jornadaIdx]?.id,
          round: match.round,
          roundName: match.roundName,
          local: match.local,
          visitante: match.visitante,
          localSource: match.localSource,
          visitanteSource: match.visitanteSource
        })
      }
    }

    // 6. Insertar en batch
    let insertados = []
    if (allPartidos.length > 0) {
      const { data: inserted, error: insErr } = await partidoRepository.createPartidosBatch(allPartidos)

      if (insErr) throw new AppError(`Error insertando partidos: ${insErr.message}`, 500)
      insertados = inserted
    }

    return {
      message: `Bracket generado: ${insertados.length} partidos en ${knockoutResult.totalRounds} rondas (${knockoutResult.roundNames.join(' → ')})`,
      mode: 'eliminacion_directa',
      partidos_creados: insertados.length,
      rondas: knockoutResult.totalRounds,
      rondas_nombres: knockoutResult.roundNames,
      bracket_size: knockoutResult.bracketSize,
      bye_count: knockoutResult.byeCount,
      jornadas_usadas: totalJornadasNeeded,
      jornadas_autocreadas: Math.max(0, totalJornadasNeeded - (fase.jornadas || []).length),
      ida_y_vuelta: fase.ida_y_vuelta,
      bracket: knockoutResult.bracket,
      bracketMap,
      warnings: [...knockoutResult.warnings, ...rosterWarnings.map(w => w.mensaje)]
    }
  }
}

const instance = new PartidoService()
export default instance
