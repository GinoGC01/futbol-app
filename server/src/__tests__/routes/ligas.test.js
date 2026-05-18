import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

// =============================================================
// MOCK COMPLETO: Supabase + Auth
// =============================================================
const ORGANIZADOR_ID = 'aaaa-aaaa-aaaa-aaaa'

vi.mock('../../lib/supabase.js', () => {
  const mockFrom = vi.fn((table) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }

    chain.single.mockImplementation(async () => {
      return { data: null, error: null }
    })

    chain.maybeSingle.mockImplementation(async () => {
      return { data: null, error: null }
    })

    // Resolver para getLigasByOrganizador
    chain.then = (onfulfilled) => Promise.resolve({ data: [], error: null }).then(onfulfilled)

    return chain
  })

  return {
    supabaseAdmin: { from: mockFrom }
  }
})

// Mock del módulo auth para simular que el organizador tiene un token válido
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: ORGANIZADOR_ID, email: 'organizador@test.com' }
    next()
  },
  requireOrganizador: (req, _res, next) => {
    req.organizador = { id: ORGANIZADOR_ID, email: 'organizador@test.com' }
    next()
  },
  requireActiveStatus: (req, _res, next) => {
    next()
  },
  requireVerified: (req, _res, next) => {
    next()
  }
}))

import app from '../../index.js'

describe('GET /api/identity/ligas', () => {
  it('retorna 200 y la lista de ligas', async () => {
    const res = await request(app)
      .get('/api/identity/ligas')
      .set('Authorization', 'Bearer token-valido')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})

describe('POST /api/identity/ligas', () => {
  it('devuelve 400 si falta el nombre de la liga', async () => {
    const res = await request(app)
      .post('/api/identity/ligas')
      .set('Authorization', 'Bearer token-valido')
      .send({ slug: 'liga-sin-nombre' })

    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
  })
})
