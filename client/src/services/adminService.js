import { api } from "../lib/api";

export const adminService = {
  // Identity
  getMe: () => api.get("/identity/me"),
  getLigas: () => api.get("/identity/ligas"),
  createLiga: (data) => api.post("/identity/ligas", data),
  updateLiga: (id, data) => api.put(`/identity/ligas/${id}`, data),
  deleteLiga: (id) => api.delete(`/identity/ligas/${id}`),
  getDashboardStats: (ligaId) => api.get(`/identity/ligas/${ligaId}/stats`),

  // Competition
  getTemporadas: (ligaId) =>
    api.get(`/competition/temporadas?liga_id=${ligaId}`),
  createTemporada: (data) => api.post("/competition/temporadas", data),
  updateTemporada: (id, data) =>
    api.patch(`/competition/temporadas/${id}`, data),
  deleteTemporada: (id) => api.delete(`/competition/temporadas/${id}`),
  updateEstadoTemporada: (id, estado) =>
    api.patch(`/competition/temporadas/${id}/estado`, { estado }),
  getTemporadaTree: (id) => api.get(`/competition/temporadas/${id}/tree`),
  getFormatos: () => api.get("/competition/formatos"),
  createFase: (data) => api.post("/competition/fases", data),
  createJornadas: (data) => api.post("/competition/jornadas/batch", data),

  // Roster Management (Elite System)
  getEquipos: (ligaId) => api.get(`/roster/equipos?liga_id=${ligaId}`),
  createEquipo: (data) => api.post("/roster/equipos", data),
  updateEquipo: (id, data) => api.put(`/roster/equipos/${id}`, data),
  deleteEquipo: (id) => api.delete(`/roster/equipos/${id}`),
  inscribirEquipo: (data) => api.post("/roster/inscripciones/equipo", data),
  inscribirEquiposBatch: (data) =>
    api.post("/roster/inscripciones/equipo/batch", data),
  getInscripcionesByEquipo: (ligaId, equipoId) =>
    api.get(`/roster/inscripciones/equipo/${equipoId}?liga_id=${ligaId}`),
  getInscripcionesByTemporada: (temporadaId) =>
    api.get(`/roster/inscripciones?temporada_id=${temporadaId}`),
  getJugadoresByLiga: (ligaId) =>
    api.get(`/roster/jugadores?liga_id=${ligaId}`),
  getJugadoresOrganizador: (page = 1, limit = 20) =>
    api.get(`/roster/jugadores/recientes?page=${page}&limit=${limit}`),
  addJugadorAPlantel: (data) => api.post("/roster/inscripciones/jugador", data),
  addJugadoresBatch: (data) => api.post("/roster/inscripciones/jugador/batch", data),
  searchJugadores: (query, ligaId) =>
    api.get(
      `/roster/jugadores/search?q=${encodeURIComponent(query)}${ligaId ? `&liga_id=${ligaId}` : ""}`,
    ),
  createJugador: (data) => api.post("/roster/jugadores", data),
  updatePago: (inscripcionId, data) =>
    api.patch(`/roster/inscripciones/pago/${inscripcionId}`, data),

  // Competition — Fases & Jornadas
  updateFase: (id, data) => api.patch(`/competition/fases/${id}`, data),
  updateJornada: (id, data) => api.patch(`/competition/jornadas/${id}`, data),
  cerrarJornada: (id) => api.patch(`/competition/jornadas/${id}/cerrar`),

  // Match Management
  createPartido: (data) => api.post("/match/partidos", data),
  generateFixture: (faseId, equipoIds) =>
    api.post(`/match/partidos/generate/${faseId}`, { equipo_ids: equipoIds }),
  generateKnockout: (faseId, equipoIds) =>
    api.post(`/match/partidos/knockout/${faseId}`, { equipo_ids: equipoIds }),
  cambiarEstadoPartido: (id, estado) =>
    api.patch(`/match/partidos/${id}/estado`, { estado }),
  registrarResultado: (id, data) =>
    api.patch(`/match/partidos/${id}/resultado`, data),
  updateLogistica: (id, data) =>
    api.patch(`/match/partidos/${id}/logistica`, data),
  getFixtureAdmin: (jornadaId) =>
    api.get(`/match/partidos/jornada/${jornadaId}`),
  registrarGol: (partidoId, data) =>
    api.post(`/match/partidos/${partidoId}/goles`, data),
  registrarTarjeta: (partidoId, data) =>
    api.post(`/match/partidos/${partidoId}/tarjetas`, data),
  getEventos: (partidoId) => api.get(`/match/partidos/${partidoId}/eventos`),
  verificarElegibilidad: (inscripcionJugadorId) =>
    api.get(`/match/elegibilidad/${inscripcionJugadorId}`),

  // Awards
  getPremios: (temporadaId) =>
    api.get(`/awards/premios?temporada_id=${temporadaId}`),
  crearPremio: (data) => api.post("/awards/premios", data),
  sugerirGanadores: (premioId) =>
    api.get(`/awards/premios/${premioId}/analisis`),
  asignarGanador: (premioId, data) =>
    api.post(`/awards/premios/${premioId}/ganadores`, data),
  togglePublicacion: (premioId, publicado) =>
    api.patch(`/awards/premios/${premioId}/publicar`, { publicado }),

  // Alerts
  getAlertas: (ligaId) => api.get(`/alerts?liga_id=${ligaId}`),
  resolverAlerta: (id) => api.patch(`/alerts/${id}/resolve`),
  evaluarAlertas: () => api.post("/alerts/evaluate"),
};
