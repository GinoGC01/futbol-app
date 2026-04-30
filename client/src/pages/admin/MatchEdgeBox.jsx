import { useState, useEffect } from 'react'
import { 
  useTemporadas, useLigas, useTemporadaTree, useFixtureAdmin, 
  useEventos, useCambiarEstadoPartido, useRegistrarGol, 
  useRegistrarTarjeta, useInscripcionesEquipo 
} from '../../hooks/useAdmin'
import { useToast } from '../../components/ui/Toast'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Swords, Play, Square, Target, AlertTriangle, Clock, X, User, Lock as LockIcon } from 'lucide-react'

import { useLigaActiva } from '../../context/LigaContext'
import Loader from '../../components/ui/Loader'

export default function MatchEdgeBox() {
  const toast = useToast()
  const { liga } = useLigaActiva()
  const { data: temporadas } = useTemporadas(liga?.id)
  const temporadaActiva = temporadas?.find(t => t.estado === 'activa')
  const { data: tree } = useTemporadaTree(temporadaActiva?.id)

  const allJornadas = tree?.fases?.flatMap(f => f.jornadas?.map(j => ({ ...j, faseName: f.nombre })) || []) || []
  const [selectedJornada, setSelectedJornada] = useState(null)
  const [selectedPartido, setSelectedPartido] = useState(null)
  const [entryMode, setEntryMode] = useState(null) // { type: 'GOL' | 'AMARILLA' | 'ROJA' }

  const jornadaActual = allJornadas.find(j => j.id === (selectedJornada || allJornadas[0]?.id))

  // Stopwatch State
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const jornadaId = selectedJornada || allJornadas[0]?.id
  const { data: fixtureData, isLoading: loadingFixture } = useFixtureAdmin(jornadaId)
  const partidos = fixtureData?.partidos || []
  const { data: eventos } = useEventos(selectedPartido)

  const cambiarEstado = useCambiarEstadoPartido()
  const registrarGol = useRegistrarGol()
  const registrarTarjeta = useRegistrarTarjeta()

  const partido = partidos.find(p => p.id === selectedPartido)
  
  // Players for both teams
  const { data: playersLocal, isLoading: loadingLocal } = useInscripcionesEquipo(liga?.id, partido?.equipo_local?.id)
  const { data: playersVisit, isLoading: loadingVisit } = useInscripcionesEquipo(liga?.id, partido?.equipo_visitante?.id)

  // Timer Logic
  useEffect(() => {
    if (!selectedPartido) {
      setTimer(0)
      setIsRunning(false)
      return
    }

    const saved = localStorage.getItem(`match_timer_${selectedPartido}`)
    const p = partidos.find(match => match.id === selectedPartido)

    if (p?.estado === 'en_juego') {
      if (saved) {
        const { startTime } = JSON.parse(saved)
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setTimer(elapsed > 0 ? elapsed : 0)
        setIsRunning(true)
      } else {
        // Si está en juego pero no hay timer guardado, empezamos en 0
        setTimer(0)
        setIsRunning(true)
      }
    } else if (p?.estado === 'finalizado') {
      setIsRunning(false)
      if (saved) {
        const { duration } = JSON.parse(saved)
        setTimer(duration || 0)
      }
    } else {
      setTimer(0)
      setIsRunning(false)
    }
  }, [selectedPartido, partidos])

  useEffect(() => {
    let interval
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartMatch = () => {
    const startTime = Date.now()
    localStorage.setItem(`match_timer_${partido.id}`, JSON.stringify({ startTime }))
    cambiarEstado.mutate({ id: partido.id, estado: 'en_juego' }, {
      onSuccess: () => {
        setIsRunning(true)
        toast.success('¡Partido Iniciado! Cronómetro en marcha.')
      }
    })
  }

  const handleEndMatch = () => {
    cambiarEstado.mutate({ id: partido.id, estado: 'finalizado' }, {
      onSuccess: () => {
        setIsRunning(false)
        const saved = JSON.parse(localStorage.getItem(`match_timer_${partido.id}`) || '{}')
        localStorage.setItem(`match_timer_${partido.id}`, JSON.stringify({ ...saved, duration: timer }))
        toast.success('Partido Finalizado.')
      }
    })
  }

  const handleIncident = (type) => {
    if (!partido) return
    if (jornadaActual?.estado === 'cerrada') {
      toast.error('La jornada está cerrada. No se pueden registrar eventos.')
      return
    }
    if (partido.estado === 'programado') {
      toast.error('Partido no iniciado. Inicia el partido para cargar eventos.')
      return
    }
    setEntryMode({ type })
  }

  const submitEvent = (player) => {
    const currentMinute = Math.floor(timer / 60) + 1 // El minuto actual (ej: 0:45 -> min 1)
    
    const common = { 
      partidoId: partido.id, 
      inscripcion_jugador_id: player.id,
      minuto: currentMinute
    }

    if (entryMode.type === 'GOL') {
      registrarGol.mutate(common, {
        onSuccess: () => {
          toast.success(`¡GOL! ${player.jugador?.nombre} (Min ${currentMinute})`)
          setEntryMode(null)
        }
      })
    } else {
      registrarTarjeta.mutate({ 
        ...common, 
        tipo: entryMode.type === 'AMARILLA' ? 'amarilla' : 'roja' 
      }, {
        onSuccess: () => {
          const t = entryMode.type === 'AMARILLA' ? 'AMARILLA' : 'ROJA'
          toast.info(`${t} para ${player.jugador?.nombre} (Min ${currentMinute})`)
          setEntryMode(null)
        }
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative">
      {(registrarGol.isPending || registrarTarjeta.isPending) && (
        <Loader overlay text="Registrando evento..." />
      )}
      <h1 className="text-2xl font-heading font-bold">Match Edge Box</h1>
      <p className="text-sm text-text-dim -mt-4">Carga de eventos en tiempo real. Optimizado para el borde de la cancha.</p>

      {/* Jornada selector */}
      {allJornadas.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allJornadas.map(j => (
            <button key={j.id} onClick={() => { setSelectedJornada(j.id); setSelectedPartido(null) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                jornadaId === j.id ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-dim border-border-subtle'
              }`}>
              {j.estado === 'cerrada' && <LockIcon className="w-3 h-3" />}
              Fecha {j.numero}
            </button>
          ))}
        </div>
      )}

      {/* Match list */}
      {!selectedPartido ? (
        partidos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {partidos.map(p => (
              <button key={p.id} onClick={() => setSelectedPartido(p.id)} className="w-full text-left">
                <GlassCard>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge status={p.estado} />
                        {p.cancha && <span className="text-[11px] text-text-dim">{p.cancha}</span>}
                      </div>
                      <p className="font-medium">
                        {p.equipo_local?.nombre} <span className="text-primary font-bold">{p.goles_local ?? 0}</span>
                        <span className="text-text-dim mx-2">vs</span>
                        <span className="text-primary font-bold">{p.goles_visitante ?? 0}</span> {p.equipo_visitante?.nombre}
                      </p>
                    </div>
                    <Swords className="w-5 h-5 text-text-dim" />
                  </div>
                </GlassCard>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Swords} title="Sin partidos" description="Seleccioná una jornada con partidos programados." />
        )
      ) : (
        /* Match detail + incident feed */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSelectedPartido(null)} className="text-sm text-text-dim hover:text-primary transition-colors flex items-center gap-1">
              ← Volver
            </button>
            {partido.estado === 'programado' ? (
              <Button size="xs" onClick={handleStartMatch}
                loading={cambiarEstado.isPending} variant="primary">Iniciar</Button>
            ) : partido.estado === 'en_juego' ? (
              <Button size="xs" onClick={handleEndMatch}
                loading={cambiarEstado.isPending} variant="danger">Finalizar</Button>
            ) : null}
          </div>

          {partido && (
            <>
              <GlassCard hover={false} className="!p-4 ring-1 ring-primary/20">
                <div className="text-center">
                  <Badge status={partido.estado} className="mb-2" />
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-right flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm truncate uppercase tracking-tighter">{partido.equipo_local?.nombre}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl font-heading font-bold text-primary px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                        {partido.goles_local ?? 0} - {partido.goles_visitante ?? 0}
                      </div>
                      {partido.estado === 'en_juego' && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-primary animate-pulse">
                          <Clock className="w-3 h-3" />
                          {formatTime(timer)}'
                        </div>
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm truncate uppercase tracking-tighter">{partido.equipo_visitante?.nombre}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Main Incident Buttons */}
              {!entryMode && (partido.estado === 'en_juego' || partido.estado === 'finalizado') && (
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => handleIncident('GOL')}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl bg-primary/10 border-2 border-primary/40 text-primary font-black text-sm active:scale-95 transition-all hover:bg-primary/20">
                    <Target className="w-8 h-8" /> GOL
                  </button>
                  <button onClick={() => handleIncident('AMARILLA')}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl bg-warning/10 border-2 border-warning/40 text-warning font-black text-sm active:scale-95 transition-all hover:bg-warning/20">
                    <AlertTriangle className="w-8 h-8" /> AMARILLA
                  </button>
                  <button onClick={() => handleIncident('ROJA')}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl bg-danger/10 border-2 border-danger/40 text-danger font-black text-sm active:scale-95 transition-all hover:bg-danger/20">
                    <AlertTriangle className="w-8 h-8" /> ROJA
                  </button>
                </div>
              )}

              {/* Player Selector Entry Flow */}
              {entryMode && (
                <GlassCard hover={false} className="animate-in slide-in-from-bottom-5 fade-in duration-300 border-2 border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold uppercase text-xs tracking-widest text-primary flex items-center gap-2">
                       {entryMode.type === 'GOL' ? <Target className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                       ¿Quién hizo el {entryMode.type}?
                    </h3>
                    <button onClick={() => setEntryMode(null)} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                      <X className="w-4 h-4 text-text-dim" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Local Team */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-tighter truncate">{partido.equipo_local?.nombre}</p>
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-none">
                        {loadingLocal ? (
                          <div className="p-4 flex flex-col items-center justify-center">
                            <Loader size="sm" />
                            <p className="text-[10px] text-text-dim mt-2">Cargando...</p>
                          </div>
                        ) : playersLocal?.find(p => p.temporada_id === temporadaActiva?.id)?.plantel?.inscripciones?.length > 0 ? (
                          playersLocal?.find(p => p.temporada_id === temporadaActiva?.id)?.plantel?.inscripciones?.map(p => (
                            <button key={p.id} onClick={() => submitEvent(p)}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 text-left text-xs transition-colors group">
                              <span className="w-4 font-bold text-primary group-hover:scale-110 transition-transform">{p.dorsal || '—'}</span>
                              <span className="truncate">{p.jugador?.nombre} {p.jugador?.apellido}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center rounded-lg border border-dashed border-border-subtle">
                             <p className="text-[10px] text-text-dim">Sin jugadores inscritos</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Visitor Team */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-tighter truncate text-right">{partido.equipo_visitante?.nombre}</p>
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-none">
                        {loadingVisit ? (
                          <div className="p-4 flex flex-col items-center justify-center">
                            <Loader size="sm" />
                            <p className="text-[10px] text-text-dim mt-2">Cargando...</p>
                          </div>
                        ) : playersVisit?.find(p => p.temporada_id === temporadaActiva?.id)?.plantel?.inscripciones?.length > 0 ? (
                          playersVisit?.find(p => p.temporada_id === temporadaActiva?.id)?.plantel?.inscripciones?.map(p => (
                            <button key={p.id} onClick={() => submitEvent(p)}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 text-left text-xs transition-colors group">
                              <span className="w-4 font-bold text-primary group-hover:scale-110 transition-transform">{p.dorsal || '—'}</span>
                              <span className="truncate">{p.jugador?.nombre} {p.jugador?.apellido}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center rounded-lg border border-dashed border-border-subtle">
                             <p className="text-[10px] text-text-dim">Sin jugadores inscritos</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Event Feed */}
              {!entryMode && eventos && (
                <div className="space-y-3">
                  <h3 className="font-heading font-semibold text-sm flex items-center gap-2 px-2">
                    <Clock className="w-4 h-4 text-text-dim" /> Historial de incidencias
                  </h3>
                  {(eventos.goles?.length > 0 || eventos.tarjetas?.length > 0) ? (
                    <div className="flex flex-col gap-2">
                      {[...eventos.goles, ...eventos.tarjetas]
                        .sort((a, b) => (b.minuto || 0) - (a.minuto || 0))
                        .map((e, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl glass-thin border border-white/5 animate-in fade-in slide-in-from-left-2 duration-300" 
                               style={{ animationDelay: `${idx * 50}ms` }}>
                            {e.tipo ? (
                              <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded bg-white/5">
                                {e.tipo === 'amarilla' ? '🟡' : '🔴'}
                              </span>
                            ) : (
                              <Target className="w-5 h-5 text-primary shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                               <p className="font-bold text-xs truncate">
                                 {e.inscripcion_jugador?.jugador?.nombre} {e.inscripcion_jugador?.jugador?.apellido}
                               </p>
                               <p className="text-[10px] text-text-dim uppercase tracking-tighter">
                                 {e.inscripcion_jugador?.plantel?.equipo?.nombre}
                               </p>
                            </div>
                            <div className="text-[10px] font-mono text-text-dim px-2 bg-white/5 rounded">
                              {e.minuto}'
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                     <GlassCard className="text-center py-8 opacity-60">
                        <User className="w-8 h-8 text-text-dim mx-auto mb-2 opacity-20" />
                        <p className="text-xs text-text-dim">Sin incidencias registradas</p>
                     </GlassCard>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
