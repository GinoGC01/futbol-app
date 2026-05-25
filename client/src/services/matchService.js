import { api } from "../lib/api";

export const matchService = {
  createPartido: (data) => api.post("/match/partidos", data),
  generateFixture: (faseId, equipoIds) =>
    api.post(`/match/partidos/generate/${faseId}`, { equipo_ids: equipoIds }),
  generateKnockout: (faseId, equipoIds) =>
    api.post(`/match/partidos/knockout/${faseId}`, { equipo_ids: equipoIds }),
  generateHorariosJornada: (jornadaId) =>
    api.post(`/match/horarios/jornada/${jornadaId}`),
  generateHorariosFase: (faseId) =>
    api.post(`/match/horarios/fase/${faseId}`),
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
  updateTiempoAdicionado: (id, segundos) =>
    api.patch(`/match/partidos/${id}/tiempo-adicionado`, { segundos }),
  actualizarGol: (partidoId, golId, data) =>
    api.patch(`/match/partidos/${partidoId}/goles/${golId}`, data),
  eliminarGol: (partidoId, golId) =>
    api.delete(`/match/partidos/${partidoId}/goles/${golId}`),
  actualizarTarjeta: (partidoId, tarjetaId, data) =>
    api.patch(`/match/partidos/${partidoId}/tarjetas/${tarjetaId}`, data),
  eliminarTarjeta: (partidoId, tarjetaId) =>
    api.delete(`/match/partidos/${partidoId}/tarjetas/${tarjetaId}`),
  verificarElegibilidad: (inscripcionJugadorId) =>
    api.get(`/match/elegibilidad/${inscripcionJugadorId}`),
};
