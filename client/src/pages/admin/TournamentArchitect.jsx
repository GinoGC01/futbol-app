import { useState, useEffect } from 'react'
import { useLigas, useEquipos, useTemporadas, useTemporadaTree, useCreateTemporada, useCreateFase, useCreateJornadas, useFormatos, useUpdateTemporada, useUpdateFase, useUpdateJornada, useFixtureAdmin, useCreatePartido, useGenerateFixture, useInscripcionesEquipo, useCerrarJornada, useInscripcionesTemporada } from '../../hooks/useAdmin'
import { useToast } from '../../components/ui/Toast'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Trophy, Plus, ChevronRight, ChevronDown, Layers, Calendar, Lock as LockIcon, Pencil, Swords, Zap, Check, X, Shield } from 'lucide-react'

import { useLigaActiva } from '../../context/LigaContext'
import Loader from '../../components/ui/Loader'

export default function TournamentArchitect() {
  const { liga } = useLigaActiva()
  const { data: temporadas, isLoading } = useTemporadas(liga?.id)
  const { data: formatos } = useFormatos()
  const { data: allEquipos } = useEquipos(liga?.id)
  const [selectedTemp, setSelectedTemp] = useState(null)
  const { data: inscripciones } = useInscripcionesTemporada(selectedTemp)
  const equipos = inscripciones?.map(i => i.equipo) || []
  const { data: tree, isLoading: loadingTree } = useTemporadaTree(selectedTemp)

  const [showNewTemp, setShowNewTemp] = useState(false)
  const [showEditTemp, setShowEditTemp] = useState(false)
  const [showNewFase, setShowNewFase] = useState(false)
  const [showNewJornadas, setShowNewJornadas] = useState(false)
  const [editingFase, setEditingFase] = useState(null)
  const [expandedJornada, setExpandedJornada] = useState(null)
  const [showGenerateFixture, setShowGenerateFixture] = useState(null)
  const [selectedFase, setSelectedFase] = useState(null)

  const isVault = tree?.estado === 'finalizada'

  // Sincronizar selectedTemp con la primera temporada si no hay selección
  useEffect(() => {
    if (temporadas?.length > 0 && !selectedTemp) {
      const activa = temporadas.find(t => t.estado === 'activa')
      setSelectedTemp(activa?.id || temporadas[0].id)
    }
  }, [temporadas, selectedTemp])

  if (isLoading) return <Loader text="Cargando temporadas..." className="py-20" />

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in relative pb-20 px-4 sm:px-0">
      {loadingTree && <Loader overlay text="Cargando estructura..." />}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-black uppercase tracking-[0.2em]">
            <Trophy className="w-3.5 h-3.5" /> League Designer
          </div>
          <div className="relative pt-2">
            <h1 className="text-4xl sm:text-6xl font-heading font-black tracking-tighter leading-[1.1] uppercase italic">
              Arquitecto de <span className="text-primary">Torneo</span>
            </h1>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-full bg-secondary/30 skew-x-[-15deg] hidden lg:block" />
          </div>
          <p className="text-base text-text-dim max-w-md font-medium leading-tight italic uppercase tracking-tight">
            Diseña la estructura competitiva y gestiona el fixture oficial.
          </p>
        </div>
        
        <Button 
          onClick={() => setShowNewTemp(true)} 
          className="w-full sm:w-auto h-14 px-8 bg-secondary text-bg-deep font-black uppercase italic tracking-tighter shadow-2xl shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 mr-2 stroke-[4]" /> Nueva Temporada
        </Button>
      </div>

      {/* Temporada Selector (Mobile Scrollable) */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-1 h-6 bg-primary skew-x-[-15deg]" />
          <h2 className="text-[10px] font-black text-text-dim uppercase tracking-[0.4em]">Ediciones Disponibles</h2>
        </div>
        
        {temporadas?.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {temporadas.map(t => (
              <button 
                key={t.id} 
                onClick={() => setSelectedTemp(t.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black uppercase italic tracking-tighter border transition-all snap-start shrink-0 min-w-[200px] sm:min-w-0 ${
                  selectedTemp === t.id 
                    ? 'bg-primary/10 text-primary border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-primary/5' 
                    : 'bg-bg-surface text-text-dim border-white/5 hover:border-white/20'
                }`}
              >
                <Trophy className={`w-5 h-5 ${selectedTemp === t.id ? 'text-primary' : 'text-text-dim opacity-50'}`} />
                <div className="text-left">
                  <p className="leading-none mb-1">{t.nombre}</p>
                  <Badge status={t.estado} className="text-[8px]" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={Trophy} 
            title="Sin temporadas" 
            description="Comienza creando tu primera edición del torneo." 
            action={<Button onClick={() => setShowNewTemp(true)} className="font-black italic uppercase tracking-tighter">Crear Ahora</Button>} 
          />
        )}
      </div>

      {/* Main Structural Tree */}
      {tree && (
        <div className="space-y-8 animate-fade-in">
          {/* Active Season Details Card */}
          <div className="bg-bg-surface rounded-[2rem] border border-white/5 p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-tighter text-text-primary uppercase italic leading-[1.1]">
                    {tree.nombre}
                  </h2>
                  <Badge status={tree.estado} className="h-6" />
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-dim">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{tree.fecha_inicio ? new Date(tree.fecha_inicio).toLocaleDateString() : 'SIN INICIO'}</span>
                    <ChevronRight className="w-3 h-3 mx-1" />
                    <span>{tree.fecha_fin ? new Date(tree.fecha_fin).toLocaleDateString() : 'SIN FIN'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                {!isVault && (
                  <Button variant="outline" size="sm" onClick={() => setShowEditTemp(true)} className="flex-1 sm:flex-none h-12 px-6 font-black uppercase italic tracking-tighter">
                    <Pencil className="w-4 h-4 mr-2" /> Editar
                  </Button>
                )}
                {tree.estado === 'borrador' && (
                  <Button variant="primary" size="sm" onClick={() => setShowEditTemp(true)} className="flex-1 sm:flex-none h-12 px-8 bg-primary text-bg-deep font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20">
                    <Zap className="w-4 h-4 mr-2" /> Abrir Edición
                  </Button>
                )}
                {isVault && (
                  <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-danger/10 text-danger border border-danger/20 text-xs font-black uppercase italic tracking-tighter">
                    <LockIcon className="w-4 h-4" /> Bóveda de Datos
                  </div>
                )}
              </div>
            </div>

            {/* Phases Section */}
            <div className="mt-12 space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-secondary skew-x-[-15deg]" />
                <h3 className="text-xs font-black text-text-dim uppercase tracking-[0.4em]">Estructura de Fases</h3>
              </div>

              {tree.fases?.length > 0 ? (
                <div className="grid gap-6">
                  {tree.fases.map(fase => (
                    <div key={fase.id} className="flex flex-col gap-6 p-5 sm:p-8 rounded-[2.5rem] bg-bg-deep/50 border border-white/5 ring-1 ring-white/5 group hover:ring-secondary/30 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-full bg-secondary/5 skew-x-[-20deg] translate-x-16 pointer-events-none" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20 shadow-xl">
                          <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-secondary" />
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-1 pt-1">
                          <h4 className="text-xl sm:text-2xl font-heading font-black tracking-tighter text-text-primary uppercase italic leading-[1.1] truncate">
                            {fase.nombre}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black bg-secondary/20 text-secondary px-2 py-1 rounded uppercase tracking-widest border border-secondary/20 leading-none">
                              {fase.tipo?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-text-dim font-black uppercase tracking-widest leading-none">
                              V: {fase.puntos_victoria} • E: {fase.puntos_empate}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          {!isVault && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setEditingFase(fase)} className="flex-1 sm:flex-none h-11 px-4 text-text-dim hover:text-primary bg-white/5 border border-white/5">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setShowGenerateFixture(fase)} className="flex-1 sm:flex-none h-11 px-5 text-primary bg-primary/5 border border-primary/20 font-black uppercase italic tracking-tighter text-xs">
                                <Zap className="w-4 h-4 mr-2" /> Fixture
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedFase(fase.id); setShowNewJornadas(true) }} className="flex-1 sm:flex-none h-11 px-5 text-text-primary bg-white/5 border border-white/10 font-black uppercase italic tracking-tighter text-xs">
                                <Plus className="w-4 h-4 mr-2" /> Jornadas
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Jornadas (Rounds) - Stable List/Grid */}
                      <div className="relative z-10 pt-6 border-t border-white/5">
                        {fase.jornadas?.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {fase.jornadas.map(j => (
                              <JornadaRow 
                                key={j.id} 
                                jornada={j} 
                                faseId={fase.id}
                                isExpanded={expandedJornada === j.id}
                                onToggle={() => setExpandedJornada(expandedJornada === j.id ? null : j.id)}
                                isVault={isVault}
                                equipos={equipos}
                                ligaId={liga?.id}
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-bg-deep/50 rounded-[2rem] border-2 border-dashed border-white/5">
                  <Layers className="w-16 h-16 text-text-dim/20 mx-auto mb-6" />
                  <p className="text-base text-text-dim font-bold mb-6 italic uppercase tracking-tight">El torneo aún no tiene fases competitivas.</p>
                  {!isVault && (
                    <Button onClick={() => setShowNewFase(true)} className="font-black italic uppercase tracking-tighter h-12 px-8">
                      <Plus className="w-5 h-5 mr-2" /> Definir Primera Fase
                    </Button>
                  )}
                </div>
              )}

              {tree.fases?.length > 0 && !isVault && (
                <button 
                  onClick={() => setShowNewFase(true)}
                  className="w-full py-6 rounded-2xl border-2 border-dashed border-white/5 hover:border-secondary/20 hover:bg-secondary/5 transition-all text-text-dim hover:text-secondary group"
                >
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-20 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Agregar Fase Adicional</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <FixtureAutoSelector 
        open={!!showGenerateFixture} 
        onClose={() => setShowGenerateFixture(null)} 
        fase={showGenerateFixture}
        equipos={equipos}
        ligaId={liga?.id}
        currentTemporada={tree}
      />
      <NewTemporadaModal 
        open={showNewTemp} 
        onClose={() => setShowNewTemp(false)} 
        ligaId={liga?.id} 
        formatos={formatos} 
        defaultTipoFutbol={liga?.tipo_futbol}
      />
      {tree && <EditTemporadaModal open={showEditTemp} onClose={() => setShowEditTemp(false)} temporada={tree} />}
      <NewFaseModal open={showNewFase} onClose={() => setShowNewFase(false)} temporadaId={selectedTemp} />
      {editingFase && <EditFaseModal open={!!editingFase} onClose={() => setEditingFase(null)} fase={editingFase} />}
      <NewJornadasModal open={showNewJornadas} onClose={() => setShowNewJornadas(false)} faseId={selectedFase} />
    </div>
  )
}

// ====================================================
// JORNADA ROW — Expandable with match list + creator
// ====================================================
function JornadaRow({ jornada, faseId, isExpanded, onToggle, isVault, equipos, ligaId, currentTemporada }) {
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
            <span className="text-sm font-black uppercase italic tracking-tighter leading-none">Fecha {jornada.numero}</span>
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
                      className="text-danger hover:bg-danger/10 border-danger/20 h-10 px-4 font-black uppercase italic tracking-tighter text-[10px]"
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
                         <span className="text-[11px] font-black uppercase italic tracking-tighter truncate">{p.equipo_local?.nombre}</span>
                      </div>
                      <div className="px-2 text-[9px] font-black text-primary italic shrink-0">VS</div>
                      <div className="flex items-center gap-2 min-w-0 text-right justify-end">
                         <span className="text-[11px] font-black uppercase italic tracking-tighter truncate">{p.equipo_visitante?.nombre}</span>
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
      onSuccess: () => { toast.success('OK'); setLocalId(''); setVisitanteId('') }
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
            className="w-full h-12 px-4 bg-bg-input border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-primary appearance-none transition-all text-text-primary">
            <option value="">Seleccionar...</option>
            {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-text-dim font-black uppercase ml-1">Visitante</label>
          <select value={visitanteId} onChange={e => setVisitanteId(e.target.value)}
            className="w-full h-12 px-4 bg-bg-input border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-primary appearance-none transition-all text-text-primary">
            <option value="">Seleccionar...</option>
            {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[9px] text-text-dim font-black uppercase ml-1">Predio</label>
          <input type="text" value={cancha} onChange={e => setCancha(e.target.value)} placeholder="Ej: Cancha 1"
            className="w-full h-12 px-4 bg-bg-input border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-primary transition-all text-text-primary" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] text-text-dim font-black uppercase ml-1">Horario</label>
          <input type="datetime-local" value={fechaHora} onChange={e => setFechaHora(e.target.value)}
            className="w-full h-12 px-4 bg-bg-input border border-white/10 rounded-xl text-sm font-bold outline-none focus:border-primary transition-all text-text-primary" />
        </div>
      </div>

      <Button type="submit" loading={createPartido.isPending} className="w-full h-14 bg-primary text-bg-deep font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20">
        Confirmar Encuentro
      </Button>
    </form>
  )
}

// ====================================================
// GENERATE FIXTURE MODAL — Team checklist + confirmation
// ====================================================
function TeamInscriptionsBadge({ teamId, temporadaId, required, ligaId }) {
  const { data: seasons } = useInscripcionesEquipo(ligaId, teamId)
  const plantel = seasons?.find(s => s.temporada_id === temporadaId)
  const activos = plantel?.plantel?.inscripciones?.filter(i => i.estado === 'activo')?.length || 0

  return (
    <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight uppercase ${
      activos >= required ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning animate-pulse'
    }`}>
      {activos}/{required} JUG.
    </div>
  )
}

function FixtureAutoSelector({ open, onClose, fase, equipos, ligaId, currentTemporada }) {
  const [selectedTeams, setSelectedTeams] = useState([])
  const [confirming, setConfirming] = useState(false)
  const [resultData, setResultData] = useState(null)
  const generateFixture = useGenerateFixture()
  const toast = useToast()

  const faseId = fase?.id
  const idaYVuelta = fase?.ida_y_vuelta || false

  useEffect(() => {
    if (open) {
      setSelectedTeams(equipos?.map(e => e.id) || [])
      setConfirming(false)
      setResultData(null)
    }
  }, [open, equipos])

  function toggleTeam(id) {
    setSelectedTeams(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function handleGenerate() {
    if (selectedTeams.length < 2) return toast.error('Seleccioná al menos 2 equipos')
    setConfirming(true)
  }

  function confirmGenerate() {
    generateFixture.mutate({ faseId, equipoIds: selectedTeams }, {
      onSuccess: (data) => {
        toast.success(data.message || 'Fixture generado exitosamente')
        if (data.warnings?.length > 0) {
          setResultData(data)
        } else {
          onClose()
        }
      },
      onError: (err) => {
        toast.error(err.message || 'Error al generar fixture')
        setConfirming(false)
      }
    })
  }

  const n = selectedTeams.length
  const roundsPerLeg = n % 2 === 0 ? n - 1 : n
  const totalRounds = idaYVuelta ? roundsPerLeg * 2 : roundsPerLeg
  const matchesPerRound = Math.floor(n / 2)
  const totalMatches = totalRounds * matchesPerRound
  const existingJornadas = fase?.jornadas?.length || 0
  const jornadasAutoCreate = Math.max(0, totalRounds - existingJornadas)

  const modalidadReq = currentTemporada?.modalidad || (currentTemporada?.liga?.tipo_futbol 
    ? parseInt(currentTemporada.liga.tipo_futbol.replace(/\D/g, '')) 
    : 11);

  // Post-generation result view
  if (resultData) {
    return (
      <Modal open={open} onClose={onClose} title="Fixture Generado" size="md">
        <div className="space-y-5 animate-fade-in text-center">
          <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-success" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-success mb-1">¡Fixture Generado!</h3>
            <p className="text-sm text-text-dim">{resultData.message}</p>
            {resultData.jornadas_autocreadas > 0 && (
              <p className="mt-2 text-xs text-secondary bg-secondary/5 p-2 rounded-lg border border-secondary/10">
                Se crearon automáticamente <span className="font-bold">{resultData.jornadas_autocreadas}</span> jornadas adicionales.
              </p>
            )}
          </div>
          {resultData.warnings?.length > 0 && (
            <div className="text-left space-y-1.5 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <p className="text-[10px] font-black text-warning uppercase tracking-widest">Advertencias del Motor</p>
              {resultData.warnings.map((w, i) => (
                <p key={i} className="text-xs text-text-dim pl-3 border-l-2 border-warning/30">{w}</p>
              ))}
            </div>
          )}
          <Button onClick={onClose} className="w-full bg-success hover:bg-success/90 text-bg-deep font-bold">
            Cerrar
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title="Generar Fixture Automático" size="md">
      {!confirming ? (
        <div className="space-y-5 animate-fade-in">
          {/* Algorithm Info Panel */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-xs font-black text-primary uppercase tracking-widest">Motor de Fixture</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-bg-deep/50 border border-white/5">
                <p className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-0.5">Equipos</p>
                <p className="text-lg font-black text-text-primary leading-none">{n}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-bg-deep/50 border border-white/5">
                <p className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-0.5">Jornadas</p>
                <p className="text-lg font-black text-text-primary leading-none">{totalRounds}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-bg-deep/50 border border-white/5">
                <p className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-0.5">Part/Jornada</p>
                <p className="text-lg font-black text-text-primary leading-none">{matchesPerRound}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-bg-deep/50 border border-white/5">
                <p className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-0.5">Total</p>
                <p className="text-lg font-black text-text-primary leading-none">{totalMatches}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {idaYVuelta && (
                <span className="text-[9px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 uppercase tracking-widest">
                  Ida y Vuelta
                </span>
              )}
              {n % 2 !== 0 && (
                <span className="text-[9px] font-black text-warning bg-warning/10 px-2 py-1 rounded-md border border-warning/20 uppercase tracking-widest">
                  {n} impares — rotación descanso
                </span>
              )}
              {jornadasAutoCreate > 0 && (
                <span className="text-[9px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 uppercase tracking-widest">
                  +{jornadasAutoCreate} jornadas automáticas
                </span>
              )}
            </div>
          </div>

          {/* Team Selector */}
          <div>
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">Equipos que participan ({selectedTeams?.length || 0}/{equipos?.length || 0})</p>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 flex flex-col items-center justify-center">
              {!equipos ? (
                 <div className="py-10 text-[10px] text-text-dim italic">Cargando equipos...</div>
              ) : equipos.length === 0 ? (
                 <div className="py-10 text-[10px] text-text-dim italic text-center">No hay equipos inscritos en esta temporada.<br/>Inscribe equipos en la sección de Roster antes de generar el fixture.</div>
              ) : (
                equipos.map(eq => {
                  const isSelected = selectedTeams.includes(eq.id)
                  return (
                    <button key={eq.id} onClick={() => toggleTeam(eq.id)} type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-primary/5 border-primary/30 text-text-primary' 
                          : 'bg-bg-surface border-border-subtle text-text-dim opacity-60'
                      }`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'bg-primary border-primary' : 'border-border-default'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-bg-deep" />}
                      </div>
                      <Shield className="w-4 h-4 shrink-0" style={{ color: eq.color_principal || 'var(--color-primary)' }} />
                      <span className="text-sm font-medium">{eq.nombre}</span>
                      <TeamInscriptionsBadge teamId={eq.id} temporadaId={currentTemporada?.id} required={modalidadReq} ligaId={ligaId} />
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full gap-2 h-14 bg-primary text-bg-deep font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20" disabled={selectedTeams.length < 2}>
            <Zap className="w-5 h-5" /> Generar Fixture ({selectedTeams.length} equipos)
          </Button>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-warning mb-1">Confirmar Generación</h3>
            <p className="text-sm text-text-dim">
              Se generará un fixture de <span className="font-bold text-text-primary">{totalMatches} partidos</span> en <span className="font-bold text-text-primary">{totalRounds} jornadas</span> para <span className="font-bold text-text-primary">{n} equipos</span>.
              {idaYVuelta && <><br/><span className="text-secondary font-bold">Formato ida y vuelta</span> — la segunda rueda invierte la localía.</>}
            </p>
            {jornadasAutoCreate > 0 && (
              <p className="mt-2 text-xs text-secondary bg-secondary/5 p-2 rounded-lg border border-secondary/10">
                Se crearán automáticamente <span className="font-bold">{jornadasAutoCreate}</span> jornadas adicionales.
              </p>
            )}
            <p className="mt-2 text-xs text-warning/80 bg-warning/5 p-2 rounded-lg border border-warning/10 italic">
              ⚠ Si ya existían partidos en las jornadas de esta fase, serán eliminados y reemplazados.
            </p>
            <p className="mt-2 text-xs text-text-dim">
              Mínimo recomendado: <span className="font-bold text-primary">{modalidadReq} jugadores</span> por equipo (Fútbol {modalidadReq}).
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setConfirming(false)} className="flex-1 h-12 font-bold">Cancelar</Button>
            <Button onClick={confirmGenerate} loading={generateFixture.isPending} className="flex-1 h-12 bg-warning hover:bg-warning/90 text-bg-deep font-black uppercase italic tracking-tighter">
              Sí, Generar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ====================================================
// EXISTING MODALS (preserved, minor updates)
// ====================================================
function NewTemporadaModal({ open, onClose, ligaId, formatos, defaultTipoFutbol }) {
  const [form, setForm] = useState({ nombre: '', formato_tipo: '', fecha_inicio: '', fecha_fin: '' })
  
  const mutation = useCreateTemporada()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    let payload = { ...form, liga_id: ligaId }
    if (!payload.formato_tipo && formatos?.length > 0) {
      payload.formato_tipo = formatos[0].tipo
    }
    await mutation.mutateAsync(payload)
    onClose()
    setForm({ nombre: '', formato_tipo: '', fecha_inicio: '', fecha_fin: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Temporada">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Nombre de Temporada
          <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Apertura 2025" required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Formato de Competencia
            <select value={form.formato_tipo} onChange={set('formato_tipo')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
              <option value="" disabled>Seleccionar...</option>
              {formatos?.map(f => (
                <option key={f.id} value={f.tipo}>{f.nombre}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-dim">Modalidad (Fija)</span>
            <div className="mt-1.5 px-3 py-2.5 bg-bg-surface/50 border border-border-subtle rounded-xl text-sm text-text-dim flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Fútbol {defaultTipoFutbol?.replace(/\D/g, '') || '—'}
            </div>
            <p className="text-[10px] text-text-dim mt-1 px-1">Definida por la Liga</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Fecha Inicio
            <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Fecha Fin (Est.)
            <input type="date" value={form.fecha_fin} onChange={set('fecha_fin')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
        </div>
        <Button type="submit" loading={mutation.isPending} className="w-full mt-2">Crear Temporada</Button>
      </form>
    </Modal>
  )
}

function EditTemporadaModal({ open, onClose, temporada }) {
  const [form, setForm] = useState({ 
    nombre: '', fecha_inicio: '', fecha_fin: '', estado: 'borrador'
  })
  
  useEffect(() => {
    if (open && temporada) {
      setForm({
        nombre: temporada.nombre,
        fecha_inicio: temporada.fecha_inicio?.split('T')[0] || '',
        fecha_fin: temporada.fecha_fin?.split('T')[0] || '',
        estado: temporada.estado || 'borrador'
      })
    }
  }, [open, temporada])

  const mutation = useUpdateTemporada()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ id: temporada.id, ...form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Temporada">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Nombre de Temporada
          <input type="text" value={form.nombre} onChange={set('nombre')} required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Fecha Inicio
            <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Estado de Temporada
            <select value={form.estado} onChange={set('estado')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none font-bold">
              <option value="borrador">Borrador</option>
              <option value="activa">Activa / En Curso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </label>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-dim">Modalidad (Fija)</span>
            <div className="mt-1.5 px-3 py-2.5 bg-bg-surface/50 border border-border-subtle rounded-xl text-sm text-text-dim flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Fútbol {temporada.liga?.tipo_futbol?.replace(/\D/g, '') || '—'}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-text-dim italic">* La fecha de finalización puede modificarse en cualquier momento antes de finalizar la temporada.</p>
        <Button type="submit" loading={mutation.isPending} className="w-full mt-2">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}

function NewFaseModal({ open, onClose, temporadaId }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'todos_contra_todos', puntos_victoria: 3, puntos_empate: 1, ida_y_vuelta: false })
  const mutation = useCreateFase()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ temporada_id: temporadaId, ...form })
    onClose()
    setForm({ nombre: '', tipo: 'todos_contra_todos', puntos_victoria: 3, puntos_empate: 1, ida_y_vuelta: false })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Fase">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Fase Regular" required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <select value={form.tipo} onChange={set('tipo')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
          <option value="todos_contra_todos">Todos contra todos</option>
          <option value="eliminacion_directa">Eliminación directa</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Pts. Victoria
            <input type="number" value={form.puntos_victoria} onChange={set('puntos_victoria')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Pts. Empate
            <input type="number" value={form.puntos_empate} onChange={set('puntos_empate')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-text-dim cursor-pointer">
          <input type="checkbox" checked={form.ida_y_vuelta} onChange={e => setForm(f => ({ ...f, ida_y_vuelta: e.target.checked }))}
            className="rounded border-border-default accent-primary" />
          Ida y vuelta (doble rueda)
        </label>
        <Button type="submit" loading={mutation.isPending} className="w-full">Crear Fase</Button>
      </form>
    </Modal>
  )
}

function EditFaseModal({ open, onClose, fase }) {
  const [form, setForm] = useState({
    nombre: fase.nombre,
    tipo: fase.tipo,
    puntos_victoria: fase.puntos_victoria,
    puntos_empate: fase.puntos_empate,
    ida_y_vuelta: fase.ida_y_vuelta
  })
  const mutation = useUpdateFase()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ id: fase.id, ...form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Fase">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <select value={form.tipo} onChange={set('tipo')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
          <option value="todos_contra_todos">Todos contra todos</option>
          <option value="eliminacion_directa">Eliminación directa</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Pts. Victoria
            <input type="number" value={form.puntos_victoria} onChange={set('puntos_victoria')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Pts. Empate
            <input type="number" value={form.puntos_empate} onChange={set('puntos_empate')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-text-dim cursor-pointer">
          <input type="checkbox" checked={form.ida_y_vuelta} onChange={e => setForm(f => ({ ...f, ida_y_vuelta: e.target.checked }))}
            className="rounded border-border-default accent-primary" />
          Ida y vuelta (doble rueda)
        </label>
        <Button type="submit" loading={mutation.isPending} className="w-full">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}

function NewJornadasModal({ open, onClose, faseId }) {
  const [cantidad, setCantidad] = useState(5)
  const mutation = useCreateJornadas()

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ fase_id: faseId, cantidad: Number(cantidad) })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Generar Jornadas">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min={1} max={50} required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <p className="text-xs text-text-dim">Se crearán {cantidad} jornadas automáticamente.</p>
        <Button type="submit" loading={mutation.isPending} className="w-full">Generar</Button>
      </form>
    </Modal>
  )
}
