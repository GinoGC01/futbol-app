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

function invalidarEventosPublicos(qc, partidoId) {
  qc.invalidateQueries({ queryKey: ["partido-eventos", partidoId] });
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
      invalidarEventosPublicos(qc, vars.partidoId);
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
      invalidarEventosPublicos(qc, vars.partidoId);
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

export function useGenerateHorariosJornada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: matchService.generateHorariosJornada,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["temporada-tree"] });
    },
  });
}

export function useGenerateHorariosFase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: matchService.generateHorariosFase,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["temporada-tree"] });
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
      invalidarEventosPublicos(qc, vars.id);
    },
  });
}

export function useUpdateTiempoAdicionado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, segundos }) =>
      matchService.updateTiempoAdicionado(id, segundos),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      invalidarEventosPublicos(qc, vars.id);
    },
  });
}

export function useActualizarGol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partidoId, golId, ...data }) =>
      matchService.actualizarGol(partidoId, golId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["eventos", vars.partidoId] });
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["goleadores"] });
      invalidarEventosPublicos(qc, vars.partidoId);
    },
  });
}

export function useEliminarGol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partidoId, golId }) =>
      matchService.eliminarGol(partidoId, golId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["eventos", vars.partidoId] });
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["goleadores"] });
      invalidarEventosPublicos(qc, vars.partidoId);
    },
  });
}

export function useActualizarTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partidoId, tarjetaId, ...data }) =>
      matchService.actualizarTarjeta(partidoId, tarjetaId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["eventos", vars.partidoId] });
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["tarjetas"] });
      invalidarEventosPublicos(qc, vars.partidoId);
    },
  });
}

export function useEliminarTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partidoId, tarjetaId }) =>
      matchService.eliminarTarjeta(partidoId, tarjetaId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["eventos", vars.partidoId] });
      qc.invalidateQueries({ queryKey: ["fixture-admin"] });
      qc.invalidateQueries({ queryKey: ["tarjetas"] });
      invalidarEventosPublicos(qc, vars.partidoId);
    },
  });
}
