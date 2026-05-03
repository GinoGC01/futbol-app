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
import { Swords, Play, Square, Target, AlertTriangle, Clock, X, User, Lock as LockIcon, Shield, Pause, Timer, ChevronRight } from 'lucide-react'

import { useLigaActiva } from '../../context/LigaContext'
import Loader from '../../components/ui/Loader'

export default function MatchEdgeBox() {
  const toast = useToast()
  const { liga } = useLigaActiva()
  const { data: temporadas, isLoading: loadingTemporadas } = useTemporadas(liga?.id)
  const temporadaActiva = temporadas?.find(t => t.estado === 'activa')
  const { data: tree, isLoading: loadingTree } = useTemporadaTree(temporadaActiva?.id)

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
  const { data: eventos, isLoading: loadingEventos } = useEventos(selectedPartido)

  const cambiarEstado = useCambiarEstadoPartido()
  const registrarGol = useRegistrarGol()
  const registrarTarjeta = useRegistrarTarjeta()

  const partido = partidos.find(p => p.id === selectedPartido)
  
  // Players for both teams
  const { data: playersLocal, isLoading: loadingLocal } = useInscripcionesEquipo(liga?.id, partido?.equipo_local?.id)
  const { data: playersVisit, isLoading: loadingVisit } = useInscripcionesEquipo(liga?.id, partido?.equipo_visitante?.id)

  // D-03: Live matches tracking
  const liveMatches = partidos.filter(p => p.estado === 'en_juego' || p.estado === 'entre_tiempo')

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
        setTimer(0)
        setIsRunning(true)
      }
    } else if (p?.estado === 'entre_tiempo') {
      setIsRunning(false)
      if (saved) {
        const { pausedAt } = JSON.parse(saved)
        setTimer(pausedAt || 0)
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

  const formatTimeParts = (seconds) => ({
    mins: String(Math.floor(seconds / 60)).padStart(2, '0'),
    secs: String(seconds % 60).padStart(2, '0')
  })

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

  // D-02: Pause → entre_tiempo
  const handlePauseMatch = () => {
    cambiarEstado.mutate({ id: partido.id, estado: 'entre_tiempo' }, {
      onSuccess: () => {
        setIsRunning(false)
        localStorage.setItem(`match_timer_${partido.id}`, JSON.stringify({ pausedAt: timer }))
        toast.info('⏸ Entre Tiempo — Cronómetro pausado.')
      }
    })
  }

  // D-02: Resume from entre_tiempo
  const handleResumeMatch = () => {
    const startTime = Date.now() - (timer * 1000)
    localStorage.setItem(`match_timer_${partido.id}`, JSON.stringify({ startTime }))
    cambiarEstado.mutate({ id: partido.id, estado: 'en_juego' }, {
      onSuccess: () => {
        setIsRunning(true)
        toast.success('▶ Segundo Tiempo — ¡Vamos!')
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
    if (partido.estado === 'entre_tiempo' && type !== 'GOL') {
      // Allow all event types during halftime for corrections
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative pb-20 px-4 sm:px-0">
      {(registrarGol.isPending || registrarTarjeta.isPending) && (
        <Loader overlay text="Sincronizando..." />
      )}
      
      {/* aggressive Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 md:h-12 bg-primary skew-x-[-15deg] shrink-0" />
          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-wide uppercase italic leading-relaxed py-2">Match Edge</h1>
        </div>
        <p className="text-[10px] md:text-xs font-bold text-text-dim uppercase tracking-[0.3em] pl-4">Panel de Control de Campo en Tiempo Real</p>
      </div>

      {(loadingTemporadas || loadingTree) && (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="spinner mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-text-dim">Cargando Estructura...</p>
        </div>
      )}

      {/* Jornada selector - Horizontal Scroll */}
      {allJornadas.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none snap-x mask-fade-right">
          {allJornadas.map(j => (
            <button 
              key={j.id} 
              onClick={() => { setSelectedJornada(j.id); setSelectedPartido(null) }}
              className={`px-5 py-3 rounded-xl text-[10px] font-black whitespace-nowrap uppercase italic tracking-widest border-2 transition-all flex items-center gap-2 snap-start ${
                jornadaId === j.id 
                  ? 'bg-primary text-bg-deep border-primary shadow-[0_0_20px_rgba(206,222,11,0.2)]' 
                  : 'bg-bg-surface text-text-dim border-white/5 hover:border-white/20'
              }`}
            >
              {j.estado === 'cerrada' && <LockIcon className="w-3 h-3" />}
              Fecha {j.numero}
            </button>
          ))}
        </div>
      )}

      {/* D-03: Live Matches Quick-Switch Bar */}
      {liveMatches.length > 0 && !selectedPartido && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">En Vivo — {liveMatches.length} {liveMatches.length === 1 ? 'Partido' : 'Partidos'}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {liveMatches.map(lm => (
              <button key={lm.id} onClick={() => setSelectedPartido(lm.id)}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all active:scale-95 live-ring">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase truncate max-w-[60px]">{lm.equipo_local?.nombre}</span>
                  <span className="text-xs font-black text-primary">{lm.goles_local ?? 0}-{lm.goles_visitante ?? 0}</span>
                  <span className="text-[10px] font-black uppercase truncate max-w-[60px]">{lm.equipo_visitante?.nombre}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-primary" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Match list */}
      {!selectedPartido ? (
        loadingFixture ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="spinner" />
            <p className="text-[10px] font-black uppercase tracking-widest text-text-dim mt-4">Buscando Partidos...</p>
          </div>
        ) : partidos.length > 0 ? (
          <div className="flex flex-col gap-4">
            {partidos.map(p => (
              <button 
                key={p.id} 
                onClick={() => setSelectedPartido(p.id)} 
                className="w-full text-left group transition-transform active:scale-[0.98]"
              >
                <GlassCard className="!p-0 overflow-hidden border-none ring-1 ring-white/5 group-hover:ring-primary/40 transition-all">
                   <div className="h-1 bg-white/5 group-hover:bg-primary/40 transition-colors" />
                   <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.estado === 'en_juego' ? 'bg-primary animate-pulse' : p.estado === 'entre_tiempo' ? 'bg-warning animate-pulse' : 'bg-text-dim'}`} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-dim">{p.estado.replace('_', ' ')}</span>
                      </div>
                      {p.cancha && (
                        <div className="flex items-center gap-1.5 text-text-dim">
                          <Clock className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{p.cancha}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black uppercase tracking-wide truncate leading-tight">{p.equipo_local?.nombre}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 px-4 py-1.5 bg-bg-deep/50 rounded-lg border border-white/5 font-mono">
                        <span className={`text-xl font-black ${p.goles_local > 0 ? 'text-primary' : 'text-text-dim'}`}>{p.goles_local ?? 0}</span>
                        <span className="text-[10px] text-text-dim/30">—</span>
                        <span className={`text-xl font-black ${p.goles_visitante > 0 ? 'text-primary' : 'text-text-dim'}`}>{p.goles_visitante ?? 0}</span>
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-black uppercase tracking-wide truncate leading-tight">{p.equipo_visitante?.nombre}</p>
                      </div>
                    </div>
                   </div>
                </GlassCard>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon={Swords} title="Sin Partidos" description="Seleccioná una jornada con partidos programados." />
        )
      ) : (
        /* Match detail + incident feed */
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <button 
              onClick={() => setSelectedPartido(null)} 
              className="text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-primary transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Cerrar Box
            </button>
            
            <div className="flex items-center gap-2">
            {partido.estado === 'programado' ? (
              <button 
                onClick={handleStartMatch}
                disabled={cambiarEstado.isPending}
                className="bg-primary text-bg-deep px-6 py-2 rounded-lg font-black uppercase italic tracking-wide text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(206,222,11,0.2)]"
              >
                <Play className="w-3.5 h-3.5 inline mr-1" /> Iniciar
              </button>
            ) : partido.estado === 'en_juego' ? (
              <>
                <button 
                  onClick={handlePauseMatch}
                  disabled={cambiarEstado.isPending}
                  className="bg-warning text-bg-deep px-5 py-2 rounded-lg font-black uppercase italic tracking-wide text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                >
                  <Pause className="w-3.5 h-3.5 inline mr-1" /> Pausa
                </button>
                <button 
                  onClick={handleEndMatch}
                  disabled={cambiarEstado.isPending}
                  className="bg-danger text-white px-5 py-2 rounded-lg font-black uppercase italic tracking-wide text-xs hover:scale-105 active:scale-95 transition-all"
                >
                  <Square className="w-3 h-3 inline mr-1" /> Fin
                </button>
              </>
            ) : partido.estado === 'entre_tiempo' ? (
              <>
                <button 
                  onClick={handleResumeMatch}
                  disabled={cambiarEstado.isPending}
                  className="bg-primary text-bg-deep px-5 py-2 rounded-lg font-black uppercase italic tracking-wide text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(206,222,11,0.2)] animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 inline mr-1" /> Reanudar
                </button>
                <button 
                  onClick={handleEndMatch}
                  disabled={cambiarEstado.isPending}
                  className="bg-danger text-white px-5 py-2 rounded-lg font-black uppercase italic tracking-wide text-xs hover:scale-105 active:scale-95 transition-all"
                >
                  <Square className="w-3 h-3 inline mr-1" /> Fin
                </button>
              </>
            ) : null}
            </div>
          </div>

          {partido && (
            <>
              {/* D-01: Premium Scoreboard with GIANT Stopwatch */}
              <div className={`relative group ${partido.estado === 'entre_tiempo' ? 'halftime-stripes rounded-[22px]' : ''}`}>
                <div className={`absolute -inset-1 rounded-[22px] blur-sm opacity-50 ${
                  partido.estado === 'entre_tiempo' 
                    ? 'bg-gradient-to-r from-warning/20 via-warning/5 to-warning/20'
                    : 'bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20'
                }`} />
                <GlassCard hover={false} className={`relative !p-6 bg-bg-surface/80 ${
                  partido.estado === 'entre_tiempo' ? 'ring-2 ring-warning/30' : 'ring-2 ring-primary/20'
                }`}>
                  <div className="flex flex-col items-center">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 ${
                        partido.estado === 'en_juego' ? 'bg-primary text-bg-deep animate-pulse' 
                        : partido.estado === 'entre_tiempo' ? 'bg-warning text-bg-deep'
                        : 'bg-white/10 text-text-dim'
                      }`}>
                        {partido.estado === 'en_juego' && <><div className="w-1.5 h-1.5 rounded-full bg-bg-deep" /> Live</>}
                        {partido.estado === 'entre_tiempo' && <><Pause className="w-3 h-3" /> Entre Tiempo</>}
                        {partido.estado === 'finalizado' && 'Finalizado'}
                        {partido.estado === 'programado' && 'Programado'}
                        {partido.estado === 'suspendido' && 'Suspendido'}
                        {partido.estado === 'postergado' && 'Postergado'}
                      </div>
                    </div>

                    {/* D-01: GIANT Stopwatch */}
                    {(partido.estado === 'en_juego' || partido.estado === 'entre_tiempo') && (
                      <div className={`mb-4 px-6 py-3 rounded-2xl border ${
                        partido.estado === 'entre_tiempo' 
                          ? 'bg-warning/5 border-warning/20' 
                          : 'bg-primary/5 border-primary/20 live-ring'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Timer className={`w-5 h-5 md:w-6 md:h-6 ${
                            partido.estado === 'entre_tiempo' ? 'text-warning' : 'text-primary'
                          }`} />
                          <span className={`stopwatch-display text-4xl md:text-6xl font-black ${
                            partido.estado === 'entre_tiempo' ? 'text-warning' : 'text-primary'
                          }`}>
                            {formatTimeParts(timer).mins}<span className="stopwatch-colon">:</span>{formatTimeParts(timer).secs}
                          </span>
                          <span className={`text-lg md:text-2xl font-heading italic ${
                            partido.estado === 'entre_tiempo' ? 'text-warning/60' : 'text-primary/60'
                          }`}>'</span>
                        </div>
                      </div>
                    )}

                    <div className="w-full flex items-center justify-between gap-4">
                      <div className="flex-1 text-center space-y-2 min-w-0">
                        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-2 shadow-lg">
                           <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary opacity-40" />
                        </div>
                        <p className="font-heading font-black text-sm md:text-lg uppercase italic tracking-wide truncate leading-tight">{partido.equipo_local?.nombre}</p>
                      </div>

                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="text-4xl md:text-6xl font-heading font-black tracking-wide italic flex items-center gap-4">
                          <span className={partido.goles_local > 0 ? 'text-primary' : 'text-text-primary'}>{partido.goles_local ?? 0}</span>
                          <span className="text-xl md:text-3xl text-text-dim/20 skew-x-[-15deg]">:</span>
                          <span className={partido.goles_visitante > 0 ? 'text-primary' : 'text-text-primary'}>{partido.goles_visitante ?? 0}</span>
                        </div>
                      </div>

                      <div className="flex-1 text-center space-y-2 min-w-0">
                        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 mb-2 shadow-lg">
                           <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary opacity-40" />
                        </div>
                        <p className="font-heading font-black text-sm md:text-lg uppercase italic tracking-wide truncate leading-tight">{partido.equipo_visitante?.nombre}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Main Incident Buttons - Aggressive Skewed Style */}
              {!entryMode && (partido.estado === 'en_juego' || partido.estado === 'entre_tiempo' || partido.estado === 'finalizado') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => handleIncident('GOL')}
                    className="relative h-24 group overflow-hidden rounded-xl active:scale-95 transition-all"
                  >
                    <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/30 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center gap-4 skew-x-[-10deg]">
                       <Target className="w-8 h-8 text-primary" />
                       <span className="font-heading font-black text-2xl uppercase italic tracking-wide text-primary">GOL</span>
                    </div>
                    <div className="absolute top-0 right-0 w-12 h-full bg-primary/10 skew-x-[-20deg] translate-x-6" />
                  </button>

                  <button 
                    onClick={() => handleIncident('AMARILLA')}
                    className="relative h-24 group overflow-hidden rounded-xl active:scale-95 transition-all"
                  >
                    <div className="absolute inset-0 bg-warning/20 group-hover:bg-warning/30 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center gap-4 skew-x-[-10deg]">
                       <div className="w-6 h-8 bg-warning rounded-sm rotate-12 shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
                       <span className="font-heading font-black text-2xl uppercase italic tracking-wide text-warning">AMARILLA</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleIncident('ROJA')}
                    className="relative h-24 group overflow-hidden rounded-xl active:scale-95 transition-all"
                  >
                    <div className="absolute inset-0 bg-danger/20 group-hover:bg-danger/30 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center gap-4 skew-x-[-10deg]">
                       <div className="w-6 h-8 bg-danger rounded-sm rotate-12 shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                       <span className="font-heading font-black text-2xl uppercase italic tracking-wide text-danger">ROJA</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Player Selector Entry Flow */}
              {entryMode && (
                <GlassCard hover={false} className="animate-in slide-in-from-bottom-5 fade-in duration-300 border-2 border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <h3 className="font-heading font-black uppercase text-sm italic tracking-wide text-primary flex items-center gap-2">
                         {entryMode.type === 'GOL' ? <Target className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                         REGISTRAR {entryMode.type}
                      </h3>
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Seleccioná al protagonista</p>
                    </div>
                    <button onClick={() => setEntryMode(null)} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors">
                      <X className="w-5 h-5 text-text-dim" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-8 md:flex-row md:gap-4">
                    {/* Local Team */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-1 h-4 bg-primary/40 skew-x-[-15deg]" />
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-widest truncate">{partido.equipo_local?.nombre}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                        {loadingLocal ? (
                          <div className="p-4 flex justify-center"><div className="spinner sm" /></div>
                        ) : playersLocal?.find(p => p.temporada_id === temporadaActiva?.id)?.plantel?.inscripciones?.length > 0 ? (
                          playersLocal?.find(p => p.temporada_id === temporadaActiva?.id)?.plantel?.inscripciones?.map(p => (
                            <button key={p.id} onClick={() => submitEvent(p)}
                              className="flex items-center gap-3 p-3 rounded-xl bg-bg-deep/50 border border-white/5 hover:border-primary/40 hover:bg-primary/5 text-left transition-all group active:scale-[0.97]">
                              <span className="w-6 font-mono font-black text-primary text-sm group-hover:scale-110 transition-transform">{p.dorsal || '—'}</span>
                              <span className="text-xs font-bold uppercase tracking-wide truncate">{p.jugador?.nombre} {p.jugador?.apellido}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center rounded-xl border border-dashed border-white/5 bg-white/[0.02]">
                             <p className="text-[10px] font-black uppercase text-text-dim/50 tracking-widest">Sin jugadores</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Visitor Team */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-end gap-2 px-1">
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-widest truncate text-right">{partido.equipo_visitante?.nombre}</p>
                        <div className="w-1 h-4 bg-primary/40 skew-x-[-15deg]" />
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                        {loadingVisit ? (
                          <div className="p-4 flex justify-center"><div className="spinner sm" /></div>
                        ) : playersVisit?.find(p => p.temporada_id === temporadaActiva?.id)?.plantel?.inscripciones?.length > 0 ? (
                          playersVisit?.find(p => p.temporada_id === temporadaActiva?.id)?.plantel?.inscripciones?.map(p => (
                            <button key={p.id} onClick={() => submitEvent(p)}
                              className="flex items-center gap-3 p-3 rounded-xl bg-bg-deep/50 border border-white/5 hover:border-primary/40 hover:bg-primary/5 text-left transition-all group active:scale-[0.97]">
                              <span className="w-6 font-mono font-black text-primary text-sm group-hover:scale-110 transition-transform">{p.dorsal || '—'}</span>
                              <span className="text-xs font-bold uppercase tracking-wide truncate">{p.jugador?.nombre} {p.jugador?.apellido}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center rounded-xl border border-dashed border-white/5 bg-white/[0.02]">
                             <p className="text-[10px] font-black uppercase text-text-dim/50 tracking-widest">Sin jugadores</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Event Feed */}
              {!entryMode && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-heading font-black uppercase italic text-xs tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Historial de incidencias
                    </h3>
                    <div className="h-[1px] flex-1 bg-white/5 mx-4" />
                  </div>
                  
                  {loadingEventos ? (
                    <div className="py-8 flex flex-col items-center justify-center">
                      <div className="spinner sm" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-text-dim mt-4">Actualizando Cronología...</p>
                    </div>
                  ) : eventos ? (
                    (eventos.goles?.length > 0 || eventos.tarjetas?.length > 0) ? (
                      <div className="flex flex-col gap-3">
                        {[...eventos.goles, ...eventos.tarjetas]
                          .sort((a, b) => (b.minuto || 0) - (a.minuto || 0))
                          .map((e, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-bg-surface/50 border border-white/5 animate-in fade-in slide-in-from-left-2 duration-300 relative overflow-hidden group" 
                                 style={{ animationDelay: `${idx * 50}ms` }}>
                              <div className="absolute top-0 left-0 w-1 h-full bg-white/5 group-hover:bg-primary/20 transition-colors" />
                              
                              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 group-hover:border-primary/20 transition-all">
                                {e.tipo ? (
                                  <div className={`w-3.5 h-5 rounded-sm rotate-6 shadow-lg ${e.tipo === 'amarilla' ? 'bg-warning' : 'bg-danger'}`} />
                                ) : (
                                  <Target className="w-5 h-5 text-primary" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                 <p className="font-black text-sm uppercase italic tracking-wide truncate leading-tight">
                                   {e.inscripcion_jugador?.jugador?.nombre} {e.inscripcion_jugador?.jugador?.apellido}
                                 </p>
                                 <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest mt-0.5">
                                   {e.inscripcion_jugador?.plantel?.equipo?.nombre}
                                 </p>
                              </div>

                              <div className="px-3 py-1.5 bg-bg-deep rounded-lg border border-white/5 text-[11px] font-mono font-black text-primary italic">
                                {e.minuto}'
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                       <div className="text-center py-12 bg-bg-surface/30 rounded-3xl border border-dashed border-white/5">
                          <Swords className="w-10 h-10 text-text-dim mx-auto mb-3 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-text-dim/60 italic">Esperando incidencias del encuentro</p>
                       </div>
                    )
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
