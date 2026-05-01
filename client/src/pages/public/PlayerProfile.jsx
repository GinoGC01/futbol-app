import { useParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, User, Target, AlertTriangle, Medal, Activity, Users } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
// For the purpose of the UI task, simulating a hook if not present in useStats. 
// In a real scenario, this connects to the Phase 5 stats endpoint for a single player.

export default function PlayerProfile() {
  const { id } = useParams()
  // const { data, isLoading } = useJugadorDetalle(id) 
  // Placeholder mock data to fulfill the Elite UI implementation req:
  const isLoading = false
  const data = {
    jugador: { nombre: 'Jugador', apellido: 'Estrella', dni: id, foto_url: null },
    equipo: { nombre: 'Equipo Local', id: 'eq-1' },
    stats: { goles: 14, asistencias: 5, amarillas: 2, rojas: 0, mvps: 3 }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>
  
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <EmptyState icon={User} title="Jugador no encontrado" description="El jugador que buscas no existe en nuestra base de datos." />
    </div>
  )

  const { jugador, equipo, stats } = data

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 min-h-screen">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Volver
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Main Identity - span 8 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-8">
          <GlassCard className="h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <User className="w-48 h-48" />
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
              <div className="h-32 w-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-glow-secondary overflow-hidden">
                {jugador?.foto_url ? (
                  <img src={jugador.foto_url} alt="Jugador" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-secondary" />
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-4xl font-heading font-black tracking-normal">{jugador?.nombre} {jugador?.apellido}</h1>
                <Link to={`/equipo/${equipo?.id}`} className="inline-flex items-center gap-1.5 text-text-secondary mt-2 hover:text-secondary transition-colors text-lg">
                  <ShieldIcon className="w-4 h-4" /> {equipo?.nombre}
                </Link>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                  <Badge status="activa" label="Fichaje Confirmado" />
                  <span className="text-xs bg-bg-surface border border-white/10 px-2 py-1 rounded-md text-text-dim font-mono">DNI: {jugador?.dni}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Global Impact - span 4 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-4 flex flex-col gap-4">
          <GlassCard className="flex-1 flex flex-col justify-center items-center text-center bg-primary/[0.02] border-primary/20 hover:border-primary/40 transition-colors shadow-glow-primary">
            <Target className="w-8 h-8 text-primary mb-3 opacity-90" />
            <p className="text-sm font-bold uppercase tracking-widest text-text-dim mb-1">Goles Totales</p>
            <p className="text-6xl font-heading font-black text-white">{stats?.goles || 0}</p>
          </GlassCard>
        </motion.div>

        {/* Mini Stats Bento Grid - span 12 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          
          <GlassCard className="p-5 text-center flex flex-col items-center">
            <Activity className="w-6 h-6 text-info mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats?.asistencias || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-dim mt-1">Asistencias</p>
          </GlassCard>
          
          <GlassCard className="p-5 text-center flex flex-col items-center">
            <Medal className="w-6 h-6 text-accent-gold mb-2 opacity-80 shadow-glow-gold rounded-full" />
            <p className="text-3xl font-bold text-accent-gold">{stats?.mvps || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-dim mt-1">Premios MVP</p>
          </GlassCard>

          <GlassCard className="p-5 text-center flex flex-col items-center">
            <div className="w-6 h-8 rounded border-2 border-warning bg-warning/20 mb-2" />
            <p className="text-3xl font-bold">{stats?.amarillas || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-dim mt-1">Amarillas</p>
          </GlassCard>
          
          <GlassCard className="p-5 text-center flex flex-col items-center">
             <div className="w-6 h-8 rounded border-2 border-danger bg-danger/20 mb-2 shadow-danger" />
            <p className="text-3xl font-bold">{stats?.rojas || 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-text-dim mt-1">Rojas</p>
          </GlassCard>

        </motion.div>

        {/* Bio / Extra info placeholder */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="md:col-span-12">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-text-secondary" />
              <h3 className="text-lg font-heading font-bold">Historial de Temporada</h3>
            </div>
            <EmptyState icon={Activity} title="Registros en proceso" description="El historial completo de partidos estará disponible próximamente." />
          </GlassCard>
        </motion.div>
        
      </div>
    </div>
  )
}

function ShieldIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}
