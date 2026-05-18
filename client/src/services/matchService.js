import { api } from "../lib/api";

export const matchService = {
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
  getLiveMatches: (temporadaId) =>
    api.get(`/match/partidos/live/${temporadaId}`),
  registrarGol: (partidoId, data) =>
    api.post(`/match/partidos/${partidoId}/goles`, data),
  registrarTarjeta: (partidoId, data) =>
    api.post(`/match/partidos/${partidoId}/tarjetas`, data),
  getEventos: (partidoId) => api.get(`/match/partidos/${partidoId}/eventos`),
  verificarElegibilidad: (inscripcionJugadorId) =>
    api.get(`/match/elegibilidad/${inscripcionJugadorId}`),
};
