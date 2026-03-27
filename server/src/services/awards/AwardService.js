import { supabaseAdmin } from '../../lib/supabase.js'
import LigaService from '../identity/LigaService.js'
import StatService from './StatService.js'
import AppError from '../../utils/AppError.js'

const CRITERIOS_VALIDOS = [
  'goleador', 'valla_invicta', 'valla_menos_vencida',
  'asistencia', 'posicion_tabla', 'fair_play', 'personalizado'
]
const CATEGORIAS_VALIDAS = ['jugador', 'equipo']

class AwardService {
  /**
   * Resuelve ownership de un premio: premio → temporada → liga → organizador.
   */
  async resolveOwnership(premioId, organizadorId) {
    const { data: premio, error } = await supabaseAdmin
      .from('premio')
      .select(`
        id, temporada_id, fase_id, nombre, criterio, categoria, publicado,
        temporada:temporada!inner(liga_id)
      `)
      .eq('id', premioId)
      .maybeSingle()

    if (error || !premio) throw new AppError('Premio no encontrado', 404)

    await LigaService.verifyOwnership(premio.temporada.liga_id, organizadorId)

    return premio
  }

  /**
   * Crea un premio para una temporada.
   */
  async crearPremio(organizadorId, data) {
    const { temporada_id, fase_id, nombre, descripcion, criterio, categoria, premio_fisico, imagen_url } = data

    if (!temporada_id || !nombre || !criterio || !categoria) {
      throw new AppError('temporada_id, nombre, criterio y categoria son requeridos', 400)
    }

    if (!CRITERIOS_VALIDOS.includes(criterio)) {
      throw new AppError(`Criterio no válido. Permitidos: ${CRITERIOS_VALIDOS.join(', ')}`, 400)
    }
    if (!CATEGORIAS_VALIDAS.includes(categoria)) {
      throw new AppError(`Categoría no válida. Permitidas: ${CATEGORIAS_VALIDAS.join(', ')}`, 400)
    }

    // Verificar ownership de la temporada
    const { data: temporada, error: tErr } = await supabaseAdmin
      .from('temporada')
      .select('liga_id')
      .eq('id', temporada_id)
      .maybeSingle()

    if (tErr || !temporada) throw new AppError('Temporada no encontrada', 404)
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId)

    const payload = {
      temporada_id,
      nombre: nombre.trim(),
      criterio,
      categoria,
      publicado: false
    }
    if (fase_id) payload.fase_id = fase_id
    if (descripcion) payload.descripcion = descripcion.trim()
    if (premio_fisico) payload.premio_fisico = premio_fisico.trim()
    if (imagen_url) payload.imagen_url = imagen_url.trim()

    const { data: premio, error } = await supabaseAdmin
      .from('premio')
      .insert([payload])
      .select('*')
      .single()

    if (error) throw new AppError(`Error al crear premio: ${error.message}`, 500)

