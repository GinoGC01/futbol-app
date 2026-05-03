import { supabaseAdmin } from '../../lib/supabase.js'
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

    let query = supabaseAdmin.from('vista_tabla_posiciones').select('*')

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

    let query = supabaseAdmin
      .from('vista_goleadores')
      .select('*')

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

    let query = supabaseAdmin
      .from('vista_tarjetas')
      .select('*')

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

    const { data, error } = await supabaseAdmin
      .from('vista_fixture')
      .select('*')
      .eq('jornada_id', jornadaId)

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
    const { data: equipo, error: eqErr } = await supabaseAdmin
      .from('equipo')
      .select('*, liga:liga_id(*)')
      .eq('id', equipoId)
      .maybeSingle()

    if (eqErr || !equipo) throw new AppError('Equipo no encontrado', 404)

    // 2. Obtener la inscripción más reciente para saber la temporada actual del equipo (excluyendo archivadas)
    const { data: latestInscripcion } = await supabaseAdmin
      .from('inscripcion_equipo')
      .select('id, temporada_id, plantel_id, temporada!inner(deleted_at)')
      .eq('equipo_id', equipoId)
      .is('temporada.deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // 3. Ejecutar queries de soporte en paralelo
    const [statsResult, plantelResult, fixtureResult, pagosResult] = await Promise.all([
      // Estadísticas en la tabla de posiciones
      latestInscripcion 
        ? supabaseAdmin.from('vista_tabla_posiciones').select('*').eq('equipo_id', equipoId).eq('temporada_id', latestInscripcion.temporada_id).maybeSingle()
        : Promise.resolve({ data: null }),
      
      // Plantel actual
      latestInscripcion?.plantel_id
        ? supabaseAdmin.from('inscripcion_jugador').select('*, jugador(*)').eq('plantel_id', latestInscripcion.plantel_id)
        : Promise.resolve({ data: [] }),

      // Fixture del equipo (en la temporada actual)
      latestInscripcion
        ? supabaseAdmin.from('vista_fixture').select('*').eq('temporada_id', latestInscripcion.temporada_id).or(`local_id.eq.${equipoId},visitante_id.eq.${equipoId}`)
        : Promise.resolve({ data: [] }),

      // Historial de pagos (para admin/interno)
      supabaseAdmin.from('vista_pagos').select('*').eq('equipo_id', equipoId)
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
   * Premios publicados de una temporada (PÚBLICO).
   * Solo devuelve premios con publicado = true.
   */
  async getPremiosPublicados(temporadaId) {
    if (!temporadaId) throw new AppError('temporada_id es requerido', 400)

    const { data, error } = await supabaseAdmin
      .from('premio')
      .select(`
        id, nombre, descripcion, criterio, categoria, premio_fisico, imagen_url,
        ganadores:ganador_premio(
          id, valor_record, nota_desempate, compartido,
          equipo:equipo(id, nombre, escudo_url),
          jugador:jugador(id, nombre, apellido, foto_url)
        )
      `)
      .eq('temporada_id', temporadaId)
      .eq('publicado', true)

    if (error) throw new AppError(`Error consultando premios: ${error.message}`, 500)

    return data || []
  }
}

export default new StatService()
