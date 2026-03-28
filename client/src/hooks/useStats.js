import { useQuery } from '@tanstack/react-query'
import { statsService } from '../services/statsService'

const STALE_30S = 30 * 1000

export function useTabla(params) {
  return useQuery({
    queryKey: ['tabla', params],
    queryFn: () => statsService.getTabla(params),
    staleTime: STALE_30S,
    enabled: !!(params?.fase_id || params?.temporada_id)
  })
}

export function useGoleadores(params) {
  return useQuery({
    queryKey: ['goleadores', params],
    queryFn: () => statsService.getGoleadores(params),
    staleTime: STALE_30S,
    enabled: !!(params?.temporada_id || params?.fase_id)
  })
}

export function useTarjetas(params) {
  return useQuery({
    queryKey: ['tarjetas', params],
    queryFn: () => statsService.getTarjetas(params),
    staleTime: STALE_30S,
    enabled: !!(params?.temporada_id || params?.fase_id)
  })
}

export function useFixture(jornadaId) {
  return useQuery({
    queryKey: ['fixture', jornadaId],
    queryFn: () => statsService.getFixture(jornadaId),
    staleTime: STALE_30S,
    enabled: !!jornadaId
  })
}

export function useEquipoDetalle(equipoId) {
  return useQuery({
    queryKey: ['equipo-detalle', equipoId],
    queryFn: () => statsService.getEquipoDetalle(equipoId),
    staleTime: STALE_30S,
    enabled: !!equipoId
  })
}

export function usePremiosPublicados(temporadaId) {
  return useQuery({
    queryKey: ['premios-pub', temporadaId],
    queryFn: () => statsService.getPremiosPublicados(temporadaId),
    staleTime: STALE_30S,
    enabled: !!temporadaId
  })
}
