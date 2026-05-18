import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { matchService } from "../services/matchService";

export function useFixtureAdmin(jornadaId) {
  return useQuery({
    queryKey: ["fixture-admin", jornadaId],
    queryFn: () => matchService.getFixtureAdmin(jornadaId),
    enabled: !!jornadaId,
  });
}

export function useEventos(partidoId) {
  return useQuery({
    queryKey: ["eventos", partidoId],
    queryFn: () => matchService.getEventos(partidoId),
    enabled: !!partidoId,
  });
}

export function useCreatePartido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: matchService.createPartido,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["temporada-tree"] });
    },
  });
}

export function useGenerateFixture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ faseId, equipoIds }) =>
      matchService.generateFixture(faseId, equipoIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["temporada-tree"] });
    },
  });
}

export function useGenerateKnockout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ faseId, equipoIds }) =>
      matchService.generateKnockout(faseId, equipoIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["temporada-tree"] });
    },
  });
}

export function useRegistrarGol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partidoId, ...data }) =>
      matchService.registrarGol(partidoId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["eventos", vars.partidoId] });
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["goleadores"] });
      qc.invalidateQueries({ queryKey: ["equipo-detalle"] });
    },
  });
}

export function useRegistrarTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partidoId, ...data }) =>
      matchService.registrarTarjeta(partidoId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["eventos", vars.partidoId] });
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["tarjetas"] });
      qc.invalidateQueries({ queryKey: ["equipo-detalle"] });
    },
  });
}

export function useRegistrarResultado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => matchService.registrarResultado(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["tabla"] });
      qc.invalidateQueries({ queryKey: ["equipo-detalle"] });
    },
  });
}

export function useCambiarEstadoPartido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }) =>
      matchService.cambiarEstadoPartido(id, estado),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["eventos", vars.id] });
      qc.invalidateQueries({ queryKey: ["tabla"] });
      qc.invalidateQueries({ queryKey: ["equipo-detalle"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
