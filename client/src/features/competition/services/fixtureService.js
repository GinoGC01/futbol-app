import { api } from "../../../lib/api";

export const fixtureService = {
  getJornadaMatches: (jornadaId) => api.get(`/match/partidos/jornada/${jornadaId}`),
};
