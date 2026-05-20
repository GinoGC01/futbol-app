import React from 'react'
import { useLigaActiva } from '../../../context/LigaContext'
import { useTournamentArchitect } from '../hooks/useTournamentArchitect'
import Loader from '../../../components/ui/Loader'

import TemporadaHeader from './architect/TemporadaHeader'
import TemporadaSelector from './architect/TemporadaSelector'
import TemporadaActiveCard from './architect/TemporadaActiveCard'
import FaseList from './architect/FaseList'
import ArchitectModals from './architect/ArchitectModals'

export default function TournamentArchitect() {
  const { liga } = useLigaActiva()
  const { state, actions } = useTournamentArchitect(liga)

  if (state.loadingTemporadas) {
    return <Loader text="Cargando temporadas..." className="py-20" />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in relative pb-20 px-4 sm:px-0">
      {state.loadingTree && <Loader overlay text="Cargando estructura..." />}
      
      <TemporadaHeader 
        onNewSeason={() => actions.setShowNewTemp(true)} 
      />

      <TemporadaSelector 
        temporadas={state.temporadas}
        selectedTemp={state.selectedTemp}
        onSelectTemp={actions.setSelectedTemp}
        onNewSeason={() => actions.setShowNewTemp(true)}
      />

      {state.tree && (
        <div className="space-y-8 animate-fade-in">
          <TemporadaActiveCard
            tree={state.tree}
            isVault={state.isVault}
            isDeleting={state.isDeletingTemporada}
            onEdit={() => actions.setShowEditTemp(true)}
            onDelete={actions.handleDeleteTemporada}
          >
            <FaseList 
              fases={state.tree.fases}
              isVault={state.isVault}
              onNewFase={() => actions.setShowNewFase(true)}
              // Props para FaseCard
              equipos={state.equipos}
              ligaId={liga?.id}
              tree={state.tree}
              expandedJornada={state.expandedJornada}
              onToggleJornada={actions.setExpandedJornada}
              onEditFase={actions.setEditingFase}
              onShowFixture={actions.setShowGenerateFixture}
              onShowJornadas={(faseId) => { 
                actions.setSelectedFase(faseId); 
                actions.setShowNewJornadas(true) 
              }}
              onManageGroups={actions.setManagingGroupsFase}
            />
          </TemporadaActiveCard>
        </div>
      )}

      <ArchitectModals 
        state={state} 
        actions={actions} 
        liga={liga} 
      />
    </div>
  )
}
