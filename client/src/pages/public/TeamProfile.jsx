import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowLeft, Shield, Users, Calendar, Trophy, AlertTriangle, Target, Activity } from 'lucide-react'
import { useEquipoDetalle } from '../../hooks/useStats'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

export default function TeamProfile() {
  const { id } = useParams()
  const { data, isLoading } = useEquipoDetalle(id)

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>
  
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <EmptyState icon={Shield} title="Equipo no encontrado" description="El equipo que buscas no existe o fue eliminado." />
    </div>
  )

  const { equipo, liga, stats, plantel, fixture } = data // Fallback structure assumption

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio
      </Link>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Header - span 12 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-12">
          <GlassCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Shield className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-6 relative z-10">
              <div className="h-24 w-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-glow-primary">
                {equipo?.escudo_url ? (
                  <img src={equipo.escudo_url} alt="Escudo" className="w-full h-full object-contain" />
                ) : (
                  <Shield className="w-12 h-12 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-4xl font-heading font-black tracking-normal">{equipo?.nombre || 'Nombre del Equipo'}</h1>
                <p className="text-text-secondary mt-1 text-lg">{liga?.nombre || 'Liga Independiente'} · {liga?.zona || 'Zona Única'}</p>
                <div className="flex gap-2 mt-3">
                  <Badge status="activa" label="Inscripción Activa" />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Global Statistics - span 4 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-4 flex flex-col gap-4">
          <GlassCard className="flex-1 flex flex-col justify-center items-center text-center">
            <Trophy className="w-8 h-8 text-accent-gold mb-3 opacity-80" />
            <p className="text-sm font-bold uppercase tracking-widest text-text-dim mb-1">Puntos Totales</p>
            <p className="text-5xl font-heading font-black text-white">{stats?.pts || 0}</p>
          </GlassCard>
          
          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="text-center p-4">
              <Target className="w-5 h-5 text-primary mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats?.gf || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-text-dim mt-1">Goles AF</p>
            </GlassCard>
            <GlassCard className="text-center p-4">
              <Activity className="w-5 h-5 text-danger mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats?.gc || 0}</p>
              <p className="text-[10px] uppercase tracking-wider text-text-dim mt-1">Goles EN</p>
            </GlassCard>
          </div>
        </motion.div>

        {/* Plantel (Roster) - span 8 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-8">
          <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
              <h3 className="text-lg font-heading font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Plantel Oficial
              </h3>
              <span className="text-xs text-text-dim px-2 bg-white/5 rounded-full">{plantel?.length || 0} inscritos</span>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-none pr-2">
              {!plantel?.length ? (
                <EmptyState icon={Users} title="Sin Plantel" description="Aún no hay jugadores registrados." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plantel.map((j) => (
                    <Link key={j.id} to={`/jugador/${j.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center overflow-hidden border border-white/10">
                        {j.foto_url ? <img src={j.foto_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-text-dim" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{j.nombre} {j.apellido}</p>
                        <p className="text-xs text-text-dim truncate">DNI {j.dni}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Últimos Partidos / Fixture - span 12 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-12">
          <GlassCard>
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
              <Calendar className="w-5 h-5 text-secondary" />
              <h3 className="text-lg font-heading font-bold">Fixture & Resultados</h3>
            </div>
            
            {!fixture?.length ? (
              <EmptyState icon={Calendar} title="Sin partidos" description="Agrega partidos en el fixture para que se reflejen aquí." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixture.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] text-text-dim uppercase tracking-wider">Fecha {p.jornada_numero}</span>
                      <Badge status={p.estado} />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate flex-1 ${p.local_id === equipo?.id ? 'text-primary' : ''}`}>{p.local_nombre}</p>
                      <p className="font-heading font-black text-xl px-3 tabular-nums">{p.goles_local} - {p.goles_visitante}</p>
                      <p className={`text-sm font-semibold truncate flex-1 text-right ${p.visitante_id === equipo?.id ? 'text-primary' : ''}`}>{p.visitante_nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
        
      </div>
    </div>
  )
}
