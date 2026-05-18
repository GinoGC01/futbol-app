import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { awardsService } from "../services/awardsService";

export function usePremiosAdmin(temporadaId) {
  return useQuery({
    queryKey: ["premios-admin", temporadaId],
    queryFn: () => awardsService.getPremios(temporadaId),
    enabled: !!temporadaId,
  });
}

export function useCrearPremio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: awardsService.crearPremio,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["premios-admin"] }),
  });
}

export function useAsignarGanador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ premioId, ...data }) =>
      awardsService.asignarGanador(premioId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["premios-admin"] }),
  });
}

export function useTogglePublicacionPremio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publicado }) =>
      awardsService.togglePublicacion(id, publicado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["premios-admin"] }),
  });
}
