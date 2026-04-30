import { supabaseAdmin } from '../../lib/supabase.js'
import LigaService from '../identity/LigaService.js'
import TemporadaService from '../competition/TemporadaService.js'
import FixtureEngine from './FixtureEngine.js'
import AppError from '../../utils/AppError.js'

/**
 * Máquina de estados válida para partido:
 *   programado → en_juego → finalizado
 *   programado → postergado
 *   en_juego → suspendido
 * Transiciones inválidas lanzan AppError.
 */
const TRANSICIONES_VALIDAS = {
  programado:  ['en_juego', 'postergado'],
  en_juego:    ['finalizado', 'suspendido'],
  postergado:  ['programado'],
  suspendido:  ['programado'],
  finalizado:  []  // Terminal — inmutable
}

class PartidoService {
  /**
   * Resuelve la cadena de ownership de un partido:
   * partido → jornada → fase → temporada → liga → organizador_id
   * Devuelve { partido, temporada_id, liga_id } o lanza AppError.
   */
  async resolveOwnershipChain(partidoId, organizadorId) {
    const { data: partido, error } = await supabaseAdmin
      .from('partido')
      .select(`
        id, estado, goles_local, goles_visitante,
        equipo_local_id, equipo_visitante_id,
        jornada_id, fecha_hora, cancha,
        jornada:jornada!inner(
          id, fase_id,
          fase:fase!inner(
            id, temporada_id,
            temporada:temporada!inner(
              id, estado, liga_id
            )
          )
        )
      `)
      .eq('id', partidoId)
      .maybeSingle()

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
    const { data: jornada, error: jErr } = await supabaseAdmin
      .from('jornada')
      .select(`
        id,
        fase:fase!inner(
          temporada_id,
          temporada:temporada!inner(estado, liga_id)
        )
      `)
      .eq('id', jornadaId)
      .maybeSingle()

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
    const { data: equipos, error: eqErr } = await supabaseAdmin
      .from('equipo')
      .select('id, liga_id')
      .in('id', [equipo_local_id, equipo_visitante_id])

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

    const { data: nuevoPartido, error: insErr } = await supabaseAdmin
      .from('partido')
      .insert([payload])
      .select('id, jornada_id, equipo_local_id, equipo_visitante_id, estado, fecha_hora, cancha')
      .single()

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

    const { data: updated, error } = await supabaseAdmin
      .from('partido')
      .update({ estado: nuevoEstado })
      .eq('id', partidoId)
      .select('id, estado, goles_local, goles_visitante')
      .single()

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

    if (!['en_juego', 'finalizado'].includes(partido.estado)) {
      throw new AppError(
        `No se pueden registrar goles con el partido en estado "${partido.estado}". Debe estar "en_juego" o "finalizado".`,
        400
      )
    }

    const { data: updated, error } = await supabaseAdmin
      .from('partido')
      .update({
        goles_local: Number(golesLocal),
        goles_visitante: Number(golesVisitante)
      })
      .eq('id', partidoId)
      .select('id, estado, goles_local, goles_visitante')
      .single()

    if (error) throw new AppError(`Error registrando resultado: ${error.message}`, 500)

    return updated
  }

