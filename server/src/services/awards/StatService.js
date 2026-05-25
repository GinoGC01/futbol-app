import { statRepository } from '../../repositories/statRepository.js'
import AppError from '../../utils/AppError.js'

/**
 * StatService: Proxy de alta eficiencia para las vistas de PostgreSQL.
 * NO calcula nada. Aplica filtros y devuelve los resultados de las vistas.
 * Diseñado como cache-friendly: cada método acepta filtros exactos
 * que producen resultados deterministas (mismos filtros = mismos datos),
 * facilitando una futura capa de caché (Redis, in-memory, etc.).
 */
class StatService {
  /**
   * Tabla de posiciones de una fase.
   * Vista: vista_tabla_posiciones
   */
  async getTablaPosiciones(filters = {}) {
    const { fase_id, temporada_id } = filters

    if (!fase_id && !temporada_id) throw new AppError('fase_id o temporada_id es requerido para la tabla de posiciones', 400)

    let query = statRepository.getTablaPosicionesQuery()

    if (fase_id) query = query.eq('fase_id', fase_id)
    if (temporada_id) query = query.eq('temporada_id', temporada_id)

    const { data, error } = await query

    if (error) throw new AppError(`Error consultando tabla de posiciones: ${error.message}`, 500)

    return data || []
  }

  /**
   * Ranking de goleadores.
   * Vista: vista_goleadores
   * Filtros opcionales: temporada_id, fase_id
   */
  async getGoleadores(filters = {}) {
    const { temporada_id, fase_id, limit = 50 } = filters

    let query = statRepository.getGoleadoresQuery()

    if (temporada_id) query = query.eq('temporada_id', temporada_id)
    if (fase_id) query = query.eq('fase_id', fase_id)

    // Solo devolver jugadores con al menos 1 gol
    query = query.gt('goles', 0)
    query = query.limit(Number(limit))

    const { data, error } = await query

    if (error) throw new AppError(`Error consultando goleadores: ${error.message}`, 500)

    return data || []
  }

  /**
   * Ranking de tarjetas por temporada/fase.
   * Vista: vista_tarjetas
   */
  async getTarjetas(filters = {}) {
    const { temporada_id, fase_id, limit = 50 } = filters

    let query = statRepository.getTarjetasQuery()

    if (temporada_id) query = query.eq('temporada_id', temporada_id)
    if (fase_id) query = query.eq('fase_id', fase_id)

    // Solo jugadores que tengan al menos 1 tarjeta
    query = query.or('amarillas.gt.0,rojas.gt.0')
    query = query.limit(Number(limit))

    const { data, error } = await query

    if (error) throw new AppError(`Error consultando tarjetas: ${error.message}`, 500)

    return data || []
  }

  /**
   * Fixture completo de una jornada.
   * Vista: vista_fixture
   */
  async getFixture(jornadaId) {
    if (!jornadaId) throw new AppError('jornada_id es requerido', 400)

    const { data, error } = await statRepository.findFixtureByJornada(jornadaId)

    if (error) throw new AppError(`Error consultando fixture: ${error.message}`, 500)

    return data || []
  }

