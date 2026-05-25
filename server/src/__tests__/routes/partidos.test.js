import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

const ORGANIZADOR_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const PARTIDO_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const JORNADA_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
const EQUIPO_A_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
const EQUIPO_B_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
const INSCRIPCION_JUGADOR_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

vi.mock('../../lib/supabase.js', () => {
  const makeChain = () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    }

    chain.single.mockResolvedValue({ data: null, error: null })
    chain.maybeSingle.mockResolvedValue({ data: null, error: null })
    chain.then = (onfulfilled) => Promise.resolve({ data: [], error: null }).then(onfulfilled)

    return chain
  }

  return {
    supabaseAdmin: { from: vi.fn(() => makeChain()) }
  }
})

vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => {
    req.user = { sub: ORGANIZADOR_ID, email: 'org@test.com' }
    next()
  },
  requireOrganizador: (req, _res, next) => {
    req.organizador = { id: ORGANIZADOR_ID, email: 'org@test.com' }
    next()
  },
  requireActiveStatus: (_req, _res, next) => next(),
  requireVerified: (_req, _res, next) => next()
}))

import app from '../../index.js'

describe('POST /api/match/partidos', () => {
  it('devuelve 400 sin jornada_id', async () => {
    const res = await request(app)
      .post('/api/match/partidos')
      .set('Authorization', 'Bearer token')
      .send({ equipo_local_id: EQUIPO_A_ID, equipo_visitante_id: EQUIPO_B_ID })

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })

  it('devuelve 400 sin equipo_local_id', async () => {
    const res = await request(app)
      .post('/api/match/partidos')
      .set('Authorization', 'Bearer token')
      .send({ jornada_id: JORNADA_ID, equipo_visitante_id: EQUIPO_B_ID })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 sin equipo_visitante_id', async () => {
    const res = await request(app)
      .post('/api/match/partidos')
      .set('Authorization', 'Bearer token')
      .send({ jornada_id: JORNADA_ID, equipo_local_id: EQUIPO_A_ID })

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/match/partidos/:id/estado', () => {
  it('devuelve 400 sin estado en body', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/' + PARTIDO_ID + '/estado')
      .set('Authorization', 'Bearer token')
      .send({})

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con estado inválido', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/' + PARTIDO_ID + '/estado')
      .set('Authorization', 'Bearer token')
      .send({ estado: 'inexistente' })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con id no UUID', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/no-uuid/estado')
      .set('Authorization', 'Bearer token')
      .send({ estado: 'finalizado' })

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/match/partidos/:id/resultado', () => {
  it('devuelve 400 sin goles_local', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/' + PARTIDO_ID + '/resultado')
      .set('Authorization', 'Bearer token')
      .send({ goles_visitante: 0 })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con goles_local negativo', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/' + PARTIDO_ID + '/resultado')
      .set('Authorization', 'Bearer token')
      .send({ goles_local: -1, goles_visitante: 0 })

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/match/partidos/:id/logistica', () => {
  it('devuelve 404 con id inválido (param validation no bloquea, service responde)', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/no-uuid/logistica')
      .set('Authorization', 'Bearer token')
      .send({ cancha: 'Cancha 1' })

    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/match/partidos/:id/tiempo-adicionado', () => {
  it('devuelve 400 sin segundos en body', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/' + PARTIDO_ID + '/tiempo-adicionado')
      .set('Authorization', 'Bearer token')
      .send({})

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con segundos negativo', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/' + PARTIDO_ID + '/tiempo-adicionado')
      .set('Authorization', 'Bearer token')
      .send({ segundos: -5 })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con segundos no entero', async () => {
    const res = await request(app)
      .patch('/api/match/partidos/' + PARTIDO_ID + '/tiempo-adicionado')
      .set('Authorization', 'Bearer token')
      .send({ segundos: 1.5 })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/match/partidos/jornada/:jornadaId', () => {
  it('devuelve 404 con jornadaId inválido (param validation no bloquea)', async () => {
    const res = await request(app)
      .get('/api/match/partidos/jornada/no-uuid')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(404)
  })

  it('con id válido llega al service y devuelve 404', async () => {
    const res = await request(app)
      .get('/api/match/partidos/jornada/' + JORNADA_ID)
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(404)
  })
})

describe('POST /api/match/partidos/:id/goles', () => {
  it('devuelve 400 sin inscripcion_jugador_id', async () => {
    const res = await request(app)
      .post('/api/match/partidos/' + PARTIDO_ID + '/goles')
      .set('Authorization', 'Bearer token')
      .send({})

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con minuto > 130', async () => {
    const res = await request(app)
      .post('/api/match/partidos/' + PARTIDO_ID + '/goles')
      .set('Authorization', 'Bearer token')
      .send({
        inscripcion_jugador_id: INSCRIPCION_JUGADOR_ID,
        minuto: 200
      })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/match/partidos/:id/tarjetas', () => {
  it('devuelve 400 sin tipo', async () => {
    const res = await request(app)
      .post('/api/match/partidos/' + PARTIDO_ID + '/tarjetas')
      .set('Authorization', 'Bearer token')
      .send({ inscripcion_jugador_id: INSCRIPCION_JUGADOR_ID })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con tipo de tarjeta inválido', async () => {
    const res = await request(app)
      .post('/api/match/partidos/' + PARTIDO_ID + '/tarjetas')
      .set('Authorization', 'Bearer token')
      .send({
        inscripcion_jugador_id: INSCRIPCION_JUGADOR_ID,
        tipo: 'violeta'
      })

    expect(res.status).toBe(400)
  })
})

describe('GET /api/match/partidos/:id/eventos', () => {
  it('devuelve 404 con id inválido (param validation no bloquea)', async () => {
    const res = await request(app)
      .get('/api/match/partidos/no-uuid/eventos')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(404)
  })
})

describe('POST /api/match/partidos/generate/:faseId', () => {
  it('devuelve 400 sin equipo_ids', async () => {
    const res = await request(app)
      .post('/api/match/partidos/generate/' + JORNADA_ID)
      .set('Authorization', 'Bearer token')
      .send({})

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con menos de 2 equipos', async () => {
    const res = await request(app)
      .post('/api/match/partidos/generate/' + JORNADA_ID)
      .set('Authorization', 'Bearer token')
      .send({ equipo_ids: [EQUIPO_A_ID] })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/match/horarios/jornada/:jornadaId', () => {
  it('devuelve 400 con jornadaId inválido', async () => {
    const res = await request(app)
      .post('/api/match/horarios/jornada/no-uuid')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(400)
  })
})
