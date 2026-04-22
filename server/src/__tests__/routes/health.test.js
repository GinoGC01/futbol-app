import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// ============================================================
// MOCK de Supabase — se define ANTES de importar app
// para que Vitest lo intercepte correctamente
// ============================================================
let supabaseMockError = null  // null = conexión OK, cualquier string = error

vi.mock('../../lib/supabase.js', () => {
  return {
    supabaseAdmin: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(async () => {
          if (supabaseMockError) return { data: null, error: { message: supabaseMockError } }
          return { data: [], error: null }
        }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        eq:     vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order:  vi.fn().mockReturnThis(),
      })),
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: '[TEST] Registro bloqueado por mock' }
          })
        }
      }
    }
  }
})

import app from '../../index.js'

// ============================================================
// 1. HEALTH ENDPOINT
// ============================================================
describe('🟢 GET /health — Estado del servidor', () => {
  it('responde 200 con { status: "ok" }', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok' })
  })

  it('incluye el campo "env" igual a "test"', async () => {
    const res = await request(app).get('/health')
    expect(res.body.env).toBe('test')
  })

  it('responde 404 para una ruta inexistente', async () => {
    const res = await request(app).get('/ruta-inexistente-xyz')
    expect(res.status).toBe(404)
  })

  it('responde 404 con mensaje en español', async () => {
    const res = await request(app).get('/api/no-existe')
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Ruta no encontrada')
  })
})

// ============================================================
// 2. SUPABASE CONNECTION — Simulación de OK y de fallo
// ============================================================
describe('🗄️  Supabase — Estado de la conexión (simulada)', () => {
  beforeEach(() => {
    supabaseMockError = null  // restaurar a "conexión OK" antes de cada test
  })

  it('conexión OK: el mock de Supabase devuelve data sin error', async () => {
    const { supabaseAdmin } = await import('../../lib/supabase.js')
    const result = await supabaseAdmin.from('ligas').select('id').limit(1)
    expect(result.error).toBeNull()
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('conexión CAÍDA: el mock de Supabase devuelve un error de red', async () => {
    supabaseMockError = 'connection refused'
    const { supabaseAdmin } = await import('../../lib/supabase.js')
    const result = await supabaseAdmin.from('ligas').select('id').limit(1)
    expect(result.error).not.toBeNull()
    expect(result.error.message).toContain('connection refused')
  })

  it('el cliente Supabase exporta supabaseAdmin correctamente', async () => {
    const { supabaseAdmin } = await import('../../lib/supabase.js')
    expect(supabaseAdmin).toBeDefined()
    expect(typeof supabaseAdmin.from).toBe('function')
    expect(supabaseAdmin.auth?.admin).toBeDefined()
  })
})

// ============================================================
// 3. POST /api/identity/register — Validaciones del formulario
// ============================================================
describe('📝 POST /api/identity/register — Validación del registro', () => {
  it('devuelve 400 si el body está completamente vacío', async () => {
    const res = await request(app)
      .post('/api/identity/register')
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.errors).toBeDefined()
    expect(Array.isArray(res.body.errors)).toBe(true)
  })

  it('devuelve 400 con email inválido', async () => {
    const res = await request(app)
      .post('/api/identity/register')
      .send({
        email: 'no-es-un-email',
        password: 'segura123',
        nombre_organizador: 'Organizador Test',
        telefono: '+54 9 11 1234-5678',
        nombre_liga: 'Liga Test',
        slug: 'liga-test',
        tipo_futbol: 'f7'
      })
    expect(res.status).toBe(400)
    const errors = res.body.errors?.map(e => e.msg) ?? []
    expect(errors.some(m => m.toLowerCase().includes('email') || m.toLowerCase().includes('inválido'))).toBe(true)
  })

  it('devuelve 400 con contraseña demasiado corta (< 6 caracteres)', async () => {
    const res = await request(app)
      .post('/api/identity/register')
      .send({
        email: 'test@test.com',
        password: '123',
        nombre_organizador: 'Organizador Test',
        telefono: '+54 9 11 1234-5678',
        nombre_liga: 'Liga Test',
        slug: 'liga-test',
        tipo_futbol: 'f7'
      })
    expect(res.status).toBe(400)
    const errors = res.body.errors?.map(e => e.msg) ?? []
    expect(errors.some(m => m.toLowerCase().includes('contraseña') || m.toLowerCase().includes('6'))).toBe(true)
  })

  it('devuelve 400 con slug que contiene mayúsculas o espacios', async () => {
    const res = await request(app)
      .post('/api/identity/register')
      .send({
        email: 'test@test.com',
        password: 'segura123',
        nombre_organizador: 'Organizador Test',
        telefono: '+54 9 11 1234-5678',
        nombre_liga: 'Liga Test',
        slug: 'Liga Con Espacios!!',
        tipo_futbol: 'f7'
      })
    expect(res.status).toBe(400)
    const errors = res.body.errors?.map(e => e.msg) ?? []
    expect(errors.some(m => m.toLowerCase().includes('slug'))).toBe(true)
  })

  it('devuelve 400 con tipo_futbol inválido', async () => {
    const res = await request(app)
      .post('/api/identity/register')
      .send({
        email: 'test@test.com',
        password: 'segura123',
        nombre_organizador: 'Organizador Test',
        telefono: '+54 9 11 1234-5678',
        nombre_liga: 'Liga Test',
        slug: 'liga-test',
        tipo_futbol: 'f100'  // valor no aceptado
      })
    expect(res.status).toBe(400)
    const errors = res.body.errors?.map(e => e.msg) ?? []
    expect(errors.some(m => m.toLowerCase().includes('fútbol') || m.toLowerCase().includes('futbol'))).toBe(true)
  })

  it('con datos válidos, el mock del SDK de admin bloquea la creación (simula error real)', async () => {
    // En tests no existe un Supabase real — el mock fuerza el error del Admin SDK.
    // Esto verifica que el flujo llega al controlador y este maneja el error.
    const res = await request(app)
      .post('/api/identity/register')
      .send({
        email: 'nuevo@test.com',
        password: 'segura123',
        nombre_organizador: 'Organizador Válido',
        telefono: '+54 9 11 1234-5678',
        nombre_liga: 'Mi Liga Válida',
        slug: 'mi-liga-valida',
        tipo_futbol: 'f7',
        zona: 'Palermo, CABA'
      })
    // El controlador debería manejar el error del mock y devolver 4xx o 5xx
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})

// ============================================================
// 4. ENDPOINTS PROTEGIDOS — Verificar que requieren auth
// ============================================================
describe('🔐 Endpoints protegidos — Requieren autenticación', () => {
  it('GET /api/identity/me devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/identity/me')
    expect(res.status).toBe(401)
  })

  it('GET /api/identity/ligas devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/identity/ligas')
    expect(res.status).toBe(401)
  })

  it('GET /api/competition/temporadas devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/competition/temporadas')
    expect(res.status).toBe(401)
  })

  it('GET /api/roster/jugadores devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/roster/jugadores')
    expect(res.status).toBe(401)
  })
})

// ============================================================
// 5. ENDPOINTS PÚBLICOS — Stats y datos públicos
// ============================================================
describe('🌐 Endpoints públicos — Accesibles sin auth', () => {
  it('GET /api/stats NO devuelve 401 (es público)', async () => {
    const res = await request(app).get('/api/stats')
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })
})
