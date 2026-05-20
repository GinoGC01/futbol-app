import React from 'react'
import { useGroupManager } from '../hooks/useGroupManager'
import Loader from '../../../components/ui/Loader'
import ConfirmModal from '../../../components/ui/ConfirmModal'

import GroupManagerHeader from './group-manager/GroupManagerHeader'
import UnassignedTeamsPanel from './group-manager/UnassignedTeamsPanel'
import GroupGrid from './group-manager/GroupGrid'

export default function GroupManager({ open, onClose, fase, equipos, isVault }) {
  const { state, actions } = useGroupManager(fase, equipos, isVault)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto ">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />

      {/* Modal Container */}
      <div className="bg-bg-deep w-full max-w-7xl border border-white/10 shadow-xl relative z-10 overflow-hidden flex flex-col my-8 max-h-[85vh] rounded-lg">
        <GroupManagerHeader faseNombre={fase.nombre} onClose={onClose} />

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 min-h-0">
          {state.isLoading && <Loader text="Cargando grupos..." className="py-12" />}

          {!state.isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <UnassignedTeamsPanel state={state} actions={actions} />
              <GroupGrid state={state} actions={actions} />
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!state.grupoToDelete}
        onClose={() => actions.setGrupoToDelete(null)}
        onConfirm={actions.executeDeleteGrupo}
        title="Eliminar Grupo"
        message="¿Estás seguro de que deseas eliminar este grupo? Se desvincularán todos los equipos asignados y volverán a estar disponibles."
        confirmText="Sí, Eliminar"
        isDestructive={true}
        isLoading={state.isDeleting}
      />
    </div>
  )
}
