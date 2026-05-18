import { useState, useEffect } from 'react'
import { useTemporadas, useTemporadaTree, useFormatos, useEquipos, useInscripcionesTemporada, useDeleteTemporada } from '../../../hooks/useAdmin'
import { useToast } from '../../../components/ui/Toast'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { Trophy, Plus, ChevronRight, Layers, Calendar, Lock as LockIcon, Pencil, Zap, Trash2 } from 'lucide-react'

import { useLigaActiva } from '../../../context/LigaContext'
import Loader from '../../../components/ui/Loader'

import { JornadaRow } from './JornadaRow'
import FixtureAutoSelector from './FixtureAutoSelector'
import { NewTemporadaModal, EditTemporadaModal, NewFaseModal, EditFaseModal, NewJornadasModal } from './CompetitionModals'

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

  const deleteTemporada = useDeleteTemporada()
  const toast = useToast()

  const handleDeleteTemporada = () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta temporada? Esta acción es irreversible y eliminará todos los partidos, jornadas y fases de la temporada en cascada.')) {
      deleteTemporada.mutate(tree.id, {
        onSuccess: () => {
          toast.success('Temporada eliminada');
          setSelectedTemp(null);
        },
        onError: (err) => {
          toast.error(err.message || 'Error al eliminar temporada');
        }
      });
    }
  };

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
            <h1 className="text-4xl sm:text-6xl font-heading font-black tracking-wide leading-[1.1] uppercase italic">
              Arquitecto de <span className="text-primary">Torneo</span>
            </h1>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-full bg-secondary/30 skew-x-[-15deg] hidden lg:block" />
          </div>
          <p className="text-base text-text-dim max-w-md font-medium leading-tight italic uppercase tracking-normal">
            Diseña la estructura competitiva y gestiona el fixture oficial.
          </p>
        </div>
        
        <Button 
          onClick={() => setShowNewTemp(true)} 
          className="w-full sm:w-auto h-14 px-8 bg-secondary text-bg-deep font-black uppercase italic tracking-wide shadow-2xl shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
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
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black uppercase italic tracking-wide border transition-all snap-start shrink-0 min-w-[200px] sm:min-w-0 ${
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
            action={<Button onClick={() => setShowNewTemp(true)} className="font-black italic uppercase tracking-wide">Crear Ahora</Button>} 
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
                  <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-wide text-text-primary uppercase italic leading-[1.1]">
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
                  <>
                    <Button variant="outline" size="sm" onClick={() => setShowEditTemp(true)} className="flex-1 sm:flex-none h-12 px-6 font-black uppercase italic tracking-wide">
                      <Pencil className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeleteTemporada} loading={deleteTemporada.isPending} className="flex-1 sm:flex-none h-12 px-6 font-black uppercase italic tracking-wide text-danger border-danger hover:bg-danger hover:text-bg-deep">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                  </>
                )}
                {tree.estado === 'borrador' && (
                  <Button variant="primary" size="sm" onClick={() => setShowEditTemp(true)} className="flex-1 sm:flex-none h-12 px-8 bg-primary text-bg-deep font-black uppercase italic tracking-wide shadow-lg shadow-primary/20">
                    <Zap className="w-4 h-4 mr-2" /> Abrir Edición
                  </Button>
                )}
                {isVault && (
                  <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-danger/10 text-danger border border-danger/20 text-xs font-black uppercase italic tracking-wide">
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
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          {!isVault && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setEditingFase(fase)} className="flex-1 sm:flex-none h-11 px-4 text-text-dim hover:text-primary bg-white/5 border border-white/5">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setShowGenerateFixture(fase)} className="flex-1 sm:flex-none h-11 px-5 text-primary bg-primary/5 border border-primary/20 font-black uppercase italic tracking-wide text-xs">
                                <Zap className="w-4 h-4 mr-2" /> Fixture
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedFase(fase.id); setShowNewJornadas(true) }} className="flex-1 sm:flex-none h-11 px-5 text-text-primary bg-white/5 border border-white/10 font-black uppercase italic tracking-wide text-xs">
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
                  <p className="text-base text-text-dim font-bold mb-6 italic uppercase tracking-normal">El torneo aún no tiene fases competitivas.</p>
                  {!isVault && (
                    <Button onClick={() => setShowNewFase(true)} className="font-black italic uppercase tracking-wide h-12 px-8">
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
    </div>
  )
}
