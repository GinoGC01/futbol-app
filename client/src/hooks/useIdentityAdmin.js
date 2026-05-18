import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { identityService } from "../services/identityService";
import { useLigaActiva } from "../context/LigaContext";

export function useMe() {
  return useQuery({ queryKey: ["me"], queryFn: identityService.getMe });
}

export function useLigas() {
  return useQuery({
    queryKey: ["admin-ligas"],
    queryFn: identityService.getLigas,
  });
}

export function useDashboardStats(ligaId) {
  return useQuery({
    queryKey: ["dashboard-stats", ligaId],
    queryFn: () => identityService.getDashboardStats(ligaId),
    enabled: !!ligaId,
  });
}

export function useAdminLiga() {
  const { liga, isLoading } = useLigaActiva();
  return { 
    data: liga ? { liga_id: liga.id, ...liga } : null, 
    isLoading 
  };
}

export function useCreateLiga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityService.createLiga,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ligas"] }),
  });
}

export function useUpdateLiga() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => identityService.updateLiga(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ligas"] }),
  });
}

export function useDeleteLiga() {
  const qc = useQueryClient();
  const { setLiga } = useLigaActiva();

  return useMutation({
    mutationFn: identityService.deleteLiga,
    onSuccess: () => {
      setLiga(null);
      qc.invalidateQueries({ queryKey: ["admin-ligas"] });
    },
  });
}
