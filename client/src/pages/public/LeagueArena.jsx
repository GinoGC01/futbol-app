import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowLeft, Shield, Trophy, Target, AlertTriangle, Award } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTabla, useGoleadores, useTarjetas, useFixture, usePremiosPublicados } from '../../hooks/useStats'
import Badge from '../../components/ui/Badge'
import GlassCard from '../../components/ui/GlassCard'
import EmptyState from '../../components/ui/EmptyState'

export default function LeagueArena() {
  const { slug } = useParams()
  const [activeTab, setActiveTab] = useState('posiciones')

  // Fetch liga
  const { data: liga, isLoading: loadingLiga } = useQuery({
    queryKey: ['liga', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('liga').select('id, nombre, slug, zona, tipo_futbol')
        .eq('slug', slug).single()
      if (error) throw error
      return data
    },
    enabled: !!slug
  })

  // Fetch temporada activa
  const { data: temporada } = useQuery({
    queryKey: ['temporada-activa', liga?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporada')
        .select('id, nombre, estado')
        .eq('liga_id', liga.id)
        .neq('estado', 'borrador')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (error) {
        console.error('Error fetching temporada:', error)
        return null
      }
      return data
    },
    enabled: !!liga?.id
  })

  // Fetch fases
  const { data: fases } = useQuery({
    queryKey: ['fases', temporada?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('fase').select('id, nombre, tipo, orden')
        .eq('temporada_id', temporada.id).order('orden')
      return data || []
    },
    enabled: !!temporada?.id
  })

  // Fetch jornadas of first fase
  const { data: jornadas } = useQuery({
    queryKey: ['jornadas', fases?.[0]?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('jornada').select('id, numero, estado, fecha_tentativa')
        .eq('fase_id', fases[0].id).order('numero')
      return data || []
    },
    enabled: !!fases?.[0]?.id
  })

  const [selectedJornada, setSelectedJornada] = useState(null)
  const faseId = fases?.[0]?.id
  const jornadaId = selectedJornada || jornadas?.[0]?.id

  const { data: tabla } = useTabla({ fase_id: faseId })
  const { data: goleadores } = useGoleadores({ temporada_id: temporada?.id })
  const { data: tarjetas } = useTarjetas({ temporada_id: temporada?.id })
  const { data: fixture } = useFixture(activeTab === 'fixture' ? jornadaId : null)
  const { data: premios } = usePremiosPublicados(temporada?.id)

  const tabs = [
    { id: 'posiciones', label: 'Posiciones', icon: Trophy },
    { id: 'fixture',    label: 'Fixture',    icon: Shield },
    { id: 'goleadores', label: 'Goleadores', icon: Target },
    { id: 'tarjetas',   label: 'Fair Play',  icon: AlertTriangle },
    { id: 'premios',    label: 'Premios',    icon: Award },
  ]

  if (loadingLiga) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>
  if (!liga) return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div><h2 className="text-xl font-heading font-bold mb-2">Liga no encontrada</h2>
      <Link to="/" className="text-primary text-sm">Volver al inicio</Link></div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-primary mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Volver
      </Link>

      {/* Header */}
      <GlassCard hover={false} className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold">{liga.nombre}</h1>
            <p className="text-sm text-text-dim">{liga.zona} · {liga.tipo_futbol?.toUpperCase()}</p>
          </div>
        </div>
        {temporada && (
          <div className="mt-3 flex items-center gap-2">
            <Badge status={temporada.estado} />
            <span className="text-sm text-text-secondary">{temporada.nombre}</span>
          </div>
        )}
      </GlassCard>

      {/* Tabs - horizontal scroll on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-text-dim hover:text-text-secondary hover:bg-bg-surface'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'posiciones' && <StandingsTab data={tabla} />}
        {activeTab === 'fixture' && <FixtureTab fixture={fixture} jornadas={jornadas} selected={jornadaId} onSelect={setSelectedJornada} />}
        {activeTab === 'goleadores' && <ScorersTab data={goleadores} />}
        {activeTab === 'tarjetas' && <CardsTab data={tarjetas} />}
        {activeTab === 'premios' && <AwardsTab data={premios} />}
      </motion.div>
    </div>
  )
}

function StandingsTab({ data }) {
  if (!data?.length) return <EmptyState icon={Trophy} title="Sin datos aún" description="Los resultados aparecerán cuando se jueguen partidos." />
  return (
    <GlassCard hover={false}>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-8">#</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2.5">Equipo</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-10">PJ</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-10">PG</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-10">PE</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-10">PP</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-10">GF</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-10">GC</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-10">DG</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-10 font-bold text-primary">PTS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.equipo_id} className={`border-b border-border-subtle hover:bg-white/[0.02] transition-colors ${i === 0 ? 'bg-primary/[0.04]' : ''}`}>
                <td className={`py-2.5 font-bold ${i === 0 ? 'text-primary' : 'text-text-dim'}`}>{i + 1}</td>
                <td className="py-2.5 font-medium flex items-center gap-2">
                  {row.escudo_url && <img src={row.escudo_url} alt="" className="w-5 h-5 rounded" />}
                  <Link to={`/equipo/${row.equipo_id}`} className="hover:text-primary transition-colors text-text-primary">{row.equipo_nombre}</Link>
                </td>
                <td className="text-center py-2.5 text-text-secondary">{row.pj}</td>
                <td className="text-center py-2.5 text-text-secondary">{row.pg}</td>
                <td className="text-center py-2.5 text-text-secondary">{row.pe}</td>
                <td className="text-center py-2.5 text-text-secondary">{row.pp}</td>
                <td className="text-center py-2.5 text-text-secondary">{row.gf}</td>
                <td className="text-center py-2.5 text-text-secondary">{row.gc}</td>
                <td className={`text-center py-2.5 font-medium ${row.dg > 0 ? 'text-primary' : row.dg < 0 ? 'text-danger' : 'text-text-dim'}`}>{row.dg > 0 ? '+' : ''}{row.dg}</td>
                <td className="text-center py-2.5 font-bold text-primary">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function FixtureTab({ fixture, jornadas, selected, onSelect }) {
  return (
    <div>
      {/* Jornada selector */}
      {jornadas?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {jornadas.map(j => (
            <button
              key={j.id}
              onClick={() => onSelect(j.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                selected === j.id
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'text-text-dim border-border-subtle hover:border-border-default'
              }`}
            >
              Fecha {j.numero}
            </button>
          ))}
        </div>
      )}

      {!fixture?.length ? (
        <EmptyState icon={Shield} title="Sin partidos" description="Selecciona una jornada para ver los partidos." />
      ) : (
        <div className="flex flex-col gap-3">
          {fixture.map(p => (
            <GlassCard key={p.partido_id} className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge status={p.partido_estado} />
                {p.cancha && <span className="text-[11px] text-text-dim">{p.cancha}</span>}
              </div>
              <div className="flex items-center justify-between">
                <Link to={`/equipo/${p.local_id}`} className="flex-1 text-right font-medium text-sm hover:text-primary transition-colors truncate">{p.local_nombre}</Link>
                <div className="mx-4 text-center min-w-[60px]">
                  {p.partido_estado === 'finalizado' || p.partido_estado === 'en_juego' ? (
                    <span className="text-xl font-heading font-bold text-primary">{p.goles_local} - {p.goles_visitante}</span>
                  ) : (
                    <span className="text-sm text-text-dim">vs</span>
                  )}
                </div>
                <Link to={`/equipo/${p.visitante_id}`} className="flex-1 text-left font-medium text-sm hover:text-primary transition-colors truncate">{p.visitante_nombre}</Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}

function ScorersTab({ data }) {
  if (!data?.length) return <EmptyState icon={Target} title="Sin goleadores" description="Aparecerán cuando se registren goles." />
  return (
    <GlassCard hover={false}>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-8">#</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2.5">Jugador</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2.5">Equipo</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-12">Goles</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-12">Penal</th>
            </tr>
          </thead>
          <tbody>
            {data.map((g, i) => (
              <tr key={`${g.jugador_id}-${i}`} className={`border-b border-border-subtle hover:bg-white/[0.02] ${i === 0 ? 'bg-accent-gold/[0.04]' : ''}`}>
                <td className={`py-2.5 font-bold ${i === 0 ? 'text-accent-gold' : 'text-text-dim'}`}>{i + 1}</td>
                <td className="py-2.5 font-medium">{g.jugador_nombre} {g.jugador_apellido}</td>
                <td className="py-2.5 text-text-secondary text-xs">{g.equipo_nombre}</td>
                <td className="text-center py-2.5 font-bold text-primary">{g.goles}</td>
                <td className="text-center py-2.5 text-text-dim">{g.penales || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function CardsTab({ data }) {
  if (!data?.length) return <EmptyState icon={AlertTriangle} title="Sin tarjetas" description="Los registros aparecerán cuando se sancione." />
  return (
    <GlassCard hover={false}>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2.5">Jugador</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2.5">Equipo</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-12">🟡</th>
              <th className="text-center text-[11px] uppercase tracking-wider text-text-dim py-2.5 w-12">🔴</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t, i) => (
              <tr key={`${t.jugador_id}-${i}`} className="border-b border-border-subtle hover:bg-white/[0.02]">
                <td className="py-2.5 font-medium">{t.jugador_nombre} {t.jugador_apellido}</td>
                <td className="py-2.5 text-text-secondary text-xs">{t.equipo_nombre}</td>
                <td className="text-center py-2.5 text-warning font-semibold">{t.amarillas || 0}</td>
                <td className="text-center py-2.5 text-danger font-semibold">{t.rojas || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  )
}

function AwardsTab({ data }) {
  if (!data?.length) return <EmptyState icon={Award} title="Salón de la Fama Vacío" description="Los premios y galardones confirmados se publicarán aquí." />
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {data.map(p => (
        <GlassCard key={p.id} className="!border-accent-gold/30 hover:!border-accent-gold/60 hover:!shadow-glow-gold transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-gold/5 rounded-full blur-3xl group-hover:bg-accent-gold/10 transition-colors" />
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-gold/20 to-transparent flex items-center justify-center border border-accent-gold/20 shadow-inner">
              <Award className="w-6 h-6 text-accent-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white tracking-wide drop-shadow-sm">{p.nombre}</h3>
              <p className="text-xs text-accent-gold uppercase tracking-widest">{p.criterio?.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {p.ganadores?.map((g, i) => (
              <div key={g.id} className="p-4 rounded-xl bg-bg-deep/80 border border-white/5 relative">
                {i === 0 && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-gold rounded-r-md" />}
                
                <p className="font-heading font-bold text-base text-white">
                  {g.jugador ? `${g.jugador.nombre} ${g.jugador.apellido}` : g.equipo?.nombre}
                </p>
                
                {g.valor_record && (
                  <p className="text-sm font-semibold text-primary mt-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Récord: {g.valor_record}
                  </p>
                )}
                
                {g.nota_desempate && (
                  <div className="mt-3 p-2.5 rounded-lg bg-white/5 border border-white/10 border-l-2 border-l-secondary">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Criterio de Desempate</p>
                    <p className="text-xs text-text-secondary leading-snug">{g.nota_desempate}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  )
}
