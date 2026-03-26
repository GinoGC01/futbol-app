import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../index.js'

describe('requireAuth middleware', () => {
  it('rechaza requests sin header Authorization', async () => {
    const res = await request(app).put('/api/ligas/me').send({})
    expect(res.status).toBe(401)
    expect(res.body.error).toBeDefined()
  })

  it('rechaza header sin Bearer', async () => {
    const res = await request(app)
      .put('/api/ligas/me')
      .set('Authorization', 'Basic xxxx')
      .send({})
    expect(res.status).toBe(401)
  })

  it('rechaza token malformado', async () => {
    const res = await request(app)
      .put('/api/ligas/me')
      .set('Authorization', 'Bearer token-claramente-invalido')
      .send({})
    expect(res.status).toBe(401)
  })
})
