import { useState, useEffect } from 'react'
import { useTemporadas, useTemporadaTree, useFormatos, useInscripcionesTemporada, useDeleteTemporada, useGenerateHorariosFase } from '../../../hooks/useAdmin'
import { useToast } from '../../../components/ui/Toast'

export function useTournamentArchitect(liga) {
  const toast = useToast()
  
  // Data Fetching
  const { data: temporadas, isLoading: loadingTemporadas } = useTemporadas(liga?.id)
  const { data: formatos } = useFormatos()
  
  // Local State
  const [selectedTemp, setSelectedTemp] = useState(null)
  const [expandedJornada, setExpandedJornada] = useState(null)
  
  // Modals State
  const [showNewTemp, setShowNewTemp] = useState(false)
  const [showEditTemp, setShowEditTemp] = useState(false)
  const [showNewFase, setShowNewFase] = useState(false)
  const [showNewJornadas, setShowNewJornadas] = useState(false)
  const [editingFase, setEditingFase] = useState(null)
  const [showGenerateFixture, setShowGenerateFixture] = useState(null)
  const [selectedFase, setSelectedFase] = useState(null)
  const [managingGroupsFase, setManagingGroupsFase] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Derived Data Fetching
  const { data: inscripciones } = useInscripcionesTemporada(selectedTemp)
  const equipos = inscripciones?.map(i => i.equipo) || []
  const { data: tree, isLoading: loadingTree } = useTemporadaTree(selectedTemp)
  
  const isVault = tree?.estado === 'finalizada'
  const deleteTemporada = useDeleteTemporada()
  const generateHorariosFase = useGenerateHorariosFase()

  // Effects
  useEffect(() => {
    if (temporadas?.length > 0 && !selectedTemp) {
      const activa = temporadas.find(t => t.estado === 'activa')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemp(activa?.id || temporadas[0].id)
    }
  }, [temporadas, selectedTemp])

  // Handlers
  const requestDeleteTemporada = () => setShowConfirmDelete(true)

  const executeDeleteTemporada = () => {
    deleteTemporada.mutate(tree.id, {
      onSuccess: () => {
        toast.success('Temporada eliminada');
        setSelectedTemp(null);
        setShowConfirmDelete(false);
      },
      onError: (err) => {
        toast.error(err.message || 'Error al eliminar temporada');
        setShowConfirmDelete(false);
      }
    });
  };

  const handleGenerateHorarios = (fase) => {
    generateHorariosFase.mutate(fase.id, {
      onSuccess: (data) => {
        toast.success(data?.message || 'Horarios generados para todas las jornadas');
      },
      onError: (err) => {
        toast.error(err?.message || 'Error generando horarios');
      }
    });
  };

  return {
    state: {
      temporadas, loadingTemporadas, formatos, equipos, tree, loadingTree, isVault,
      selectedTemp, expandedJornada,
      showNewTemp, showEditTemp, showNewFase, showNewJornadas,
      editingFase, showGenerateFixture, selectedFase, managingGroupsFase,
      showConfirmDelete,
      isDeletingTemporada: deleteTemporada.isPending
    },
    actions: {
      setSelectedTemp, setExpandedJornada,
      setShowNewTemp, setShowEditTemp, setShowNewFase, setShowNewJornadas,
      setEditingFase, setShowGenerateFixture, setSelectedFase, setManagingGroupsFase,
      setShowConfirmDelete, requestDeleteTemporada, executeDeleteTemporada,
      handleGenerateHorarios
    }
  }
}
