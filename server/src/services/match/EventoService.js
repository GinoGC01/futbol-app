import { eventoRepository } from '../../repositories/eventoRepository.js'
import { partidoRepository } from '../../repositories/partidoRepository.js'
import PartidoService from './PartidoService.js'
import SancionService from './SancionService.js'
import AppError from '../../utils/AppError.js'

const TIPOS_TARJETA_VALIDOS = ['amarilla', 'roja', 'doble_amarilla']

class EventoService {
  /**
   * Valida que un inscripcion_jugador_id pertenezca a uno de los dos equipos del partido.
   * Impide que se registren goles o tarjetas de "jugadores fantasma".
   */
  async validarJugadorEnPartido(inscripcionJugadorId, partido) {
    const { data: inscripcion, error } = await eventoRepository.findInscripcionWithPlantel(inscripcionJugadorId)

    if (error || !inscripcion) {
      throw new AppError('Inscripción de jugador no encontrada', 404)
    }

    const equipoDelJugador = inscripcion.plantel.equipo_id
    if (equipoDelJugador !== partido.equipo_local_id && equipoDelJugador !== partido.equipo_visitante_id) {
      throw new AppError(
        'El jugador no pertenece a ninguno de los dos equipos de este partido. Jugador fantasma rechazado.',
        403
      )
    }

    return { inscripcion, equipoDelJugador }
  }

  /**
   * Registra un gol en un partido.
   */
  async registrarGol(partidoId, organizadorId, data) {
    const { inscripcion_jugador_id, minuto, es_penal = false, es_contra = false } = data

    // 1. Cadena de ownership + Bóveda
    const { partido, temporadaEstado } = await PartidoService.resolveOwnershipChain(partidoId, organizadorId)

    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se pueden registrar goles (Modo Bóveda)', 403)
    }

    // 2. Máquina de estados: solo en_juego, entre_tiempo o finalizado
    if (!['en_juego', 'entre_tiempo', 'finalizado'].includes(partido.estado)) {
      throw new AppError(
        `No se pueden registrar goles con el partido en estado "${partido.estado}"`,
        400
      )
    }

    // 3. Roster Check: ¿el jugador está en alguno de los dos equipos?
    await this.validarJugadorEnPartido(inscripcion_jugador_id, partido)

    // 4. Insertar gol
    const payload = {
      partido_id: partidoId,
      inscripcion_jugador_id,
      es_penal: Boolean(es_penal),
      es_contra: Boolean(es_contra)
    }
    if (minuto !== undefined && minuto !== null) payload.minuto = Number(minuto)

    const { data: gol, error } = await eventoRepository.createGol(payload)

    if (error) throw new AppError(`Error al registrar gol: ${error.message}`, 500)

    // 5. Sincronizar marcador del partido
    await this._syncGolesPartido(partidoId)

