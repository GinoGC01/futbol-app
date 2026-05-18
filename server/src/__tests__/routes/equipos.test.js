import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

// =============================================================
// MOCK COMPLETO: Supabase + Auth
// Simula dos admins de ligas distintas para el test de tenant attack
// =============================================================
const ADMIN_A = {
  id: 'aaaa-aaaa-aaaa-aaaa',
  email: 'admin_a@test.com',
  liga_id: 'liga-aaaa'
}
const ADMIN_B = {
  id: 'bbbb-bbbb-bbbb-bbbb',
  email: 'admin_b@test.com',
  liga_id: 'liga-bbbb'
}
const EQUIPO_DE_B = {
  id: 'b3870526-3773-4f61-a3ef-98b50e2ddc99',
  liga_id: ADMIN_B.liga_id,
  nombre: 'Equipo Secreto de B'
}

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
      if (table === 'admin_users') {
        return { data: { liga_id: ADMIN_A.liga_id }, error: null }
      }
      if (table === 'equipo') {
        return { data: EQUIPO_DE_B, error: null }
      }
      return { data: null, error: null }
    })

    chain.maybeSingle.mockImplementation(async () => {
      if (table === 'equipo') {
        return { data: EQUIPO_DE_B, error: null }
      }
      if (table === 'liga') {
        // Retorna null para simular que Admin A no es dueño de la liga de B (ataque tenant)
        return { data: null, error: null }
      }
      return { data: null, error: null }
    })

    // Para la lista de inscripciones (buscar si tiene activa en deleteEquipo)
    chain.limit = vi.fn().mockReturnThis()
    // Retornamos array vacío para que no falle al verificar inscripciones
    const resolveData = { data: [], error: null }
    chain.then = (onfulfilled) => Promise.resolve(resolveData).then(onfulfilled)

    return chain
  })

  return {
    supabaseAdmin: { from: mockFrom }
  }
})

// Mock del módulo auth para simular que Admin A tiene un token válido
vi.mock('../../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: ADMIN_A.id, email: ADMIN_A.email }
    next()
  },
  requireOrganizador: (req, _res, next) => {
    req.organizador = { id: ADMIN_A.id, email: ADMIN_A.email }
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

describe('GET /api/roster/equipos', () => {
  it('devuelve 400 sin liga_id', async () => {
    const res = await request(app).get('/api/roster/equipos')
    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined() // express-validator returns errors array
  })
})

describe('POST /api/roster/equipos', () => {
  it('devuelve 401 sin token (sin mock de auth)', async () => {
    const res = await request(app)
      .post('/api/roster/equipos')
      .send({ nombre: 'T' }) // nombre demasiado corto
    expect(res.status).toBe(400)
  })
})

// =============================================
// TEST CRÍTICO: ATAQUE DE TENANT
// Admin A intenta borrar un equipo que pertenece a Admin B.
// El sistema DEBE devolver 403 Forbidden.
// =============================================
describe('🔒 TENANT ATTACK TEST — Admin A intenta borrar equipo de Admin B', () => {
  it('DEBE devolver 403 cuando Admin A intenta DELETE /api/roster/equipos/:id de otra liga', async () => {
    const res = await request(app)
      .delete(`/api/roster/equipos/${EQUIPO_DE_B.id}`)
      .set('Authorization', 'Bearer token-admin-a')

    expect(res.status).toBe(403)
    expect(res.body.message).toBe('Acceso denegado: La liga no te pertenece')
  })

  it('DEBE devolver 403 cuando Admin A intenta PUT /api/roster/equipos/:id de otra liga', async () => {
    const res = await request(app)
      .put(`/api/roster/equipos/${EQUIPO_DE_B.id}`)
      .set('Authorization', 'Bearer token-admin-a')
      .send({ nombre: 'Nombre Hackeado' })

    expect(res.status).toBe(403)
    expect(res.body.message).toBe('Acceso denegado: La liga no te pertenece')
  })
})
