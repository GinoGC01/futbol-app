import { useState } from 'react'
import { 
  useGruposByFase, 
  useCreateGrupo, 
  useUpdateGrupo, 
  useDeleteGrupo, 
  useAssignEquiposToGrupo, 
  useRemoveEquipoFromGrupo 
} from '../../../hooks/useAdmin'
import { useToast } from '../../../components/ui/Toast'

export function useGroupManager(fase, equipos, isVault) {
  const { data: grupos, isLoading } = useGruposByFase(fase?.id)
  const toast = useToast()

  const createGrupo = useCreateGrupo()
  const updateGrupo = useUpdateGrupo()
  const deleteGrupo = useDeleteGrupo()
  const assignEquipos = useAssignEquiposToGrupo()
  const removeEquipo = useRemoveEquipoFromGrupo()

  const [editingGrupoId, setEditingGrupoId] = useState(null)
  const [editNombre, setEditNombre] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [grupoToDelete, setGrupoToDelete] = useState(null)
  const [assigningEquipoId, setAssigningEquipoId] = useState(null)
  const [assigningGrupoId, setAssigningGrupoId] = useState(null)

  // Datos derivados
  const equiposAsignadosIds = grupos
    ? grupos.flatMap(g => g.grupo_equipo.map(ge => ge.equipo_id))
    : []

  const equiposDisponibles = (equipos || []).filter(e => !equiposAsignadosIds.includes(e.id))

  // Handlers
  const handleCreateGrupo = () => {
    if (isVault) return
    const siguienteLetra = String.fromCharCode(65 + (grupos?.length || 0))
    const nombre = nuevoNombre.trim() || `Grupo ${siguienteLetra}`

    createGrupo.mutate(
      { fase_id: fase.id, nombre },
      {
        onSuccess: () => {
          toast.success('Grupo creado exitosamente')
          setNuevoNombre('')
        },
        onError: (err) => toast.error(err.message || 'Error al crear grupo')
      }
    )
  }

  const handleStartEdit = (grupo) => {
    setEditingGrupoId(grupo.id)
    setEditNombre(grupo.nombre)
  }

  const handleSaveEdit = (grupoId) => {
    if (!editNombre.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }
    updateGrupo.mutate(
      { id: grupoId, nombre: editNombre.trim() },
      {
        onSuccess: () => {
          toast.success('Nombre de grupo actualizado')
          setEditingGrupoId(null)
        },
        onError: (err) => toast.error(err.message || 'Error al actualizar grupo')
      }
    )
  }

  const requestDeleteGrupo = (grupoId) => {
    if (isVault) return
    setGrupoToDelete(grupoId)
  }

  const executeDeleteGrupo = () => {
    if (!grupoToDelete) return
    deleteGrupo.mutate(grupoToDelete, {
      onSuccess: () => {
        toast.success('Grupo eliminado')
        setGrupoToDelete(null)
      },
      onError: (err) => {
        toast.error(err.message || 'Error al eliminar grupo')
        setGrupoToDelete(null)
      }
    })
  }

  const handleAddEquipo = (grupoId, equipoId) => {
    if (isVault) return
    setAssigningEquipoId(equipoId)
    setAssigningGrupoId(grupoId)

    const grupo = grupos.find(g => g.id === grupoId)
    const equiposActualesIds = grupo.grupo_equipo.map(ge => ge.equipo_id)
    const nuevosIds = [...equiposActualesIds, equipoId]

    assignEquipos.mutate(
      { id: grupoId, equipoIds: nuevosIds },
      {
        onSuccess: () => {
          toast.success('Equipo asignado al grupo')
          setAssigningEquipoId(null)
          setAssigningGrupoId(null)
        },
        onError: (err) => {
          toast.error(err.message || 'Error al asignar equipo')
          setAssigningEquipoId(null)
          setAssigningGrupoId(null)
        }
      }
    )
  }

  const handleRemoveEquipo = (grupoId, equipoId) => {
    if (isVault) return
    removeEquipo.mutate(
      { grupoId, equipoId },
      {
        onSuccess: () => toast.success('Equipo removido del grupo'),
        onError: (err) => toast.error(err.message || 'Error al remover equipo')
      }
    )
  }

  return {
    state: {
      grupos, isLoading,
      editingGrupoId, editNombre, nuevoNombre, grupoToDelete,
      equiposDisponibles, isVault, fase,
      assigningEquipoId, assigningGrupoId,
      isCreating: createGrupo.isPending,
      isDeleting: deleteGrupo.isPending
    },
    actions: {
      setNuevoNombre, setEditNombre, setEditingGrupoId, setGrupoToDelete,
      handleCreateGrupo, handleStartEdit, handleSaveEdit,
      requestDeleteGrupo, executeDeleteGrupo,
      handleAddEquipo, handleRemoveEquipo
    }
  }
}
