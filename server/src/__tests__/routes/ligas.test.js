import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// Mock del módulo supabase ANTES de importar app
vi.mock('../../lib/supabase.js', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
  }
  return {
    supabaseAdmin: {
      from: vi.fn(() => mockChain),
      _chain: mockChain
    }
  }
})

import app from '../../index.js'
import { supabaseAdmin } from '../../lib/supabase.js'

describe('GET /api/ligas/search', () => {
  it('devuelve 400 sin parámetro q', async () => {
    const res = await request(app).get('/api/ligas/search')
    expect(res.status).toBe(400)
  })

  it('devuelve 400 con q de 1 caracter', async () => {
    const res = await request(app).get('/api/ligas/search?q=a')
    expect(res.status).toBe(400)
  })

  it('devuelve array con búsqueda válida', async () => {
    const chain = supabaseAdmin.from()
    chain.limit.mockResolvedValueOnce({ data: [
      { id: '1', nombre: 'Liga Norte', slug: 'liga-norte', zona: 'CABA' }
    ], error: null })

    const res = await request(app).get('/api/ligas/search?q=norte')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('GET /api/ligas/:slug', () => {
  it('devuelve 404 si la liga no existe', async () => {
    const chain = supabaseAdmin.from()
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    const res = await request(app).get('/api/ligas/slug-inexistente')
    expect(res.status).toBe(404)
  })
})
