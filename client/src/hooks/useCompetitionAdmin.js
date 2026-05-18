import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { competitionService } from "../services/competitionService";

export function useTemporadas(ligaId) {
  return useQuery({
    queryKey: ["temporadas", ligaId],
    queryFn: () => competitionService.getTemporadas(ligaId),
    enabled: !!ligaId,
  });
}

export function useTemporadaTree(id) {
  return useQuery({
    queryKey: ["temporada-tree", id],
    queryFn: () => competitionService.getTemporadaTree(id),
    enabled: !!id,
  });
}

export function useFormatos() {
  return useQuery({
    queryKey: ["competition-formatos"],
    queryFn: competitionService.getFormatos,
  });
}

export function useCreateTemporada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: competitionService.createTemporada,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temporadas"] }),
  });
}

export function useUpdateTemporada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => competitionService.updateTemporada(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["temporadas"] });
      qc.invalidateQueries({ queryKey: ["temporada-tree", vars.id] });
    },
  });
}

export function useDeleteTemporada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: competitionService.deleteTemporada,
    onSuccess: (_, deletedId) => {
      qc.setQueriesData({ queryKey: ["temporadas"] }, (oldData) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.filter(t => t.id !== deletedId);
      });
      qc.invalidateQueries({ queryKey: ["temporadas"] });
      qc.removeQueries({ queryKey: ["temporada-tree", deletedId] });
    },
  });
}

export function useCreateFase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: competitionService.createFase,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temporada-tree"] }),
  });
}

export function useCreateJornadas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: competitionService.createJornadas,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temporada-tree"] }),
  });
}

export function useUpdateFase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => competitionService.updateFase(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temporada-tree"] }),
  });
}

export function useUpdateJornada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => competitionService.updateJornada(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temporada-tree"] }),
  });
}

export function useCerrarJornada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: competitionService.cerrarJornada,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["temporada-tree"] }),
  });
}
