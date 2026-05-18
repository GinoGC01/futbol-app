import { api } from "../lib/api";

export const competitionService = {
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
  updateFase: (id, data) => api.patch(`/competition/fases/${id}`, data),
  updateJornada: (id, data) => api.patch(`/competition/jornadas/${id}`, data),
  cerrarJornada: (id) => api.patch(`/competition/jornadas/${id}/cerrar`),
};
