import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'

export function useAdminLiga() {
  return useQuery({
    queryKey: ['admin-liga'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('admin_users')
        .select('liga_id, ligas(id, nombre, slug)')
        .eq('id', user.id)
        .single()
      if (error) throw error
      return data
    }
  })
}

export function useAdminEquipos(ligaId) {
  return useQuery({
    queryKey: ['admin-equipos', ligaId],
    queryFn: () => apiFetch(`/equipos?liga_id=${ligaId}`),
    enabled: !!ligaId
  })
}

export function useAdminTemporada(ligaId) {
  return useQuery({
    queryKey: ['admin-temporada', ligaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporadas')
        .select('id, nombre, activa')
        .eq('liga_id', ligaId)
        .eq('activa', true)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!ligaId
  })
}

export function useAdminPartidos(temporadaId, estado) {
  return useQuery({
    queryKey: ['admin-partidos', temporadaId, estado],
    queryFn: () => apiFetch(`/partidos?temporada_id=${temporadaId}${estado ? `&estado=${estado}` : ''}`),
    enabled: !!temporadaId
  })
}

export function useCrearEquipo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (nombre) => apiFetch('/equipos', {
      method: 'POST',
      body: JSON.stringify({ nombre })
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-equipos'] })
  })
}

export function useCrearPartido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => apiFetch('/partidos', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-partidos'] })
  })
}

export function useCargarResultado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => apiFetch(`/partidos/${id}/resultado`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-partidos'] })
      qc.invalidateQueries({ queryKey: ['tabla'] })
    }
  })
}
