import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../index.js'

describe('GET /health', () => {
  it('responde 200 con status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('responde 404 para rutas inexistentes', async () => {
    const res = await request(app).get('/ruta-inexistente')
    expect(res.status).toBe(404)
  })
})
