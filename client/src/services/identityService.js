import { api } from "../lib/api";

export const identityService = {
  getMe: () => api.get("/identity/me"),
  getLigas: () => api.get("/identity/ligas"),
  createLiga: (data) => api.post("/identity/ligas", data),
  updateLiga: (id, data) => api.put(`/identity/ligas/${id}`, data),
  deleteLiga: (id) => api.delete(`/identity/ligas/${id}`),
  getDashboardStats: (ligaId) => api.get(`/identity/ligas/${ligaId}/stats`),
};
