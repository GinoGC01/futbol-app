import { api } from "../lib/api";

export const alertsService = {
  getAlertas: (ligaId) => api.get(`/alerts?liga_id=${ligaId}`),
  resolverAlerta: (id) => api.patch(`/alerts/${id}/resolve`),
  evaluarAlertas: () => api.post("/alerts/evaluate"),
};