  /**
   * Obtiene el fixture completo de una jornada con resultados.
   */
  async getFixtureByJornada(jornadaId, organizadorId) {
    // Resolver ownership de la jornada
    const { data: jornada, error: jErr } = await supabaseAdmin
      .from('jornada')
      .select(`
        id, numero, estado, fecha_tentativa,
        fase:fase!inner(
          temporada_id,
          temporada:temporada!inner(liga_id)
        )
      `)
      .eq('id', jornadaId)
      .maybeSingle()

    if (jErr || !jornada) throw new AppError('Jornada no encontrada', 404)
    await LigaService.verifyOwnership(jornada.fase.temporada.liga_id, organizadorId)

    const { data: partidos, error: pErr } = await supabaseAdmin
      .from('partido')
      .select(`
        id, estado, goles_local, goles_visitante, fecha_hora, cancha,
        equipo_local:equipo!equipo_local_id(id, nombre, escudo_url, color_principal),
        equipo_visitante:equipo!equipo_visitante_id(id, nombre, escudo_url, color_principal)
      `)
      .eq('jornada_id', jornadaId)
      .order('fecha_hora', { ascending: true })

    if (pErr) throw new AppError(`Error obteniendo fixture: ${pErr.message}`, 500)

    return {
      jornada: { id: jornada.id, numero: jornada.numero, estado: jornada.estado, fecha_tentativa: jornada.fecha_tentativa },
      partidos: partidos || []
    }
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

    const { data: updated, error } = await supabaseAdmin
      .from('partido')
      .update(payload)
      .eq('id', partidoId)
      .select('id, fecha_hora, cancha, estado')
      .single()

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
    const { data: fase, error: faseErr } = await supabaseAdmin
      .from('fase')
      .select(`
        id, nombre, tipo, puntos_victoria, puntos_empate, ida_y_vuelta,
        temporada:temporada_id(
          id, liga_id, estado,
          liga:liga_id(id, tipo_futbol)
        ),
        jornadas:jornada(id, numero)
      `)
      .eq('id', faseId)
      .single()

    if (faseErr || !fase) throw new AppError('Fase no encontrada', 404)

    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    if (fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede generar fixture (Modo Bóveda)', 403)
    }

    if (!equipoIds || equipoIds.length < 2) {
      throw new AppError('Se necesitan al menos 2 equipos para generar el fixture', 400)
    }

    // Validar que todos los equipos pertenecen a la liga
    const { data: equiposValidos, error: eqErr } = await supabaseAdmin
      .from('equipo')
      .select('id')
      .eq('liga_id', fase.temporada.liga_id)
      .in('id', equipoIds)

    if (eqErr) throw new AppError(`Error validando equipos: ${eqErr.message}`, 500)
    if (equiposValidos.length !== equipoIds.length) {
      throw new AppError('Uno o más equipos no pertenecen a esta liga', 400)
    }

    // 1.1 Validar que todos los equipos están inscritos en esta temporada específica
    const { data: inscripcionesTemporada, error: insCheckErr } = await supabaseAdmin
      .from('inscripcion_equipo')
      .select('equipo_id')
      .eq('temporada_id', fase.temporada.id)
      .in('equipo_id', equipoIds)

    if (insCheckErr) throw new AppError(`Error validando inscripciones: ${insCheckErr.message}`, 500)
    if (inscripcionesTemporada.length !== equipoIds.length) {
      throw new AppError('Uno o más equipos seleccionados no están inscritos en esta temporada', 400)
    }

    // 2. Validación de Jugadores Activos por Equipo
    const { data: planteles, error: pError } = await supabaseAdmin
      .from('plantel')
      .select(`
        equipo_id,
        inscripciones:inscripcion_jugador(id, estado)
      `)
      .eq('temporada_id', fase.temporada.id)
      .in('equipo_id', equipoIds)

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

      const { data: insertadas, error: jorErr } = await supabaseAdmin
        .from('jornada')
        .insert(nuevasJornadas)
        .select('id, numero')

      if (jorErr) throw new AppError(`Error creando jornadas automáticas: ${jorErr.message}`, 500)

      jornadas = [...jornadas, ...insertadas].sort((a, b) => a.numero - b.numero)
    }

    // 4. Borrar partidos existentes de TODAS las jornadas de esta fase
    const jornadaIds = jornadas.map(j => j.id)
    const { error: deleteErr } = await supabaseAdmin
      .from('partido')
      .delete()
      .in('jornada_id', jornadaIds)

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
    const { data: insertados, error: insErr } = await supabaseAdmin
      .from('partido')
      .insert(allPartidos)
      .select('id, jornada_id, equipo_local_id, equipo_visitante_id')

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
}

export default new PartidoService()
