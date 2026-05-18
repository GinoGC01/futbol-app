import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rosterService } from "../services/rosterService";

export function useEquipos(ligaId) {
  return useQuery({
    queryKey: ["equipos", ligaId],
    queryFn: () => rosterService.getEquipos(ligaId),
    enabled: !!ligaId,
  });
}

export const useJugadoresLiga = (ligaId) => {
  return useQuery({
    queryKey: ["jugadores-liga", ligaId],
    queryFn: () => rosterService.getJugadoresByLiga(ligaId),
    enabled: !!ligaId,
  });
};

export const useJugadoresOrganizador = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["jugadores-organizador", page, limit],
    queryFn: () => rosterService.getJugadoresOrganizador(page, limit),
    keepPreviousData: true,
  });
};

export const useSearchGlobalJugadores = (queryTexto, ligaId) => {
  return useQuery({
    queryKey: ["search-jugadores", queryTexto, ligaId],
    queryFn: () => rosterService.searchJugadores(queryTexto, ligaId),
    enabled: !!queryTexto && queryTexto.length >= 2,
    keepPreviousData: true,
  });
};

export function useCreateEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rosterService.createEquipo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipos"] }),
  });
}

export function useInscribirEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rosterService.inscribirEquipo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipos"] });
      qc.invalidateQueries({ queryKey: ["inscripciones-equipo"] });
    },
  });
}

export function useInscribirEquiposBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rosterService.inscribirEquiposBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["equipos"] });
      qc.invalidateQueries({ queryKey: ["inscripciones-equipo"] });
    },
  });
}

export function useUpdateEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => rosterService.updateEquipo(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipos"] }),
  });
}

export function useUpdatePago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, monto_abonado }) =>
      rosterService.updatePago(id, { monto_abonado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscripciones-equipo"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useInscripcionesEquipo(ligaId, equipoId) {
  return useQuery({
    queryKey: ["inscripciones-equipo", ligaId, equipoId],
    queryFn: () => rosterService.getInscripcionesByEquipo(ligaId, equipoId),
    enabled: !!ligaId && !!equipoId,
  });
}

export function useInscripcionesTemporada(temporadaId) {
  return useQuery({
    queryKey: ["inscripciones-temporada", temporadaId],
    queryFn: () => rosterService.getInscripcionesByTemporada(temporadaId),
    enabled: !!temporadaId,
  });
}

export function useAddJugador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rosterService.addJugadorAPlantel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscripciones-equipo"] });
      qc.invalidateQueries({ queryKey: ["equipos"] });
    },
  });
}

export function useAddJugadoresBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rosterService.addJugadoresBatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscripciones-equipo"] });
      qc.invalidateQueries({ queryKey: ["equipos"] });
      qc.invalidateQueries({ queryKey: ["jugadores-liga"] });
    },
  });
}

export function useDeleteEquipo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rosterService.deleteEquipo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipos"] }),
  });
}
