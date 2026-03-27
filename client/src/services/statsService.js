import { api } from '../lib/api'

export const statsService = {
  getTabla: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/stats/tabla?${qs}`)
  },

  getGoleadores: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/stats/goleadores?${qs}`)
  },

  getTarjetas: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/stats/tarjetas?${qs}`)
  },

  getFixture: (jornadaId) => api.get(`/stats/fixture/${jornadaId}`),

  getEquipoDetalle: (equipoId) => api.get(`/stats/equipo/${equipoId}/detalle`),

  getPremiosPublicados: (temporadaId) =>
    api.get(`/stats/premios?temporada_id=${temporadaId}`)
}
