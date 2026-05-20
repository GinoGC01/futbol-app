import React from 'react'
import FixtureAutoSelector from '../FixtureAutoSelector'
import { NewTemporadaModal, EditTemporadaModal, NewFaseModal, EditFaseModal, NewJornadasModal } from '../CompetitionModals'
import GroupManager from '../GroupManager'
import ConfirmModal from '../../../../components/ui/ConfirmModal'

export default function ArchitectModals({ state, actions, liga }) {
  const { 
    showNewTemp, showEditTemp, showNewFase, showNewJornadas, 
    editingFase, showGenerateFixture, selectedFase, managingGroupsFase,
    showConfirmDelete, formatos, tree, equipos, isVault, selectedTemp
  } = state

  const {
    setShowNewTemp, setShowEditTemp, setShowNewFase, setShowNewJornadas,
    setEditingFase, setShowGenerateFixture, setManagingGroupsFase,
    setShowConfirmDelete, executeDeleteTemporada
  } = actions

  return (
    <>
      {showGenerateFixture && (
        <FixtureAutoSelector 
          open={!!showGenerateFixture} 
          onClose={() => setShowGenerateFixture(null)} 
          fase={showGenerateFixture}
          equipos={equipos}
          ligaId={liga?.id}
          currentTemporada={tree}
        />
      )}
      {showNewTemp && (
        <NewTemporadaModal 
          open={showNewTemp} 
          onClose={() => setShowNewTemp(false)} 
          ligaId={liga?.id} 
          formatos={formatos} 
          defaultTipoFutbol={liga?.tipo_futbol}
        />
      )}
      {showEditTemp && tree && (
        <EditTemporadaModal 
          open={showEditTemp} 
          onClose={() => setShowEditTemp(false)} 
          temporada={tree} 
        />
      )}
      {showNewFase && (
        <NewFaseModal 
          open={showNewFase} 
          onClose={() => setShowNewFase(false)} 
          temporadaId={selectedTemp} 
        />
      )}
      {editingFase && (
        <EditFaseModal 
          open={!!editingFase} 
          onClose={() => setEditingFase(null)} 
          fase={editingFase} 
        />
      )}
      {showNewJornadas && (
        <NewJornadasModal 
          open={showNewJornadas} 
          onClose={() => setShowNewJornadas(false)} 
          faseId={selectedFase} 
        />
      )}
      {managingGroupsFase && (
        <GroupManager 
          open={!!managingGroupsFase}
          onClose={() => setManagingGroupsFase(null)}
          fase={managingGroupsFase}
          equipos={equipos}
          isVault={isVault}
        />
      )}
      <ConfirmModal
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={executeDeleteTemporada}
        title="Eliminar Temporada"
        message="¿Estás seguro de que quieres eliminar esta temporada? Esta acción es irreversible y eliminará todos los partidos, jornadas y fases de la temporada en cascada."
        confirmText="Sí, Eliminar"
        isDestructive={true}
        isLoading={state.isDeletingTemporada}
      />
    </>
  )
}