    return gol
  }

  /**
   * Recalcula los goles local/visitante basados en la tabla 'gol' 
   * y actualiza el registro del partido.
   */
  async _syncGolesPartido(partidoId) {
    // 1. Obtener datos del partido
    const { data: partido, error: pError } = await partidoRepository.findPartidoForSync(partidoId)
    
    if (pError || !partido) return

    // 2. Traer todos los goles del partido con el equipo del jugador
    const { data: goles, error: gError } = await eventoRepository.findGolesWithEquiposByPartido(partidoId)

    if (gError) return

    // 3. Contabilizar
    let local = 0
    let visitante = 0

    goles.forEach(g => {
      const equipoDelJugador = g.inscripcion_jugador.plantel.equipo_id
      const esContra = g.es_contra

      if (!esContra) {
        if (equipoDelJugador === partido.equipo_local_id) local++
        else if (equipoDelJugador === partido.equipo_visitante_id) visitante++
      } else {
        // Autogol: suma para el equipo contrario
        if (equipoDelJugador === partido.equipo_local_id) visitante++
        else if (equipoDelJugador === partido.equipo_visitante_id) local++
      }
    })

    // 4. Update tabla partido
    await partidoRepository.updatePartidoMarcador(partidoId, local, visitante)
  }

  /**
   * Registra una tarjeta en un partido.
   * Si es roja o doble_amarilla, dispara automáticamente una sanción.
   */
  async registrarTarjeta(partidoId, organizadorId, data) {
    const { inscripcion_jugador_id, tipo, minuto } = data

    // 1. Validar enum de tarjeta antes de llegar a BD
    if (!TIPOS_TARJETA_VALIDOS.includes(tipo)) {
      throw new AppError(`Tipo de tarjeta no válido. Permitidos: ${TIPOS_TARJETA_VALIDOS.join(', ')}`, 400)
    }

    // 2. Cadena de ownership + Bóveda
    const { partido, temporadaEstado } = await PartidoService.resolveOwnershipChain(partidoId, organizadorId)

    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se pueden registrar tarjetas (Modo Bóveda)', 403)
    }

    if (!['en_juego', 'entre_tiempo', 'finalizado'].includes(partido.estado)) {
      throw new AppError(
        `No se pueden registrar tarjetas con el partido en estado "${partido.estado}"`,
        400
      )
    }

    // 3. Roster Check
    await this.validarJugadorEnPartido(inscripcion_jugador_id, partido)

    // 4. Insertar tarjeta
    const payload = {
      partido_id: partidoId,
      inscripcion_jugador_id,
      tipo
    }
    if (minuto !== undefined && minuto !== null) payload.minuto = Number(minuto)

    const { data: tarjeta, error } = await eventoRepository.createTarjeta(payload)

    if (error) throw new AppError(`Error al registrar tarjeta: ${error.message}`, 500)

    // 5. Impacto Disciplinario: roja o doble_amarilla → Sanción automática
    let sancionGenerada = null
    if (tipo === 'roja' || tipo === 'doble_amarilla') {
      const causa = tipo === 'roja'
        ? 'Expulsión por tarjeta roja directa'
        : 'Expulsión por doble amarilla'

      sancionGenerada = await SancionService.crearSancion(inscripcion_jugador_id, {
        tarjeta_id: tarjeta.id,
        causa,
        fechas_suspension: 1  // Mínimo 1 fecha. El admin puede aumentar luego.
      })
    }

    return { tarjeta, sancionGenerada }
  }

  /**
   * Actualiza un gol existente.
   */
  async actualizarGol(partidoId, organizadorId, golId, data) {
    const { partido, temporadaEstado } = await PartidoService.resolveOwnershipChain(partidoId, organizadorId)

    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede modificar (Modo Bóveda)', 403)
    }

    if (!['en_juego', 'entre_tiempo', 'finalizado'].includes(partido.estado)) {
      throw new AppError(`No se pueden modificar goles con el partido en estado "${partido.estado}"`, 400)
    }

    const { data: gol } = await eventoRepository.findGolById(golId)
    if (!gol || gol.partido_id !== partidoId) {
      throw new AppError('Gol no encontrado en este partido', 404)
    }

    const payload = {}
    if (data.minuto !== undefined) payload.minuto = Number(data.minuto)
    if (data.es_penal !== undefined) payload.es_penal = Boolean(data.es_penal)
    if (data.es_contra !== undefined) payload.es_contra = Boolean(data.es_contra)

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay campos para actualizar', 400)
    }

    const { data: updated, error } = await eventoRepository.updateGol(golId, payload)
    if (error) throw new AppError(`Error actualizando gol: ${error.message}`, 500)

    await this._syncGolesPartido(partidoId)

    return updated
  }

  /**
   * Elimina un gol.
   */
  async eliminarGol(partidoId, organizadorId, golId) {
    const { partido, temporadaEstado } = await PartidoService.resolveOwnershipChain(partidoId, organizadorId)

    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede modificar (Modo Bóveda)', 403)
    }

    if (!['en_juego', 'entre_tiempo', 'finalizado'].includes(partido.estado)) {
      throw new AppError(`No se pueden eliminar goles con el partido en estado "${partido.estado}"`, 400)
    }

    const { data: gol } = await eventoRepository.findGolById(golId)
    if (!gol || gol.partido_id !== partidoId) {
      throw new AppError('Gol no encontrado en este partido', 404)
    }

    const { error } = await eventoRepository.deleteGol(golId)
    if (error) throw new AppError(`Error eliminando gol: ${error.message}`, 500)

    await this._syncGolesPartido(partidoId)
  }

  /**
   * Actualiza una tarjeta existente.
   */
  async actualizarTarjeta(partidoId, organizadorId, tarjetaId, data) {
    const { partido, temporadaEstado } = await PartidoService.resolveOwnershipChain(partidoId, organizadorId)

    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede modificar (Modo Bóveda)', 403)
    }

    if (!['en_juego', 'entre_tiempo', 'finalizado'].includes(partido.estado)) {
      throw new AppError(`No se pueden modificar tarjetas con el partido en estado "${partido.estado}"`, 400)
    }

    const { data: tarjeta } = await eventoRepository.findTarjetaById(tarjetaId)
    if (!tarjeta || tarjeta.partido_id !== partidoId) {
      throw new AppError('Tarjeta no encontrada en este partido', 404)
    }

    const payload = {}
    if (data.minuto !== undefined) payload.minuto = Number(data.minuto)
    if (data.tipo !== undefined) {
      if (!['amarilla', 'roja', 'doble_amarilla'].includes(data.tipo)) {
        throw new AppError('Tipo de tarjeta no válido', 400)
      }
      payload.tipo = data.tipo
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay campos para actualizar', 400)
    }

    const { data: updated, error } = await eventoRepository.updateTarjeta(tarjetaId, payload)
    if (error) throw new AppError(`Error actualizando tarjeta: ${error.message}`, 500)

    return updated
  }

  /**
   * Elimina una tarjeta.
   */
  async eliminarTarjeta(partidoId, organizadorId, tarjetaId) {
    const { partido, temporadaEstado } = await PartidoService.resolveOwnershipChain(partidoId, organizadorId)

    if (temporadaEstado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede modificar (Modo Bóveda)', 403)
    }

    if (!['en_juego', 'entre_tiempo', 'finalizado'].includes(partido.estado)) {
      throw new AppError(`No se pueden eliminar tarjetas con el partido en estado "${partido.estado}"`, 400)
    }

    const { data: tarjeta } = await eventoRepository.findTarjetaById(tarjetaId)
    if (!tarjeta || tarjeta.partido_id !== partidoId) {
      throw new AppError('Tarjeta no encontrada en este partido', 404)
    }

    const { error } = await eventoRepository.deleteTarjeta(tarjetaId)
    if (error) throw new AppError(`Error eliminando tarjeta: ${error.message}`, 500)
  }

  /**
   * Obtiene los eventos (goles y tarjetas) de un partido.
   */
  async getEventosByPartido(partidoId, organizadorId) {
    await PartidoService.resolveOwnershipChain(partidoId, organizadorId)

    const [golesResult, tarjetasResult] = await Promise.all([
      eventoRepository.findGolesByPartido(partidoId),
      eventoRepository.findTarjetasByPartido(partidoId)
    ])

    if (golesResult.error) throw new AppError(`Error obteniendo goles: ${golesResult.error.message}`, 500)
    if (tarjetasResult.error) throw new AppError(`Error obteniendo tarjetas: ${tarjetasResult.error.message}`, 500)

    return {
      goles: golesResult.data || [],
      tarjetas: tarjetasResult.data || []
    }
  }
}

const instance = new EventoService()
export default instance
