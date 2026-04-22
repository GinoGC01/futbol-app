import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// ============================================================
// MOCKS
// ============================================================

// Mock de Mailer
vi.mock('../../utils/mailer.js', () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true)
}))

// Mock de Supabase
// Usamos un objeto builder que retorna siempre a sí mismo excepto para métodos terminales
const mockBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn().mockImplementation(function(onFulfilled) {
    // Esto permite que 'await supabase.from().update().eq()' funcione
    return Promise.resolve({ data: null, error: null }).then(onFulfilled);
  })
}

vi.mock('../../lib/supabase.js', () => ({
  supabaseAdmin: {
    from: vi.fn(() => mockBuilder)
  }
}))

// Mock de OrganizadorService
vi.mock('../../services/identity/OrganizadorService.js', () => ({
  default: {
    findByEmail: vi.fn(),
    getProfile: vi.fn()
  }
}))

import app from '../../index.js'
import OrganizadorService from '../../services/identity/OrganizadorService.js'
import { sendPasswordResetEmail } from '../../utils/mailer.js'

describe('Password Recovery Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
    
    // Reset standard builder behavior
    mockBuilder.single.mockResolvedValue({ data: null, error: null })
    mockBuilder.maybeSingle.mockResolvedValue({ data: null, error: null })
    mockBuilder.then.mockImplementation(function(onFulfilled) {
      return Promise.resolve({ data: null, error: null }).then(onFulfilled);
    })
  })

  // ============================================================
  // POST /api/identity/forgot-password
  // ============================================================
  describe('POST /api/identity/forgot-password', () => {
    const email = 'test@example.com'

    it('retorna 200 con mensaje genérico cuando el email existe', async () => {
      OrganizadorService.findByEmail.mockResolvedValue({ id: 'user-123', email })
      
      // Mock para recentTokens check
      mockBuilder.then.mockImplementationOnce(onFulfilled => onFulfilled({ data: [], error: null }))
      
      const res = await request(app)
        .post('/api/identity/forgot-password')
        .send({ email })

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('Si el email está registrado')
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(email, expect.any(String))
    })

    it('retorna 200 con el mismo mensaje si el email no existe', async () => {
      OrganizadorService.findByEmail.mockResolvedValue(null)

      const res = await request(app)
        .post('/api/identity/forgot-password')
        .send({ email: 'no-existe@test.com' })

      expect(res.status).toBe(200)
      expect(res.body.message).toContain('Si el email está registrado')
      expect(sendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('retorna 429 si hay un token generado hace menos de 1 minuto', async () => {
      OrganizadorService.findByEmail.mockResolvedValue({ id: 'user-123', email })
      mockBuilder.then.mockImplementationOnce(onFulfilled => onFulfilled({ data: [{ id: 't1' }], error: null }))

      const res = await request(app)
        .post('/api/identity/forgot-password')
        .send({ email })

      expect(res.status).toBe(429)
    })
  })

  // ============================================================
  // POST /api/identity/reset-password
  // ============================================================
  describe('POST /api/identity/reset-password', () => {
    const token = 'valid-token'
    const password = 'new-password-123'

    it('actualiza el password con token válido', async () => {
      mockBuilder.single.mockResolvedValueOnce({
        data: { id: 'token-id', user_id: 'user-123' },
        error: null
      })

      const res = await request(app)
        .post('/api/identity/reset-password')
        .send({ token, password })

      expect(res.status).toBe(200)
      expect(mockBuilder.update).toHaveBeenCalledWith(expect.objectContaining({ 
        password_hash: expect.any(String) 
      }))
    })

    it('retorna 410 si el token es inválido o expirado', async () => {
      mockBuilder.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

      const res = await request(app)
        .post('/api/identity/reset-password')
        .send({ token: 'invalido', password })

      expect(res.status).toBe(410)
    })
  })

  // ============================================================
  // POST /api/identity/change-password
  // ============================================================
  describe('POST /api/identity/change-password', () => {
    const oldPassword = 'old-pass-123'
    const newPassword = 'new-pass-123'
    const userId = 'user-123'
    const jwtToken = jwt.sign({ sub: userId, email: 'test@test.com' }, 'test-secret')

    it('cambia la contraseña correctamente estando logueado', async () => {
      // 1. requireOrganizador check
      mockBuilder.single.mockResolvedValueOnce({ data: { id: userId, nombre: 'Test' }, error: null })
      // 2. AuthController gets current hash
      mockBuilder.single.mockResolvedValueOnce({ 
        data: { password_hash: await bcrypt.hash(oldPassword, 10) }, 
        error: null 
      })

      const res = await request(app)
        .post('/api/identity/change-password')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ oldPassword, newPassword })

      expect(res.status).toBe(200)
    })

    it('retorna 401 si la contraseña actual es incorrecta', async () => {
      mockBuilder.single.mockResolvedValueOnce({ data: { id: userId, nombre: 'Test' }, error: null })
      mockBuilder.single.mockResolvedValueOnce({ 
        data: { password_hash: await bcrypt.hash('wrong-pass', 10) }, 
        error: null 
      })

      const res = await request(app)
        .post('/api/identity/change-password')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ oldPassword, newPassword })

      expect(res.status).toBe(401)
    })
  })
})
