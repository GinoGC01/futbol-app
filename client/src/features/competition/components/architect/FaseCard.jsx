import React from 'react'
import Button from '../../../../components/ui/Button'
import { Layers, Clock, Pencil, Zap, Plus, Calendar } from 'lucide-react'
import { JornadaRow } from '../JornadaRow'

const DIAS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function FaseCard({ 
  fase, isVault, equipos, ligaId, tree, 
  onEditFase, onShowFixture, onShowJornadas, onManageGroups,
  onGenerateHorarios,
  expandedJornada, onToggleJornada 
}) {
  const hasHorarioConfig = fase.duracion_tiempo && fase.hora_inicio && fase.hora_fin

  return (
    <div className="flex flex-col gap-6 p-5 sm:p-8 rounded-[2.5rem] bg-bg-deep/50 border border-white/5 ring-1 ring-white/5 group hover:ring-secondary/30 transition-all relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-full bg-secondary/5 skew-x-[-20deg] translate-x-16 pointer-events-none" />
      
      <div className="flex flex-col gap-5 relative z-10">
        <div className='flex items-center gap-4'>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20 shadow-xl">
            <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-secondary" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-1 pt-1">
            <h4 className="text-xl sm:text-2xl font-heading font-black tracking-wide text-text-primary uppercase italic leading-[1.1] truncate">
              {fase.nombre}
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black bg-secondary/20 text-secondary px-2 py-1 rounded uppercase tracking-widest border border-secondary/20 leading-none">
                {fase.tipo?.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-text-dim font-black uppercase tracking-widest leading-none">
                V: {fase.puntos_victoria} • E: {fase.puntos_empate}
              </span>
              {hasHorarioConfig && (
                <>
                  <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded uppercase tracking-widest border border-primary/20 leading-none flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {fase.hora_inicio?.slice(0, 5)}-{fase.hora_fin?.slice(0, 5)} | {fase.canchas_disponibles} cancha(s)
                  </span>
                  {fase.dias_juego?.length > 0 && (
                    <span className="text-[10px] font-black bg-secondary/10 text-secondary px-2 py-1 rounded uppercase tracking-widest border border-secondary/20 leading-none flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fase.dias_juego.map(d => DIAS_LABELS[d] || '?').join('/')}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {fase.tipo === 'todos_contra_todos' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onManageGroups(fase)} 
              className="flex-1 sm:flex-none h-11 px-5 text-secondary bg-secondary/5 border border-secondary/20 font-black uppercase italic tracking-wide text-xs"
            >
              <Layers className="w-4 h-4 mr-2" /> Grupos
            </Button>
          )}
          {!isVault && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEditFase(fase)} className="flex-1 sm:flex-none h-11 px-4 text-text-dim hover:text-primary bg-white/5 border border-white/5">
                <Pencil className="w-4 h-4" />
              </Button>
              {hasHorarioConfig && fase.jornadas?.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onGenerateHorarios(fase)} className="flex-1 sm:flex-none h-11 px-4 text-secondary bg-secondary/5 border border-secondary/20 font-black uppercase italic tracking-wide text-xs">
                  <Clock className="w-4 h-4 mr-1" /> H.
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onShowFixture(fase)} className="flex-1 sm:flex-none h-11 px-5 text-primary bg-primary/5 border border-primary/20 font-black uppercase italic tracking-wide text-xs">
                <Zap className="w-4 h-4 mr-2" /> Fixture
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onShowJornadas(fase.id)} className="flex-1 sm:flex-none h-11 px-5 text-text-primary bg-white/5 border border-white/10 font-black uppercase italic tracking-wide text-xs">
                <Plus className="w-4 h-4 mr-2" /> Jornadas
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Jornadas (Rounds) */}
      <div className="relative z-10 pt-6 border-t border-white/5">
        {fase.jornadas?.length > 0 ? (
          <div className="flex flex-col items-center justify-center gap-4">
            {fase.jornadas.map(j => (
              <JornadaRow 
                key={j.id} 
                jornada={j} 
                faseId={fase.id}
                isExpanded={expandedJornada === j.id}
                onToggle={() => onToggleJornada(j.id)}
                isVault={isVault}
                equipos={equipos}
                ligaId={ligaId}
                currentTemporada={tree}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-white/2 rounded-2xl border border-dashed border-white/10">
              <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] italic">Sin jornadas asignadas</p>
          </div>
        )}
      </div>
    </div>
  )
}
