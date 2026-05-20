import React from 'react'
import Button from '../../../../components/ui/Button'
import Badge from '../../../../components/ui/Badge'
import { Pencil, Trash2, AlertTriangle, X } from 'lucide-react'

export default function GroupCard({ grupo, state, actions }) {
  const { isVault, editingGrupoId, editNombre, equiposDisponibles, assigningGrupoId } = state
  const { 
    setEditNombre, setEditingGrupoId, handleSaveEdit, 
    handleStartEdit, requestDeleteGrupo, handleRemoveEquipo, handleAddEquipo 
  } = actions

  const cantEquipos = grupo.grupo_equipo?.length || 0
  const minWarning = cantEquipos < 4

  return (
    <div className={`bg-bg-deep/50 rounded-3xl border p-6 flex flex-col transition-all relative overflow-hidden ${
      minWarning ? 'border-warning/20 hover:border-warning/30' : 'border-white/5 hover:border-secondary/20'
    }`}>
      {/* Accent glow on top for warning */}
      {minWarning && (
        <div className="absolute top-0 inset-x-0 h-1 bg-warning/30" />
      )}

      {/* Group Card Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {editingGrupoId === grupo.id ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-white/10 text-xs text-text-primary focus:outline-none focus:border-secondary"
              />
              <Button 
                onClick={() => handleSaveEdit(grupo.id)}
                className="bg-success text-bg-deep font-black h-8 px-3 text-[10px] rounded-lg"
              >
                OK
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setEditingGrupoId(null)}
                className="bg-white/5 text-text-dim h-8 px-2 text-[10px] rounded-lg"
              >
                X
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h5 className="text-base font-heading font-black tracking-wide text-text-primary uppercase italic">
                {grupo.nombre}
              </h5>
              {!isVault && (
                <button 
                  onClick={() => handleStartEdit(grupo)}
                  className="p-1 text-text-dim hover:text-secondary opacity-50 hover:opacity-100 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[9px] bg-white/5 border-white/5">
              {cantEquipos} {cantEquipos === 1 ? 'equipo' : 'equipos'}
            </Badge>
            {minWarning && (
              <span className="inline-flex items-center gap-1 text-[9px] text-warning font-black uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3 stroke-[3]" /> Min 4
              </span>
            )}
          </div>
        </div>

        {!isVault && (
          <button 
            onClick={() => requestDeleteGrupo(grupo.id)}
            className="p-2 rounded-lg bg-danger/10 hover:bg-danger/25 border border-danger/20 text-danger hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Assigned Teams List */}
      <div className="flex-1 space-y-2 mt-2">
        {cantEquipos === 0 ? (
          <div className="py-8 text-center text-[10px] font-black uppercase tracking-wider text-text-dim/20 italic border border-dashed border-white/5 rounded-2xl bg-bg-surface/30">
            Sin equipos asignados
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
            {grupo.grupo_equipo.map(ge => {
              const eq = ge.equipo
              return (
                <div 
                  key={ge.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-bg-surface/60 border border-white/2 hover:border-white/5 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {eq.escudo_url ? (
                      <img src={eq.escudo_url} alt={eq.nombre} className="w-5.5 h-5.5 object-contain" />
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-md bg-white/5 flex items-center justify-center text-[9px] font-bold text-text-dim border border-white/5">
                        {eq.nombre.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-text-primary truncate">{eq.nombre}</span>
                  </div>

                  {!isVault && (
                    <button 
                      onClick={() => handleRemoveEquipo(grupo.id, ge.equipo_id)}
                      className="p-1 rounded-md text-text-dim hover:text-danger hover:bg-white/5 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick inline adder from available teams */}
      {!isVault && equiposDisponibles.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          {assigningGrupoId === grupo.id ? (
            <div className="py-2 flex justify-center">
              <span className="spinner !w-5 !h-5 border-2 border-secondary border-r-transparent" />
            </div>
          ) : (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddEquipo(grupo.id, e.target.value)
                  e.target.value = ''
                }
              }}
              className="w-full text-[10px] font-black uppercase tracking-wider bg-bg-surface border border-white/5 text-text-dim focus:text-text-primary px-3 py-2 rounded-xl focus:outline-none transition-all cursor-pointer"
            >
              <option value="" disabled selected>+ Añadir equipo al grupo...</option>
              {equiposDisponibles.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}
