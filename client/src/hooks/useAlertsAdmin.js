import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsService } from "../services/alertsService";

export function useAlertas(ligaId) {
  return useQuery({
    queryKey: ["alertas", ligaId],
    queryFn: () => alertsService.getAlertas(ligaId),
    enabled: !!ligaId,
  });
}

export function useResolverAlerta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsService.resolverAlerta,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alertas"] });
    },
  });
}

export function useEvaluarAlertas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: alertsService.evaluarAlertas,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alertas"] });
    },
  });
}