    return premio
  }

  /**
   * ESCRUTINIO FINO: Analiza estadísticas y sugiere candidatos al premio.
   * Devuelve una lista ordenada con desglose de desempate.
   */
  async sugerirGanadores(premioId, organizadorId) {
    const premio = await this.resolveOwnership(premioId, organizadorId)
    const { criterio, categoria, temporada_id, fase_id } = premio

    switch (criterio) {
      case 'goleador':
        return this._escrutinioGoleador(temporada_id, fase_id)
      case 'valla_menos_vencida':
        return this._escrutinioVallaMenosVencida(temporada_id, fase_id)
      case 'fair_play':
        return this._escrutinioFairPlay(temporada_id, fase_id, categoria)
      case 'posicion_tabla':
        return this._escrutinioPosicionTabla(fase_id)
      case 'valla_invicta':
        return this._escrutinioVallaInvicta(temporada_id, fase_id)
      case 'personalizado':
      case 'asistencia':
        return { candidatos: [], nota: 'Este criterio requiere selección manual del organizador.' }
      default:
        throw new AppError(`Criterio "${criterio}" no tiene algoritmo de escrutinio implementado`, 400)
    }
  }

  /**
   * Escrutinio Goleador:
   * 1. Total de goles (sin autogoles).
   * 2. Desempate: Goles de jugada (total - penales).
   * 3. Desempate: Promedio goles/partidos jugados.
   * 4. Desempate: Menos tarjetas acumuladas.
   */
  async _escrutinioGoleador(temporadaId, faseId) {
    const goleadores = await StatService.getGoleadores({
      temporada_id: temporadaId,
      fase_id: faseId,
      limit: 20
    })

    // Enriquecer con tarjetas para desempate Fair Play
    const tarjetas = await StatService.getTarjetas({
      temporada_id: temporadaId,
      fase_id: faseId,
      limit: 100
    })

    // Crear mapa de tarjetas por jugador_id
    const tarjetaMap = {}
    for (const t of tarjetas) {
      tarjetaMap[t.jugador_id] = {
        amarillas: t.amarillas || 0,
        rojas: t.rojas || 0,
        puntaje_disciplinario: (t.amarillas || 0) + (t.rojas || 0) * 3
      }
    }

    const candidatos = goleadores.map(g => {
      const golesJugada = g.goles - (g.penales || 0)
      const disc = tarjetaMap[g.jugador_id] || { amarillas: 0, rojas: 0, puntaje_disciplinario: 0 }

      return {
        jugador_id: g.jugador_id,
        nombre: `${g.jugador_nombre} ${g.jugador_apellido}`,
        equipo: g.equipo_nombre,
        equipo_id: g.equipo_id,
        escudo_url: g.escudo_url,
        dorsal: g.dorsal,
        // Datos del escrutinio
        goles_totales: g.goles,
        goles_penal: g.penales || 0,
        goles_jugada: golesJugada,
        goles_en_contra: g.goles_en_contra || 0,
        // Fair play como desempate
        amarillas: disc.amarillas,
        rojas: disc.rojas,
        puntaje_disciplinario: disc.puntaje_disciplinario,
        // Valor para mostrar
        valor_record: `${g.goles} goles (${g.penales || 0} de penal)`
      }
    })

    // Ordenar: goles desc → goles jugada desc → disciplinario asc
    candidatos.sort((a, b) => {
      if (b.goles_totales !== a.goles_totales) return b.goles_totales - a.goles_totales
      if (b.goles_jugada !== a.goles_jugada) return b.goles_jugada - a.goles_jugada
      return a.puntaje_disciplinario - b.puntaje_disciplinario
    })

    return { criterio: 'goleador', candidatos }
  }

  /**
   * Escrutinio Valla Menos Vencida:
   * Equipo con menor gc (goles en contra) en la tabla de posiciones.
   * Desempate: Más partidos jugados (más mérito).
   */
  async _escrutinioVallaMenosVencida(temporadaId, faseId) {
    if (!faseId) {
      // Si no hay fase, buscar todas las fases de la temporada
      const { data: fases } = await supabaseAdmin
        .from('fase')
        .select('id')
        .eq('temporada_id', temporadaId)
        .order('orden', { ascending: true })
        .limit(1)

      if (!fases || fases.length === 0) return { criterio: 'valla_menos_vencida', candidatos: [] }
      faseId = fases[0].id
    }

    const tabla = await StatService.getTablaPosiciones(faseId)

    // Filtrar equipos con partidos jugados > 0
    const conPartidos = tabla.filter(e => e.pj > 0)

    const candidatos = conPartidos.map(e => ({
      equipo_id: e.equipo_id,
      equipo: e.equipo_nombre,
      escudo_url: e.escudo_url,
      goles_en_contra: e.gc,
      partidos_jugados: e.pj,
      promedio_gc: e.pj > 0 ? (e.gc / e.pj).toFixed(2) : '0.00',
      valor_record: `${e.gc} GC en ${e.pj} PJ (${(e.gc / e.pj).toFixed(2)} gc/p)`
    }))

    // Ordenar: menor gc → más pj (más mérito) → menor promedio
    candidatos.sort((a, b) => {
      if (a.goles_en_contra !== b.goles_en_contra) return a.goles_en_contra - b.goles_en_contra
      return b.partidos_jugados - a.partidos_jugados
    })

    return { criterio: 'valla_menos_vencida', candidatos }
  }

  /**
   * Escrutinio Fair Play:
   * Menor puntaje disciplinario (amarillas*1 + rojas*3).
   */
  async _escrutinioFairPlay(temporadaId, faseId, categoria) {
    if (categoria === 'equipo') {
      // Fair Play por equipo: sumar tarjetas de todos los jugadores del plantel
      const tarjetas = await StatService.getTarjetas({
        temporada_id: temporadaId,
        fase_id: faseId,
        limit: 200
      })

      // Agrupar por equipo
      const equipoMap = {}
      for (const t of tarjetas) {
        if (!equipoMap[t.equipo_id]) {
          equipoMap[t.equipo_id] = { equipo: t.equipo_nombre, equipo_id: t.equipo_id, amarillas: 0, rojas: 0 }
        }
        equipoMap[t.equipo_id].amarillas += t.amarillas || 0
        equipoMap[t.equipo_id].rojas += t.rojas || 0
      }

      const candidatos = Object.values(equipoMap).map(e => ({
        ...e,
        puntaje: e.amarillas + e.rojas * 3,
        valor_record: `${e.amarillas} amarillas, ${e.rojas} rojas (Puntaje: ${e.amarillas + e.rojas * 3})`
      }))

      candidatos.sort((a, b) => a.puntaje - b.puntaje)

      return { criterio: 'fair_play', candidatos }
    }

    // Fair Play individual
    const tarjetas = await StatService.getTarjetas({
      temporada_id: temporadaId,
      fase_id: faseId,
      limit: 100
    })

    const candidatos = tarjetas.map(t => ({
      jugador_id: t.jugador_id,
      nombre: `${t.jugador_nombre} ${t.jugador_apellido}`,
      equipo: t.equipo_nombre,
      equipo_id: t.equipo_id,
      amarillas: t.amarillas || 0,
      rojas: t.rojas || 0,
      puntaje: (t.amarillas || 0) + (t.rojas || 0) * 3,
      valor_record: `${t.amarillas || 0} amarillas, ${t.rojas || 0} rojas`
    }))

    candidatos.sort((a, b) => a.puntaje - b.puntaje)

    return { criterio: 'fair_play', candidatos }
  }

  /**
   * Escrutinio Posición en Tabla: Campeón, Sub, 3ro...
   */
  async _escrutinioPosicionTabla(faseId) {
    if (!faseId) return { criterio: 'posicion_tabla', candidatos: [], nota: 'Se requiere fase_id para posición en tabla.' }

    const tabla = await StatService.getTablaPosiciones(faseId)

    const candidatos = tabla.map((e, idx) => ({
      posicion: idx + 1,
      equipo_id: e.equipo_id,
      equipo: e.equipo_nombre,
      escudo_url: e.escudo_url,
      pts: e.pts,
      dg: e.dg,
      gf: e.gf,
      valor_record: `${idx + 1}° lugar — ${e.pts} pts, DG ${e.dg}`
    }))

    return { criterio: 'posicion_tabla', candidatos }
  }

  /**
   * Escrutinio Valla Invicta: equipo con más partidos sin recibir goles.
   */
  async _escrutinioVallaInvicta(temporadaId, faseId) {
    if (!faseId) {
      const { data: fases } = await supabaseAdmin
        .from('fase')
        .select('id')
        .eq('temporada_id', temporadaId)
        .order('orden', { ascending: true })
        .limit(1)

      if (!fases || fases.length === 0) return { criterio: 'valla_invicta', candidatos: [] }
      faseId = fases[0].id
    }

    // Contar partidos finalizados donde gc = 0 para cada equipo
    const tabla = await StatService.getTablaPosiciones(faseId)

    // Para valla invicta necesitamos datos más granulares del fixture
    const { data: partidos, error } = await supabaseAdmin
      .from('vista_fixture')
      .select('*')
      .eq('fase_id', faseId)
      .eq('partido_estado', 'finalizado')

    if (error) throw new AppError(`Error consultando fixture: ${error.message}`, 500)

    // Contar arcos en cero por equipo
    const arcosEnCero = {}
    for (const p of (partidos || [])) {
      // Local: si goles_visitante === 0, local mantuvo arco en 0
      if (p.goles_visitante === 0) {
        if (!arcosEnCero[p.local_id]) arcosEnCero[p.local_id] = { nombre: p.local_nombre, escudo: p.local_escudo, count: 0 }
        arcosEnCero[p.local_id].count++
      }
      // Visitante: si goles_local === 0
      if (p.goles_local === 0) {
        if (!arcosEnCero[p.visitante_id]) arcosEnCero[p.visitante_id] = { nombre: p.visitante_nombre, escudo: p.visitante_escudo, count: 0 }
        arcosEnCero[p.visitante_id].count++
      }
    }

    const candidatos = Object.entries(arcosEnCero).map(([eqId, info]) => ({
      equipo_id: eqId,
      equipo: info.nombre,
      escudo_url: info.escudo,
      arcos_en_cero: info.count,
      valor_record: `${info.count} vallas invictas`
    }))

    candidatos.sort((a, b) => b.arcos_en_cero - a.arcos_en_cero)

    return { criterio: 'valla_invicta', candidatos }
  }

  /**
   * Asigna ganador(es) a un premio.
   */
  async asignarGanador(premioId, organizadorId, data) {
    await this.resolveOwnership(premioId, organizadorId)

    const { equipo_id, jugador_id, valor_record, nota_desempate, compartido = false } = data

    if (!equipo_id && !jugador_id) {
      throw new AppError('Debe especificar equipo_id o jugador_id', 400)
    }

    const payload = {
      premio_id: premioId,
      valor_record: valor_record || null,
      nota_desempate: nota_desempate || null,
      compartido: Boolean(compartido)
    }
    if (equipo_id) payload.equipo_id = equipo_id
    if (jugador_id) payload.jugador_id = jugador_id

    const { data: ganador, error } = await supabaseAdmin
      .from('ganador_premio')
      .insert([payload])
      .select('id, premio_id, equipo_id, jugador_id, valor_record, nota_desempate, compartido')
      .single()

    if (error) throw new AppError(`Error asignando ganador: ${error.message}`, 500)

    return ganador
  }

  /**
   * Publica o despublica los premios de una temporada.
   */
  async togglePublicacion(premioId, organizadorId, publicado) {
    await this.resolveOwnership(premioId, organizadorId)

    const { data: updated, error } = await supabaseAdmin
      .from('premio')
      .update({ publicado: Boolean(publicado) })
      .eq('id', premioId)
      .select('id, nombre, publicado')
      .single()

    if (error) throw new AppError(`Error actualizando publicación: ${error.message}`, 500)

    return updated
  }

  /**
   * Lista premios de una temporada (vista de admin).
   */
  async getPremiosByTemporada(temporadaId, organizadorId) {
    const { data: temporada, error: tErr } = await supabaseAdmin
      .from('temporada')
      .select('liga_id')
      .eq('id', temporadaId)
      .maybeSingle()

    if (tErr || !temporada) throw new AppError('Temporada no encontrada', 404)
    await LigaService.verifyOwnership(temporada.liga_id, organizadorId)

    const { data, error } = await supabaseAdmin
      .from('premio')
      .select(`
        id, nombre, descripcion, criterio, categoria, premio_fisico, imagen_url, publicado, created_at,
        ganadores:ganador_premio(
          id, valor_record, nota_desempate, compartido,
          equipo:equipo(id, nombre, escudo_url),
          jugador:jugador(id, nombre, apellido, foto_url)
        )
      `)
      .eq('temporada_id', temporadaId)
      .order('created_at', { ascending: true })

    if (error) throw new AppError(`Error listando premios: ${error.message}`, 500)

    return data || []
  }
}

export default new AwardService()
