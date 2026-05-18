import { api } from "../lib/api";

export const rosterService = {
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
};
