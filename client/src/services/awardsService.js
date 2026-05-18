import { api } from "../lib/api";

export const awardsService = {
  getPremios: (temporadaId) =>
    api.get(`/awards/premios?temporada_id=${temporadaId}`),
  crearPremio: (data) => api.post("/awards/premios", data),
  sugerirGanadores: (premioId) =>
    api.get(`/awards/premios/${premioId}/analisis`),
  asignarGanador: (premioId, data) =>
    api.post(`/awards/premios/${premioId}/ganadores`, data),
  togglePublicacion: (premioId, publicado) =>
    api.patch(`/awards/premios/${premioId}/publicar`, { publicado }),
};
