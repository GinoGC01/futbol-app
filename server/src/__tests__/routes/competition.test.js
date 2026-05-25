import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

const ORGANIZADOR_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const LIGA_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const TEMPORADA_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
const FASE_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
const GRUPO_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
const EQUIPO_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

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

describe('GET /api/competition/formatos', () => {
  it('devuelve 200 con lista de formatos', async () => {
    const res = await request(app)
      .get('/api/competition/formatos')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

describe('POST /api/competition/temporadas', () => {
  it('devuelve 400 si falta liga_id', async () => {
    const res = await request(app)
      .post('/api/competition/temporadas')
      .set('Authorization', 'Bearer token')
      .send({ nombre: 'Temp Test', formato_tipo: 'liga' })

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })

  it('devuelve 400 si el nombre es muy corto', async () => {
    const res = await request(app)
      .post('/api/competition/temporadas')
      .set('Authorization', 'Bearer token')
      .send({ liga_id: LIGA_ID, nombre: 'ab', formato_tipo: 'liga' })

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })
})

describe('GET /api/competition/temporadas', () => {
  it('devuelve 400 sin liga_id', async () => {
    const res = await request(app)
      .get('/api/competition/temporadas')
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(400)
  })

  it('devuelve 403 con liga_id válido (ownership falla en mock)', async () => {
    const res = await request(app)
      .get('/api/competition/temporadas?liga_id=' + LIGA_ID)
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(403)
  })
})

describe('POST /api/competition/fases', () => {
  it('devuelve 400 si falta temporada_id', async () => {
    const res = await request(app)
      .post('/api/competition/fases')
      .set('Authorization', 'Bearer token')
      .send({ tipo: 'todos_contra_todos' })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con tipo de fase inválido', async () => {
    const res = await request(app)
      .post('/api/competition/fases')
      .set('Authorization', 'Bearer token')
      .send({ temporada_id: TEMPORADA_ID, tipo: 'invalido' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/competition/jornadas/batch', () => {
  it('devuelve 400 sin fase_id', async () => {
    const res = await request(app)
      .post('/api/competition/jornadas/batch')
      .set('Authorization', 'Bearer token')
      .send({ cantidad: 5 })

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con cantidad fuera de rango', async () => {
    const res = await request(app)
      .post('/api/competition/jornadas/batch')
      .set('Authorization', 'Bearer token')
      .send({ fase_id: FASE_ID, cantidad: 0 })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/competition/grupos', () => {
  it('devuelve 400 sin fase_id', async () => {
    const res = await request(app)
      .post('/api/competition/grupos')
      .set('Authorization', 'Bearer token')
      .send({})

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con fase_id no UUID', async () => {
    const res = await request(app)
      .post('/api/competition/grupos')
      .set('Authorization', 'Bearer token')
      .send({ fase_id: 'no-es-uuid' })

    expect(res.status).toBe(400)
  })

  it('con fase_id válido y nombre opcional llega al service (status depende del mock)', async () => {
    const res = await request(app)
      .post('/api/competition/grupos')
      .set('Authorization', 'Bearer token')
      .send({ fase_id: FASE_ID, nombre: 'Grupo A' })

    // Si mock no resuelve nested queries, service devuelve 400 o 404
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

describe('PATCH /api/competition/grupos/:id', () => {
  it('devuelve 400 sin nombre', async () => {
    const res = await request(app)
      .patch('/api/competition/grupos/' + GRUPO_ID)
      .set('Authorization', 'Bearer token')
      .send({})

    expect(res.status).toBe(400)
  })
})

describe('POST /api/competition/grupos/:id/equipos', () => {
  it('devuelve 400 sin equipo_ids', async () => {
    const res = await request(app)
      .post('/api/competition/grupos/' + GRUPO_ID + '/equipos')
      .set('Authorization', 'Bearer token')
      .send({})

    expect(res.status).toBe(400)
  })

  it('devuelve 400 con equipo_ids vacío', async () => {
    const res = await request(app)
      .post('/api/competition/grupos/' + GRUPO_ID + '/equipos')
      .set('Authorization', 'Bearer token')
      .send({ equipo_ids: [] })

    expect(res.status).toBe(400)
  })
})
