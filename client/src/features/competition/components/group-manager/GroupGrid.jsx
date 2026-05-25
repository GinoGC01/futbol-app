import React from 'react'
import { Users } from 'lucide-react'
import GroupCard from './GroupCard'

export default function GroupGrid({ state, actions }) {
  const { grupos } = state

  return (
    <div className="lg:col-span-2 space-y-6">
      {!grupos || grupos.length === 0 ? (
        <div className="h-[100%] py-20 text-center bg-bg-deep/30 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4">
          <Users className="w-12 h-12 text-text-dim/20" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-text-dim">No hay grupos configurados</p>
            <p className="text-xs text-text-dim/60">Crea tu primer grupo para comenzar a asignar equipos.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grupos.map(grupo => (
            <GroupCard
              key={grupo.id}
              grupo={grupo}
              state={state}
              actions={actions}
            />
          ))}
        </div>
      )}
    </div>
  )
}
