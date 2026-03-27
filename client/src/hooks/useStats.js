import { useQuery } from '@tanstack/react-query'
import { statsService } from '../services/statsService'

const STALE_5MIN = 5 * 60 * 1000

export function useTabla(params) {
  return useQuery({
    queryKey: ['tabla', params],
    queryFn: () => statsService.getTabla(params),
    staleTime: STALE_5MIN,
    enabled: !!(params?.fase_id || params?.temporada_id)
  })
}

export function useGoleadores(params) {
  return useQuery({
    queryKey: ['goleadores', params],
    queryFn: () => statsService.getGoleadores(params),
    staleTime: STALE_5MIN,
    enabled: !!(params?.temporada_id || params?.fase_id)
  })
}

export function useTarjetas(params) {
  return useQuery({
    queryKey: ['tarjetas', params],
    queryFn: () => statsService.getTarjetas(params),
    staleTime: STALE_5MIN,
    enabled: !!(params?.temporada_id || params?.fase_id)
  })
}

export function useFixture(jornadaId) {
  return useQuery({
    queryKey: ['fixture', jornadaId],
    queryFn: () => statsService.getFixture(jornadaId),
    staleTime: STALE_5MIN,
    enabled: !!jornadaId
  })
}

export function useEquipoDetalle(equipoId) {
  return useQuery({
    queryKey: ['equipo-detalle', equipoId],
    queryFn: () => statsService.getEquipoDetalle(equipoId),
    staleTime: STALE_5MIN,
    enabled: !!equipoId
  })
}

export function usePremiosPublicados(temporadaId) {
  return useQuery({
    queryKey: ['premios-pub', temporadaId],
    queryFn: () => statsService.getPremiosPublicados(temporadaId),
    staleTime: STALE_5MIN,
    enabled: !!temporadaId
  })
}
