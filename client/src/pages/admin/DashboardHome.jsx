import { useState } from 'react'
import { useLigas, useTemporadas, useCreateLiga, useDashboardStats, useAlertas, useResolverAlerta, useEvaluarAlertas } from '../../hooks/useAdmin'
import { useAuth } from '../../hooks/useAuth'
import StatCard from '../../components/ui/StatCard'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Shield, Users, Swords, DollarSign, Plus, Trophy, Bell, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '../../components/ui/Toast'
import { useLigaActiva } from '../../context/LigaContext'

export default function DashboardHome() {
  const { user } = useAuth()
  const { liga, isLoading } = useLigaActiva()
  const [showNewLiga, setShowNewLiga] = useState(false)
  const toast = useToast()
  
  const { data: temporadas } = useTemporadas(liga?.id)
  const { data: dashStats } = useDashboardStats(liga?.id)
  const { data: alerts } = useAlertas(liga?.id)
  const resolverMutation = useResolverAlerta()
  const evaluarMutation = useEvaluarAlertas()
  
  const temporadaActiva = temporadas?.find(t => t.estado === 'activa')

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 animate-fade-in pb-10">
      {/* Welcome & Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Panel de Control
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight leading-none">
            Hola, <span className="text-primary italic">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-base text-text-dim max-w-md">
            {liga 
              ? `Gestionando los destinos de ` 
              : 'Bienvenido a la plataforma central de ligas. '}
            {liga && <span className="text-text-primary font-bold">{liga.nombre}</span>}
          </p>
        </div>
        
        <div className="flex shrink-0">
          <Button 
            onClick={() => setShowNewLiga(true)} 
            className="w-full sm:w-auto h-12 px-6 bg-primary text-secondary font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 mr-2 stroke-[3]" /> 
            {liga ? 'Nueva Liga' : 'Crear mi primera Liga'}
          </Button>
        </div>
      </div>

      {!liga ? (
        <div className="py-20 text-center glass-heavy rounded-[2rem] border border-white/5 space-y-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 group-hover:rotate-6 transition-transform duration-500 border border-primary/20 shadow-glow-primary">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
            <div className="max-w-sm mx-auto px-6">
              <h2 className="text-2xl font-heading font-bold mb-3 tracking-tight">Comienza tu Legado</h2>
              <p className="text-sm text-text-dim mb-8 leading-relaxed">No hemos encontrado ninguna liga asociada a tu cuenta. Crea tu primera liga para empezar a gestionar torneos, equipos y jugadores.</p>
              <Button onClick={() => setShowNewLiga(true)} size="lg" className="w-full shadow-lg shadow-primary/20 h-14">
                Crear mi primera Liga
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon={Shield} 
              value={liga?.nombre || '—'} 
              label="Liga Activa" 
              className="bg-primary/5 border-primary/10"
            />
            <StatCard 
              icon={Trophy} 
              value={temporadaActiva?.nombre || 'Sin Temporada'} 
              label="Edición Actual" 
              className="bg-secondary/5 border-secondary/10"
            />
            <StatCard 
              icon={Swords} 
              value={dashStats?.partidos_finalizados ?? '0'} 
              label="Partidos Jugados" 
              className="bg-warning/5 border-warning/10"
            />
            <StatCard 
              icon={DollarSign} 
              value={dashStats?.cobros_pendientes ?? '0'} 
              label="Cobros Pendientes" 
              className="bg-danger/5 border-danger/10"
            />
          </div>

          {/* Alerts Center */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-text-dim uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-8 h-px bg-border-default" /> 
                Alertas Críticas
                <span className="w-8 h-px bg-border-default" />
              </h2>
              <button 
                onClick={async () => {
                  try {
                    await evaluarMutation.mutateAsync()
                    toast.success('Evaluación de alertas completada')
                  } catch (err) {
                    toast.error('Error al evaluar alertas')
                  }
                }}
                disabled={evaluarMutation.isPending}
                className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-all uppercase tracking-widest disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${evaluarMutation.isPending ? 'animate-spin' : ''}`} />
                Sincronizar
              </button>
            </div>

            {alerts?.length > 0 ? (
              <div className="grid gap-3">
                {alerts.map(alert => (
                  <GlassCard key={alert.id} className="!p-4 border-l-4 border-l-danger bg-danger/5 group hover:bg-danger/10 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0 border border-danger/20">
                          <AlertCircle className="w-5 h-5 text-danger" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary mb-1">{alert.mensaje}</p>
                          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
                            {alert.tipo.replace(/_/g, ' ')} • {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => resolverMutation.mutate(alert.id)}
                        className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-dim hover:text-primary transition-all shrink-0 border border-border-subtle"
                        title="Marcar como resuelta"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center glass-heavy rounded-3xl border border-white/5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <Bell className="w-6 h-6 text-primary opacity-40" />
                </div>
                <p className="text-xs font-bold text-text-dim uppercase tracking-widest">No hay alertas activas</p>
              </div>
            )}
          </div>

          {/* Quick Actions Header */}
          <div className="pt-4">
            <h2 className="text-xs font-black text-text-dim uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <span className="w-8 h-px bg-border-default" /> 
              Acciones Estratégicas
              <span className="w-8 h-px bg-border-default flex-1" />
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { to: '/admin/torneo',   icon: Shield,     label: 'Arquitectura', sub: 'Gestionar Torneo', color: 'text-primary',   bg: 'bg-primary/5',   border: 'hover:border-primary/40' },
                { to: '/admin/roster',   icon: Users,      label: 'Equipos',      sub: 'Gestionar Roster', color: 'text-secondary', bg: 'bg-secondary/5', border: 'hover:border-secondary/40' },
                { to: '/admin/partidos', icon: Swords,     label: 'Partidos',     sub: 'Cargar Resultados',color: 'text-warning',   bg: 'bg-warning/5',   border: 'hover:border-warning/40' },
                { to: '/admin/premios',  icon: Trophy,     label: 'Premios',      sub: 'Escrutinio Final', color: 'text-accent-gold',bg: 'bg-accent-gold/5',border: 'hover:border-accent-gold/40' },
              ].map(a => (
                <Link key={a.to} to={a.to}
                  className={`flex flex-col items-center sm:items-start gap-4 p-6 rounded-[1.5rem] bg-bg-surface border border-border-subtle ${a.border} transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md`}>
                  <div className={`absolute top-0 right-0 w-20 h-20 ${a.bg} blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className={`w-12 h-12 rounded-2xl ${a.bg} flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                    <a.icon className={`w-6 h-6 ${a.color}`} />
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-heading font-black tracking-tight text-text-primary mb-0.5">{a.label}</p>
                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <NewLigaModal open={showNewLiga} onClose={() => setShowNewLiga(false)} />
    </div>
  )
}

function NewLigaModal({ open, onClose }) {
  const [form, setForm] = useState({ nombre: '', slug: '', tipo_futbol: 'f7', zona: '', monto_inscripcion: 0 })
  const mutation = useCreateLiga()
  
  const generateSlug = (val) => val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync(form)
    onClose()
    setForm({ nombre: '', slug: '', tipo_futbol: 'f7', zona: '', monto_inscripcion: 0 })
  }

  return (
    <Modal open={open} onClose={onClose} title="Crear Nueva Liga">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-medium text-text-dim">
          Nombre de la Liga
          <input type="text" required value={form.nombre} 
            onChange={e => setForm({ ...form, nombre: e.target.value, slug: generateSlug(e.target.value) })}
            placeholder="Ej: Cancha Libre Palermo"
            className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all" />
        </label>

        <label className="block text-xs font-medium text-text-dim">
          URL (Slug)
          <div className="flex items-center gap-1 mt-1 group">
            <span className="text-xs text-text-dim group-focus-within:text-primary transition-colors">marios.agency/</span>
            <input type="text" required value={form.slug} onChange={e => setForm({ ...form, slug: generateSlug(e.target.value) })}
              className="flex-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all font-mono" />
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-text-dim">
            Tipo de Fútbol
            <select value={form.tipo_futbol} onChange={e => setForm({ ...form, tipo_futbol: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all appearance-none">
              <option value="f5">Fútbol 5</option>
              <option value="f6">Fútbol 6</option>
              <option value="f7">Fútbol 7</option>
              <option value="f9">Fútbol 9</option>
              <option value="f11">Fútbol 11</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-text-dim">
            Zona / Ubicación
            <input type="text" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })}
              placeholder="Ej: Buenos Aires"
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all" />
          </label>
          <label className="block text-xs font-medium text-text-dim">
            Valor Inscripción ($)
            <input type="number" value={form.monto_inscripcion} onChange={e => setForm({ ...form, monto_inscripcion: e.target.value })}
              placeholder="Ej: 5000"
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all font-mono" />
          </label>
        </div>

        <Button type="submit" loading={mutation.isPending} className="w-full mt-4">
          Crear mi Liga
        </Button>
      </form>
    </Modal>
  )
}
