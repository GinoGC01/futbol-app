import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import { supabaseAdmin } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireTenant } from '../middleware/tenant.js'

const router = Router()

// GET /api/partidos?temporada_id=xxx&estado=xxx&jornada=xxx — público
router.get('/', async (req, res) => {
  const { temporada_id, estado, jornada } = req.query
  if (!temporada_id) return res.status(400).json({ error: 'temporada_id requerido' })

  let query = supabaseAdmin
    .from('partidos')
    .select(`
      id, fecha, cancha, estado, goles_local, goles_visitante, jornada,
      equipo_local:equipos!partidos_equipo_local_fkey(id, nombre, escudo_url),
      equipo_visitante:equipos!partidos_equipo_visitante_fkey(id, nombre, escudo_url)
    `)
    .eq('temporada_id', temporada_id)
    .order('jornada', { ascending: true, nullsFirst: false })
    .order('fecha', { ascending: true })

  if (estado) query = query.eq('estado', estado)
  if (jornada) query = query.eq('jornada', parseInt(jornada))

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/partidos — crear (admin)
router.post('/',
  requireAuth,
  requireTenant,
  body('equipo_local').isUUID(),
  body('equipo_visitante').isUUID(),
  body('temporada_id').isUUID(),
  body('jornada').optional().isInt({ min: 1, max: 99 }),
  body('fecha').optional().isISO8601(),
  body('cancha').optional().isLength({ max: 100 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { equipo_local, equipo_visitante, temporada_id, fecha, cancha, jornada } = req.body

    if (equipo_local === equipo_visitante) {
      return res.status(400).json({ error: 'Los equipos deben ser distintos' })
    }

    // Verificar que la temporada pertenece a esta liga
    const { data: temporada } = await supabaseAdmin
      .from('temporadas')
      .select('liga_id')
      .eq('id', temporada_id)
      .single()

    if (!temporada || temporada.liga_id !== req.ligaId) {
      return res.status(403).json({ error: 'Temporada no pertenece a esta liga' })
    }

    const { data, error } = await supabaseAdmin
      .from('partidos')
      .insert({ temporada_id, equipo_local, equipo_visitante, fecha, cancha, jornada: jornada || null })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  }
)

// PUT /api/partidos/:id/resultado — cargar resultado (admin)
// ENMIENDA 3: Acepta array de goleadores. Si hay goles > 0 sin goleadores,
// el estado queda como "finalizado_parcial" para evitar datos huérfanos.
router.put('/:id/resultado',
  requireAuth,
  requireTenant,
  body('goles_local').isInt({ min: 0, max: 30 }),
  body('goles_visitante').isInt({ min: 0, max: 30 }),
  body('goleadores').optional().isArray(),
  body('goleadores.*.jugador_id').optional().isUUID(),
  body('goleadores.*.minuto').optional().isInt({ min: 0, max: 120 }),
  body('goleadores.*.es_penal').optional().isBoolean(),
  body('goleadores.*.es_contra').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    // Verificar pertenencia del partido a esta liga
    const { data: partido } = await supabaseAdmin
      .from('partidos')
      .select('id, temporadas(liga_id)')
      .eq('id', req.params.id)
      .single()

    if (!partido || partido.temporadas?.liga_id !== req.ligaId) {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const { goles_local, goles_visitante, goleadores } = req.body
    const totalGoles = parseInt(goles_local) + parseInt(goles_visitante)

    // Determinar estado según la enmienda 3:
    // Si hay goles pero no se informaron goleadores → finalizado_parcial
    // Si no hay goles (0-0) o se informaron goleadores → finalizado
    let estado = 'finalizado'
    if (totalGoles > 0 && (!goleadores || goleadores.length === 0)) {
      estado = 'finalizado_parcial'
    }

    // Actualizar resultado del partido
    const { data, error } = await supabaseAdmin
      .from('partidos')
      .update({ goles_local: parseInt(goles_local), goles_visitante: parseInt(goles_visitante), estado })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    // Si se enviaron goleadores, insertarlos
    if (goleadores && goleadores.length > 0) {
      // Limpiar goles previos de este partido por si es una corrección
      await supabaseAdmin
        .from('goles')
        .delete()
        .eq('partido_id', req.params.id)

      const golesInsert = goleadores.map(g => ({
        partido_id: req.params.id,
        jugador_id: g.jugador_id,
        minuto: g.minuto ?? null,
        es_penal: g.es_penal ?? false,
        es_contra: g.es_contra ?? false
      }))

      const { error: golesError } = await supabaseAdmin
        .from('goles')
        .insert(golesInsert)

      if (golesError) {
        return res.status(500).json({
          error: 'Resultado guardado pero error al guardar goleadores: ' + golesError.message,
          partido: data
        })
      }
    }

    res.json({
      ...data,
      goleadores_registrados: goleadores?.length ?? 0,
      resultado_completo: estado === 'finalizado'
    })
  }
)

// PUT /api/partidos/:id/goleadores — completar goleadores (admin)
// Para cuando un partido quedó en "finalizado_parcial"
router.put('/:id/goleadores',
  requireAuth,
  requireTenant,
  body('goleadores').isArray({ min: 1 }),
  body('goleadores.*.jugador_id').isUUID(),
  body('goleadores.*.minuto').optional().isInt({ min: 0, max: 120 }),
  body('goleadores.*.es_penal').optional().isBoolean(),
  body('goleadores.*.es_contra').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    // Verificar pertenencia
    const { data: partido } = await supabaseAdmin
      .from('partidos')
      .select('id, estado, temporadas(liga_id)')
      .eq('id', req.params.id)
      .single()

    if (!partido || partido.temporadas?.liga_id !== req.ligaId) {
      return res.status(403).json({ error: 'No autorizado' })
    }

    if (partido.estado !== 'finalizado_parcial') {
      return res.status(400).json({ error: 'Este partido no tiene goleadores pendientes' })
    }

    const { goleadores } = req.body

    // Limpiar goles previos
    await supabaseAdmin.from('goles').delete().eq('partido_id', req.params.id)

    const golesInsert = goleadores.map(g => ({
      partido_id: req.params.id,
      jugador_id: g.jugador_id,
      minuto: g.minuto ?? null,
      es_penal: g.es_penal ?? false,
      es_contra: g.es_contra ?? false
    }))

    const { error: golesError } = await supabaseAdmin.from('goles').insert(golesInsert)

    if (golesError) {
      return res.status(500).json({ error: golesError.message })
    }

    // Promover a finalizado completo
    await supabaseAdmin
      .from('partidos')
      .update({ estado: 'finalizado' })
      .eq('id', req.params.id)

    res.json({ message: 'Goleadores registrados. Partido finalizado.' })
  }
)

export default router
