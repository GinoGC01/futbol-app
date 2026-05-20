import { useQuery } from "@tanstack/react-query";
import { fixtureService } from "../services/fixtureService";
import { useMemo } from "react";

export function useJornadaMatches(jornadaId) {
  const query = useQuery({
    queryKey: ["fixture-admin", jornadaId], // Keep the same queryKey so we reuse cache
    queryFn: () => fixtureService.getJornadaMatches(jornadaId),
    enabled: !!jornadaId,
  });

  const groupedMatches = useMemo(() => {
    if (!query.data?.partidos) return {};
    
    return query.data.partidos.reduce((acc, p) => {
      const groupName = p.grupo?.nombre || 'General';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(p);
      return acc;
    }, {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.partidos]);

  return {
    ...query,
    groupedMatches,
    partidos: query.data?.partidos || []
  };
}
