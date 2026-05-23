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
  autoExpirarJornadas: () => api.post("/competition/jornadas/auto-expirar"),
  getGruposByFase: (faseId) => api.get(`/competition/grupos/fase/${faseId}`),
  createGrupo: (data) => api.post("/competition/grupos", data),
  updateGrupo: (id, data) => api.patch(`/competition/grupos/${id}`, data),
  deleteGrupo: (id) => api.delete(`/competition/grupos/${id}`),
  assignEquiposToGrupo: (id, equipoIds) => api.post(`/competition/grupos/${id}/equipos`, { equipo_ids: equipoIds }),
  removeEquipoFromGrupo: (grupoId, equipoId) => api.delete(`/competition/grupos/${grupoId}/equipos/${equipoId}`),
};
