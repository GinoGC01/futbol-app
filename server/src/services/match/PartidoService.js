import { supabaseAdmin } from '../../lib/supabase.js'
import LigaService from '../identity/LigaService.js'
import TemporadaService from '../competition/TemporadaService.js'
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

    // Aislamiento Total
    await LigaService.verifyOwnership(ligaId, organizadorId)

    return { partido, temporadaId, ligaId, temporadaEstado }
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
}

export default new PartidoService()
