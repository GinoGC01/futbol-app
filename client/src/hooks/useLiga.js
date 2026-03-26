import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useLiga(slug) {
  return useQuery({
    queryKey: ['liga', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ligas')
        .select('id, nombre, slug, zona, logo_url')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000
  })
}

export function useTemporadaActiva(ligaId) {
  return useQuery({
    queryKey: ['temporada-activa', ligaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporadas')
        .select('id, nombre, inicio, fin')
        .eq('liga_id', ligaId)
        .eq('activa', true)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!ligaId
  })
}

export function useTablaPosc(temporadaId) {
  return useQuery({
    queryKey: ['tabla', temporadaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vista_tabla_posiciones')
        .select('*')
        .eq('temporada_id', temporadaId)
      if (error) throw error
      return data ?? []
    },
    enabled: !!temporadaId
  })
}

export function usePartidos(temporadaId, estado) {
  return useQuery({
    queryKey: ['partidos', temporadaId, estado],
    queryFn: async () => {
      let q = supabase
        .from('partidos')
        .select(`
          id, fecha, cancha, estado, goles_local, goles_visitante, jornada,
          equipo_local:equipos!partidos_equipo_local_fkey(id, nombre, escudo_url),
          equipo_visitante:equipos!partidos_equipo_visitante_fkey(id, nombre, escudo_url)
        `)
        .eq('temporada_id', temporadaId)
        .order('jornada', { ascending: true, nullsFirst: false })
        .order('fecha', { ascending: true })
      if (estado) q = q.eq('estado', estado)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
    enabled: !!temporadaId
  })
}

export function useGoleadores(temporadaId) {
  return useQuery({
    queryKey: ['goleadores', temporadaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vista_goleadores')
        .select('*')
        .eq('temporada_id', temporadaId)
        .gt('goles', 0)
        .limit(20)
      if (error) throw error
      return data ?? []
    },
    enabled: !!temporadaId
  })
}
