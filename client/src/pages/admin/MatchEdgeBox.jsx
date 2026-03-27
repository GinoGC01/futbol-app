import { useState } from 'react'
import { useTemporadas, useLigas, useTemporadaTree, useFixtureAdmin, useEventos, useCambiarEstadoPartido, useRegistrarGol, useRegistrarTarjeta } from '../../hooks/useAdmin'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { Swords, Play, Square, Target, AlertTriangle, Clock } from 'lucide-react'

export default function MatchEdgeBox() {
  const { data: ligas } = useLigas()
  const liga = ligas?.[0]
  const { data: temporadas } = useTemporadas(liga?.id)
  const temporadaActiva = temporadas?.find(t => t.estado === 'activa')
  const { data: tree } = useTemporadaTree(temporadaActiva?.id)

  const allJornadas = tree?.fases?.flatMap(f => f.jornadas?.map(j => ({ ...j, faseName: f.nombre })) || []) || []
  const [selectedJornada, setSelectedJornada] = useState(null)
  const jornadaId = selectedJornada || allJornadas[0]?.id

  const { data: fixtureData } = useFixtureAdmin(jornadaId)
  const partidos = fixtureData?.partidos || []
  const [selectedPartido, setSelectedPartido] = useState(null)
  const { data: eventos } = useEventos(selectedPartido)

  const cambiarEstado = useCambiarEstadoPartido()
  // const registrarGol = useRegistrarGol()
  // const registrarTarjeta = useRegistrarTarjeta()

  const partido = partidos.find(p => p.id === selectedPartido)

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Match Edge Box</h1>
      <p className="text-sm text-text-dim -mt-4">Carga de eventos en tiempo real. Optimizado para el borde de la cancha.</p>

      {/* Jornada selector */}
      {allJornadas.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {allJornadas.map(j => (
            <button key={j.id} onClick={() => { setSelectedJornada(j.id); setSelectedPartido(null) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                jornadaId === j.id ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-dim border-border-subtle'
              }`}>
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
              <button key={p.id} onClick={() => setSelectedPartido(p.id)}
                className="w-full text-left">
                <GlassCard>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge status={p.estado} />
                        {p.cancha && <span className="text-[11px] text-text-dim">{p.cancha}</span>}
                      </div>
                      <p className="font-medium">
                        {p.equipo_local?.nombre} <span className="text-primary font-bold">{p.goles_local ?? ''}</span>
                        <span className="text-text-dim mx-2">vs</span>
                        <span className="text-primary font-bold">{p.goles_visitante ?? ''}</span> {p.equipo_visitante?.nombre}
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
          <button onClick={() => setSelectedPartido(null)} className="text-sm text-text-dim hover:text-primary transition-colors">
            ← Volver a la jornada
          </button>

          {partido && (
            <>
              <GlassCard hover={false}>
                <div className="text-center">
                  <Badge status={partido.estado} className="mb-3" />
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-right flex-1">
                      <p className="font-heading font-bold text-lg">{partido.equipo_local?.nombre}</p>
                    </div>
                    <div className="text-3xl font-heading font-bold text-primary min-w-[80px]">
                      {partido.goles_local ?? 0} - {partido.goles_visitante ?? 0}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-heading font-bold text-lg">{partido.equipo_visitante?.nombre}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* State Machine Controls */}
              <div className="flex gap-2 justify-center">
                {partido.estado === 'programado' && (
                  <Button onClick={() => cambiarEstado.mutate({ id: partido.id, estado: 'en_juego' })}
                    loading={cambiarEstado.isPending} className="gap-2">
                    <Play className="w-4 h-4" /> Iniciar Partido
                  </Button>
                )}
                {partido.estado === 'en_juego' && (
                  <Button variant="danger" onClick={() => cambiarEstado.mutate({ id: partido.id, estado: 'finalizado' })}
                    loading={cambiarEstado.isPending} className="gap-2">
                    <Square className="w-4 h-4" /> Finalizar
                  </Button>
                )}
              </div>

              {/* Incident buttons — high contrast for field use */}
              {(partido.estado === 'en_juego' || partido.estado === 'finalizado') && (
                <div className="grid grid-cols-3 gap-3">
                  <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 text-primary font-bold text-sm active:scale-95 transition-transform">
                    <Target className="w-7 h-7" />
                    GOL
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-warning/10 border-2 border-warning/30 text-warning font-bold text-sm active:scale-95 transition-transform">
                    <AlertTriangle className="w-7 h-7" />
                    AMARILLA
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-danger/10 border-2 border-danger/30 text-danger font-bold text-sm active:scale-95 transition-transform">
                    <AlertTriangle className="w-7 h-7" />
                    ROJA
                  </button>
                </div>
              )}

              {/* Event Feed */}
              {eventos && (
                <GlassCard hover={false}>
                  <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-dim" /> Eventos del partido
                  </h3>
                  {(eventos.goles?.length > 0 || eventos.tarjetas?.length > 0) ? (
                    <ul className="space-y-2">
                      {eventos.goles?.map(g => (
                        <li key={g.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-bg-deep/50">
                          <Target className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-medium">
                            {g.inscripcion_jugador?.jugador?.nombre} {g.inscripcion_jugador?.jugador?.apellido}
                          </span>
                          <span className="text-text-dim text-xs">
                            {g.minuto && `${g.minuto}'`} {g.es_penal && '(P)'} {g.es_contra && '(AG)'}
                          </span>
                          <span className="text-xs text-text-dim ml-auto">{g.inscripcion_jugador?.plantel?.equipo?.nombre}</span>
                        </li>
                      ))}
                      {eventos.tarjetas?.map(t => (
                        <li key={t.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-bg-deep/50">
                          <span className={`text-lg ${t.tipo === 'amarilla' ? '' : ''}`}>
                            {t.tipo === 'amarilla' ? '🟡' : '🔴'}
                          </span>
                          <span className="font-medium">
                            {t.inscripcion_jugador?.jugador?.nombre} {t.inscripcion_jugador?.jugador?.apellido}
                          </span>
                          <span className="text-text-dim text-xs">{t.minuto && `${t.minuto}'`}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-text-dim text-center py-3">Sin eventos registrados aún.</p>
                  )}
                </GlassCard>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
