import { useLigas, useTemporadas } from '../../hooks/useAdmin'
import { useAuth } from '../../hooks/useAuth'
import StatCard from '../../components/ui/StatCard'
import GlassCard from '../../components/ui/GlassCard'
import { Shield, Users, Swords, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardHome() {
  const { user } = useAuth()
  const { data: ligas, isLoading } = useLigas()
  const liga = ligas?.[0]
  const { data: temporadas } = useTemporadas(liga?.id)
  const temporadaActiva = temporadas?.find(t => t.estado === 'activa')

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">
          Hola, <span className="text-primary">{user?.email?.split('@')[0]}</span>
        </h1>
        <p className="text-sm text-text-dim">
          {liga ? `Administrando: ${liga.nombre}` : 'Empezá creando tu primera liga'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Shield} value={liga?.nombre || '—'} label="Liga activa" />
        <StatCard icon={Users} value={temporadaActiva?.nombre || 'Sin temporada'} label="Temporada" />
        <StatCard icon={Swords} value="—" label="Partidos jugados" />
        <StatCard icon={DollarSign} value="—" label="Cobros pendientes" />
      </div>

      {/* Quick actions */}
      <GlassCard hover={false}>
        <h2 className="font-heading font-semibold mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: '/admin/torneo',  icon: Shield,      label: 'Configurar Torneo', color: 'text-primary' },
            { to: '/admin/roster',  icon: Users,        label: 'Gestionar Roster',  color: 'text-secondary' },
            { to: '/admin/partidos',icon: Swords,       label: 'Cargar Partido',    color: 'text-warning' },
            { to: '/admin/premios', icon: DollarSign,   label: 'Premios',           color: 'text-accent-gold' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-surface border border-border-subtle hover:border-border-accent hover:-translate-y-0.5 transition-all text-center group">
              <a.icon className={`w-6 h-6 ${a.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-medium text-text-secondary">{a.label}</span>
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
