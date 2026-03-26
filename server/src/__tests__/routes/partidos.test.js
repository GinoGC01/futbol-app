import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../index.js'

describe('GET /api/partidos', () => {
  it('devuelve 400 sin temporada_id', async () => {
    const res = await request(app).get('/api/partidos')
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('temporada_id requerido')
  })
})

describe('POST /api/partidos', () => {
  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app).post('/api/partidos').send({})
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/partidos/:id/resultado', () => {
  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app)
      .put('/api/partidos/some-id/resultado')
      .send({ goles_local: 2, goles_visitante: 1, estado: 'finalizado' })
    expect(res.status).toBe(401)
  })
})

describe('PUT /api/partidos/:id/goleadores', () => {
  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app)
      .put('/api/partidos/some-id/goleadores')
      .send({ goleadores: [{ jugador_id: 'abc', minuto: 15 }] })
    expect(res.status).toBe(401)
  })
})
