import React from 'react'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import { Plus, Check } from 'lucide-react'

export default function UnassignedTeamsPanel({ state, actions }) {
  const { isVault, grupos, nuevoNombre, equiposDisponibles, isCreating, assigningEquipoId } = state
  const { setNuevoNombre, handleCreateGrupo, handleAddEquipo } = actions

  return (
    <div className="md:col-span-1 space-y-6">
      {/* Add Group Card */}
      {!isVault && (
        <div className="bg-bg-deep/50 rounded-3xl border border-white/5 p-6 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-text-dim">Crear Nuevo Grupo</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Ej: Grupo ${String.fromCharCode(65 + (grupos?.length || 0))}`}
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-bg-surface border border-white/5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-secondary transition-all"
            />
            <Button
              onClick={handleCreateGrupo}
              loading={isCreating}
              className="bg-primary text-bg-deep font-black uppercase italic text-xs h-[46px] px-4 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" /> Crear
            </Button>
          </div>
        </div>
      )}

      {/* Available Teams Panel */}
      <div className="bg-bg-deep/50 rounded-3xl border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-text-dim">Equipos sin Grupo</h4>
          <Badge variant="outline" className="bg-white/5">{equiposDisponibles.length}</Badge>
        </div>

        {equiposDisponibles.length === 0 ? (
          <div className="py-6 text-center text-[10px] font-black uppercase tracking-wider text-text-dim/40 italic flex flex-col items-center gap-2">
            <Check className="w-6 h-6 text-success" />
            Todos los equipos asignados
          </div>
        ) : (
          <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {equiposDisponibles.map(equipo => (
              <div
                key={equipo.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-bg-surface border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {equipo.escudo_url ? (
                    <img src={equipo.escudo_url} alt={equipo.nombre} className="w-6 h-6 object-contain" />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-text-dim border border-white/5">
                      {equipo.nombre.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-text-primary truncate">{equipo.nombre}</span>
                </div>

                {assigningEquipoId === equipo.id ? (
                  <div className="px-4 py-1 flex items-center justify-center">
                    <span className="spinner !w-4 !h-4 border-2 border-secondary border-r-transparent" />
                  </div>
                ) : grupos?.length > 0 && !isVault && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddEquipo(e.target.value, equipo.id)
                        e.target.value = '' // Reset
                      }
                    }}
                    className="text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-text-dim hover:text-text-primary px-2 py-1 rounded-lg border border-white/5 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled selected>Asignar...</option>
                    {grupos.map(g => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