  /**
   * Detalle de un equipo: datos + historial de pagos.
   * Usa tabla directa + vista_pagos para enriquecer.
   */
  async getEquipoDetalle(equipoId) {
    if (!equipoId) throw new AppError('equipo_id es requerido', 400)

    // 1. Datos básicos del equipo y liga
    const { data: equipo, error: eqErr } = await statRepository.findEquipoWithLiga(equipoId)

    if (eqErr || !equipo) throw new AppError('Equipo no encontrado', 404)

    // 2. Obtener la inscripción más reciente para saber la temporada actual del equipo (excluyendo archivadas)
    const { data: latestInscripcion } = await statRepository.findLatestInscripcionEquipo(equipoId)

    // 3. Obtener el plantel_id desde la tabla plantel (hermana de inscripcion_equipo, ambas linked por equipo_id + temporada_id)
    let plantelId = null
    if (latestInscripcion) {
      const { data: plantelRecord } = await statRepository.findPlantelByEquipoAndTemporada(
        equipoId,
        latestInscripcion.temporada_id
      )
      plantelId = plantelRecord?.id
    }

    // 4. Ejecutar queries de soporte en paralelo
    const [statsResult, plantelResult, fixtureResult, pagosResult] = await Promise.all([
      // Estadísticas en la tabla de posiciones
      latestInscripcion 
        ? statRepository.findTablaPosicionesForEquipo(equipoId, latestInscripcion.temporada_id)
        : Promise.resolve({ data: null }),
      
      // Plantel actual
      plantelId
        ? statRepository.findInscripcionJugadorWithJugador(plantelId)
        : Promise.resolve({ data: [] }),

      // Fixture del equipo (en la temporada actual)
      latestInscripcion
        ? statRepository.findFixtureForEquipo(equipoId, latestInscripcion.temporada_id)
        : Promise.resolve({ data: [] }),

      // Historial de pagos (para admin/interno)
      statRepository.findPagosByEquipo(equipoId)
    ])

    return {
      equipo,
      liga: equipo.liga,
      stats: statsResult.data,
      plantel: plantelResult.data?.map(p => ({ ...p.jugador, ...p })) || [], // Flatten for easier UI consumption
      fixture: fixtureResult.data?.map(p => ({ ...p, estado: p.partido_estado })) || [],
      historial_pagos: pagosResult.data || []
    }
  }

  /**
   * Detalle de un jugador: datos personales, equipo actual y estadísticas.
   */
  async getJugadorDetalle(inscripcionJugadorId) {
    if (!inscripcionJugadorId) throw new AppError('inscripcion_jugador_id es requerido', 400)

    const { data: inscripcion, error } = await statRepository.findJugadorDetalle(inscripcionJugadorId)
    if (error || !inscripcion) throw new AppError('Jugador no encontrado', 404)

    const jugador = inscripcion.jugador
    const plantel = inscripcion.plantel
    const equipo = plantel?.equipo

    let goles = 0, amarillas = 0, rojas = 0
    if (jugador && plantel?.temporada_id) {
      const [golesRes, tarjetasRes] = await Promise.all([
        statRepository.findGoleadorByJugadorAndTemporada(jugador.id, plantel.temporada_id),
        statRepository.findTarjetasByJugadorAndTemporada(jugador.id, plantel.temporada_id)
      ])
      goles = golesRes.data?.goles ?? 0
      amarillas = tarjetasRes.data?.amarillas ?? 0
      rojas = tarjetasRes.data?.rojas ?? 0
    }

    return {
      jugador: {
        id: jugador.id,
        nombre: jugador.nombre,
        apellido: jugador.apellido,
        dni: jugador.dni,
        foto_url: jugador.foto_url
      },
      equipo: equipo ? {
        id: equipo.id,
        nombre: equipo.nombre
      } : null,
      stats: {
        goles,
        asistencias: 0,
        amarillas,
        rojas,
        mvps: 0
      }
    }
  }

  /**
   * Eventos (goles y tarjetas) de un partido — público, sin auth.
   */
  async getPartidoEventos(partidoId) {
    if (!partidoId) throw new AppError('partido_id es requerido', 400)

    const { goles, tarjetas } = await statRepository.findEventosByPartido(partidoId)

    return { goles, tarjetas }
  }

  /**
   * Premios publicados de una temporada (PÚBLICO).
   * Solo devuelve premios con publicado = true.
   */
  async getPremiosPublicados(temporadaId) {
    if (!temporadaId) throw new AppError('temporada_id es requerido', 400)

    const { data, error } = await statRepository.findPremiosPublicados(temporadaId)

    if (error) throw new AppError(`Error consultando premios: ${error.message}`, 500)

    return data || []
  }
}

const instance = new StatService()
export default instance
