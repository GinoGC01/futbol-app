import { api } from '../lib/api'

export const adminService = {
  // Identity
  getMe: () => api.get('/identity/me'),
  getLigas: () => api.get('/identity/ligas'),
  createLiga: (data) => api.post('/identity/ligas', data),

  // Competition
  getTemporadas: (ligaId) => api.get(`/competition/temporadas?liga_id=${ligaId}`),
  createTemporada: (data) => api.post('/competition/temporadas', data),
  updateEstadoTemporada: (id, estado) => api.patch(`/competition/temporadas/${id}/estado`, { estado }),
  getTemporadaTree: (id) => api.get(`/competition/temporadas/${id}/tree`),
  createFase: (data) => api.post('/competition/fases', data),
  createJornadas: (data) => api.post('/competition/jornadas/batch', data),

  // Roster
  getEquipos: (ligaId) => api.get(`/roster/equipos?liga_id=${ligaId}`),
  createEquipo: (data) => api.post('/roster/equipos', data),
  inscribirEquipo: (data) => api.post('/roster/inscripciones', data),
  getPlantel: (inscripcionId) => api.get(`/roster/inscripciones/${inscripcionId}/plantel`),
  addJugadorAPlantel: (inscripcionId, data) => api.post(`/roster/inscripciones/${inscripcionId}/jugadores`, data),
  searchJugadores: (query) => api.get(`/roster/jugadores/search?q=${encodeURIComponent(query)}`),
  createJugador: (data) => api.post('/roster/jugadores', data),
  updatePago: (inscripcionId, data) => api.patch(`/roster/inscripciones/${inscripcionId}/pago`, data),

  // Match
  createPartido: (data) => api.post('/match/partidos', data),
  cambiarEstadoPartido: (id, estado) => api.patch(`/match/partidos/${id}/estado`, { estado }),
  registrarResultado: (id, data) => api.patch(`/match/partidos/${id}/resultado`, data),
  updateLogistica: (id, data) => api.patch(`/match/partidos/${id}/logistica`, data),
  getFixtureAdmin: (jornadaId) => api.get(`/match/partidos/jornada/${jornadaId}`),
  registrarGol: (partidoId, data) => api.post(`/match/partidos/${partidoId}/goles`, data),
  registrarTarjeta: (partidoId, data) => api.post(`/match/partidos/${partidoId}/tarjetas`, data),
  getEventos: (partidoId) => api.get(`/match/partidos/${partidoId}/eventos`),
  verificarElegibilidad: (inscripcionJugadorId) => api.get(`/match/elegibilidad/${inscripcionJugadorId}`),

  // Awards
  getPremios: (temporadaId) => api.get(`/awards/premios?temporada_id=${temporadaId}`),
  crearPremio: (data) => api.post('/awards/premios', data),
  sugerirGanadores: (premioId) => api.get(`/awards/premios/${premioId}/analisis`),
  asignarGanador: (premioId, data) => api.post(`/awards/premios/${premioId}/ganadores`, data),
  togglePublicacion: (premioId, publicado) => api.patch(`/awards/premios/${premioId}/publicar`, { publicado })
}
