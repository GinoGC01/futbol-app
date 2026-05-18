import { useState } from 'react'
import { useUpdateJornada, useCerrarJornada, useFixtureAdmin, useCreatePartido } from '../../../hooks/useAdmin'
import { useToast } from '../../../components/ui/Toast'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { Calendar, ChevronDown, Lock as LockIcon, Swords } from 'lucide-react'

export function JornadaRow({ jornada, faseId, isExpanded, onToggle, isVault, equipos, ligaId, currentTemporada }) {
  const updateJornada = useUpdateJornada()
  const cerrarJornada = useCerrarJornada()
  const { data: fixtureData } = useFixtureAdmin(isExpanded ? jornada.id : null)
  const partidos = fixtureData?.partidos || []
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(jornada.fecha_tentativa?.split('T')[0] || '')
  const toast = useToast()

  function saveDate() {
    if (!dateValue) return
    updateJornada.mutate({ id: jornada.id, fecha_tentativa: dateValue }, {
      onSuccess: () => { setEditingDate(false); toast.success('Fecha actualizada') },
      onError: () => toast.error('Error al actualizar fecha')
    })
  }

  return (
    <div className={`rounded-3xl border transition-all overflow-hidden h-fit ${
      isExpanded 
        ? 'border-secondary/40 bg-secondary/5 ring-1 ring-secondary/20 shadow-2xl z-20' 
        : 'border-white/5 bg-bg-surface hover:border-white/20'
    }`}>
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 px-6 py-5 text-left group">
        <div className={`p-2.5 rounded-xl transition-all ${isExpanded ? 'bg-secondary text-bg-deep scale-110 shadow-lg' : 'bg-white/5 text-text-dim group-hover:text-text-primary'}`}>
          <Calendar className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black uppercase italic tracking-wide leading-none">Fecha {jornada.numero}</span>
            <Badge status={jornada.estado} className="text-[8px] h-4" />
          </div>
          {jornada.fecha_tentativa && (
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">
              {new Date(jornada.fecha_tentativa).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </p>
          )}
        </div>

        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-secondary' : 'text-text-dim'}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-8 space-y-6 animate-fade-in border-t border-white/5 pt-6">
          {/* Date editor & Actions */}
          {!isVault && (
            <div className="space-y-4">
              {editingDate ? (
                <div className="flex flex-col gap-2">
                  <input 
                    type="date" 
                    value={dateValue} 
                    onChange={e => setDateValue(e.target.value)}
                    className="w-full h-12 px-4 bg-bg-input border border-secondary/30 rounded-xl text-sm outline-none focus:ring-1 focus:ring-secondary font-bold text-text-primary"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveDate} loading={updateJornada.isPending} className="flex-1 bg-secondary text-bg-deep font-black uppercase italic h-11">Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDate(false)} className="px-5 bg-white/5 h-11">X</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <button onClick={() => setEditingDate(true)} className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] hover:underline flex items-center gap-2 italic">
                    <Calendar className="w-3.5 h-3.5" /> {jornada.fecha_tentativa ? 'Reprogramar' : 'Asignar Fecha'}
                  </button>

                  {jornada.estado !== 'cerrada' && (
                    <Button 
                      size="xs" 
                      variant="outline" 
                      className="text-danger hover:bg-danger/10 border-danger/20 h-10 px-4 font-black uppercase italic tracking-wide text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Cerrar esta fecha? Todos los partidos se marcarán como postergados.')) {
                          cerrarJornada.mutate(jornada.id, {
                             onSuccess: () => toast.success('Jornada cerrada'),
                             onError: (err) => toast.error(err.message)
                          });
                        }
                      }}
                      loading={cerrarJornada.isPending}
                    >
                      Cerrar Fecha
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {jornada.estado === 'cerrada' && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-12 h-full bg-danger/5 skew-x-[-20deg] translate-x-6" />
              <LockIcon className="w-6 h-6 text-danger shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-black text-danger uppercase tracking-widest italic leading-none mb-1">Blindada</p>
                <p className="text-[9px] text-text-dim uppercase font-bold truncate">Edición bloqueada.</p>
              </div>
            </div>
          )}

          {/* Match list */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-secondary skew-x-[-15deg]" />
              <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Encuentros ({partidos.length})</p>
            </div>
            
            {partidos.length > 0 ? (
              <div className="space-y-2">
                {partidos.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-bg-deep/50 border border-white/5 hover:border-primary/30 transition-all">
                    <div className="flex-1 flex items-center justify-between min-w-0 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                         <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: p.equipo_local?.color_principal || '#CEDE0B' }} />
                         <span className="text-[11px] font-black uppercase italic tracking-wide truncate">{p.equipo_local?.nombre}</span>
                      </div>
                      <div className="px-2 text-[9px] font-black text-primary italic shrink-0">VS</div>
                      <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                         <span className="text-[11px] font-black uppercase italic tracking-wide truncate">{p.equipo_visitante?.nombre}</span>
                         <div className="w-1.5 h-6 rounded-full shrink-0" style={{ backgroundColor: p.equipo_visitante?.color_principal || '#ffffff' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-white/2 rounded-2xl border border-dashed border-white/10">
                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest italic">Vacío</p>
              </div>
            )}
          </div>

          {/* Manual match creator */}
          {!isVault && <MatchCreator jornadaId={jornada.id} equipos={equipos || []} />}
        </div>
      )}
    </div>
  )
}

function MatchCreator({ jornadaId, equipos }) {
  const [localId, setLocalId] = useState('')
  const [visitanteId, setVisitanteId] = useState('')
  const [cancha, setCancha] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const createPartido = useCreatePartido()
  const toast = useToast()

  function handleCreate(e) {
    e.preventDefault()
    if (!localId || !visitanteId) return toast.error('Seleccioná equipos')
    createPartido.mutate({ jornada_id: jornadaId, equipo_local_id: localId, equipo_visitante_id: visitanteId, cancha, fecha_hora: fechaHora }, {
      onSuccess: () => { toast.success('Encuentro registrado'); setLocalId(''); setVisitanteId('') }
    })
  }

  return (
    <form onSubmit={handleCreate} className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-full bg-primary/5 skew-x-[-20deg] translate-x-12 pointer-events-none" />
      
      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 italic relative z-10">
        <Swords className="w-4 h-4" /> Registro Manual
      </p>

      <div className="grid grid-cols-1 gap-4 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-text-dim font-black uppercase ml-1">Local</label>
          <select value={localId} onChange={e => setLocalId(e.target.value)}
            className="w-full h-12 px-4 bg-bg-input border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-primary appearance-none transition-all text-text-primary bg-bg-surface">
            <option value="">Seleccionar...</option>
            {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-text-dim font-black uppercase ml-1">Visitante</label>
          <select value={visitanteId} onChange={e => setVisitanteId(e.target.value)}
            className="w-full h-12 px-4 bg-bg-input border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-primary appearance-none transition-all text-text-primary bg-bg-surface">
            <option value="">Seleccionar...</option>
            {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-text-dim font-black uppercase ml-1">Predio</label>
          <input type="text" value={cancha} onChange={e => setCancha(e.target.value)} placeholder="Ej: Cancha 1"
            className="w-full h-12 px-4 bg-bg-input border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-primary transition-all text-text-primary bg-bg-surface" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-text-dim font-black uppercase ml-1">Horario</label>
          <input type="datetime-local" value={fechaHora} onChange={e => setFechaHora(e.target.value)}
            className="w-full h-12 px-4 bg-bg-input border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-primary transition-all text-text-primary bg-bg-surface" />
        </div>
      </div>

      <Button type="submit" loading={createPartido.isPending} className="w-full h-14 bg-primary text-bg-deep font-black uppercase italic tracking-wide shadow-2xl shadow-primary/20">
        Confirmar Encuentro
      </Button>
    </form>
  )
}
