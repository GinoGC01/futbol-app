import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/adminService'

// Identity
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: adminService.getMe })
}
export function useLigas() {
  return useQuery({ queryKey: ['admin-ligas'], queryFn: adminService.getLigas })
}

// Competition
export function useTemporadas(ligaId) {
  return useQuery({
    queryKey: ['temporadas', ligaId],
    queryFn: () => adminService.getTemporadas(ligaId),
    enabled: !!ligaId
  })
}
export function useTemporadaTree(id) {
  return useQuery({
    queryKey: ['temporada-tree', id],
    queryFn: () => adminService.getTemporadaTree(id),
    enabled: !!id
  })
}
export function useFormatos() {
  return useQuery({
    queryKey: ['competition-formatos'],
    queryFn: adminService.getFormatos
  })
}

// Roster
export function useEquipos(ligaId) {
  return useQuery({
    queryKey: ['equipos', ligaId],
    queryFn: () => adminService.getEquipos(ligaId),
    enabled: !!ligaId
  })
}

export const useJugadoresLiga = (ligaId) => {
  return useQuery({
    queryKey: ['jugadores-liga', ligaId],
    queryFn: () => adminService.getJugadoresByLiga(ligaId),
    enabled: !!ligaId
  })
}

export const useJugadoresOrganizador = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['jugadores-organizador', page, limit],
    queryFn: () => adminService.getJugadoresOrganizador(page, limit),
    keepPreviousData: true
  })
}

export const useSearchGlobalJugadores = (queryTexto) => {
  return useQuery({
    queryKey: ['search-jugadores', queryTexto],
    queryFn: () => adminService.searchJugadores(queryTexto),
    enabled: !!queryTexto && queryTexto.length >= 2,
    keepPreviousData: true
  })
}

// Match
export function useFixtureAdmin(jornadaId) {
  return useQuery({
    queryKey: ['fixture-admin', jornadaId],
    queryFn: () => adminService.getFixtureAdmin(jornadaId),
    enabled: !!jornadaId
  })
}
export function useEventos(partidoId) {
  return useQuery({
    queryKey: ['eventos', partidoId],
    queryFn: () => adminService.getEventos(partidoId),
    enabled: !!partidoId
  })
}

// Awards
export function usePremiosAdmin(temporadaId) {
  return useQuery({
    queryKey: ['premios-admin', temporadaId],
    queryFn: () => adminService.getPremios(temporadaId),
    enabled: !!temporadaId
  })
}

// Mutations
export function useCreateLiga() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createLiga,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-ligas'] })
  })
}

export function useCreateTemporada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createTemporada,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temporadas'] })
  })
}

export function useUpdateTemporada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateTemporada(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['temporadas'] })
      qc.invalidateQueries({ queryKey: ['temporada-tree', vars.id] })
    }
  })
}

export function useCreateFase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createFase,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temporada-tree'] })
  })
}

export function useCreateJornadas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createJornadas,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temporada-tree'] })
  })
}

export function useUpdateFase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateFase(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temporada-tree'] })
  })
}

export function useUpdateJornada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateJornada(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['temporada-tree'] })
  })
}

export function useCreatePartido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createPartido,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixture-admin'] })
      qc.invalidateQueries({ queryKey: ['temporada-tree'] })
    }
  })
}

export function useGenerateFixture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ faseId, equipoIds }) => adminService.generateFixture(faseId, equipoIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixture-admin'] })
      qc.invalidateQueries({ queryKey: ['temporada-tree'] })
    }
  })
}

export function useCreateEquipo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.createEquipo,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipos'] })
  })
}

export function useInscribirEquipo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.inscribirEquipo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipos'] })
      qc.invalidateQueries({ queryKey: ['inscripciones-equipo'] })
    }
  })
}

export function useRegistrarGol() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ partidoId, ...data }) => adminService.registrarGol(partidoId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['eventos', vars.partidoId] })
      qc.invalidateQueries({ queryKey: ['fixture-admin'] })
    }
  })
}

export function useRegistrarTarjeta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ partidoId, ...data }) => adminService.registrarTarjeta(partidoId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['eventos', vars.partidoId] })
      qc.invalidateQueries({ queryKey: ['fixture-admin'] })
    }
  })
}

export function useCambiarEstadoPartido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }) => adminService.cambiarEstadoPartido(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixture-admin'] })
  })
}

export function useCrearPremio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.crearPremio,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['premios-admin'] })
  })
}

export function useAsignarGanador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ premioId, ...data }) => adminService.asignarGanador(premioId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['premios-admin'] })
  })
}

export function useUpdateEquipo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => adminService.updateEquipo(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipos'] })
  })
}

export function useInscripcionesEquipo(ligaId, equipoId) {
  return useQuery({
    queryKey: ['inscripciones-equipo', ligaId, equipoId],
    queryFn: () => adminService.getInscripcionesByEquipo(ligaId, equipoId),
    enabled: !!ligaId && !!equipoId
  })
}

export function useAddJugador() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminService.addJugadorAPlantel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones-equipo'] })
      qc.invalidateQueries({ queryKey: ['equipos'] })
    }
  })
}
