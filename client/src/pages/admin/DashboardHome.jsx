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
import Loader from '../../components/ui/Loader'

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

  if (isLoading) return <Loader text="Cargando panel de control..." className="py-20" />

  return (
    <div className="max-w-6xl mx-auto space-y-10 sm:space-y-16 animate-fade-in pb-20 px-4 sm:px-0">
      {/* Welcome & Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b-4 border-primary/20 pb-12 relative">
        <div className="absolute -left-10 top-0 w-1 h-full bg-primary/10 skew-x-[-15deg] hidden xl:block" />
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary text-bg-deep text-[10px] font-black uppercase tracking-[0.3em] skew-x-[-15deg]">
            <span className="skew-x-[15deg] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bg-deep animate-pulse" /> 
              System Operational: Level 1
            </span>
          </div>
          <div className="relative">
            <h1 className="text-6xl sm:text-8xl font-heading font-black tracking-normal leading-[0.9] uppercase italic text-white mix-blend-difference">
              HOLA, <span className="text-primary">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-xl text-text-dim max-w-xl font-bold uppercase tracking-normal mt-4 border-l-4 border-primary pl-6 py-2">
              {liga 
                ? `COMANDANDO LA LIGA ` 
                : 'PREPARADO PARA EL DESPEGUE. '}
              {liga && <span className="text-primary italic">{liga.nombre}</span>}
            </p>
          </div>
        </div>
        
        <div className="flex shrink-0">
          <Button 
            variant="primary"
            size="lg"
            onClick={() => setShowNewLiga(true)} 
            className="h-20 px-12 text-xl shadow-[0_20px_50px_rgba(206,222,11,0.2)]"
          >
            <Plus className="w-8 h-8 mr-3 stroke-[3]" /> 
            {liga ? 'Nueva Liga' : 'Crear mi primera Liga'}
          </Button>
        </div>
      </div>

      {!liga ? (
        <div className="py-24 text-center bg-bg-surface rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-28 h-28 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-3 group-hover:rotate-6 transition-transform duration-500 border-2 border-primary/20 shadow-glow-primary">
              <Trophy className="w-14 h-14 text-primary" />
            </div>
            <div className="max-w-md mx-auto px-6">
              <h2 className="text-3xl font-heading font-black mb-4 tracking-wide uppercase italic leading-[1.1] pt-1">Comienza tu Legado</h2>
              <p className="text-base text-text-dim mb-10 leading-relaxed font-medium">No hemos encontrado ninguna liga asociada a tu cuenta. Crea tu primera liga para empezar a gestionar torneos, equipos y jugadores con estilo profesional.</p>
              <Button onClick={() => setShowNewLiga(true)} size="lg" className="w-full shadow-2xl shadow-primary/30 h-16 text-lg font-black italic uppercase italic tracking-wide">
                Crear mi primera Liga
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
              icon={Shield} 
              value={liga?.nombre || '—'} 
              label="Liga Activa" 
            />
            <StatCard 
              icon={Trophy} 
              value={temporadaActiva?.nombre || 'Sin Temporada'} 
              label="Edición Actual" 
            />
            <StatCard 
              icon={Swords} 
              value={dashStats?.partidos_finalizados ?? '0'} 
              label="Partidos Jugados" 
            />
            <StatCard 
              icon={DollarSign} 
              value={dashStats?.cobros_pendientes ?? '0'} 
              label="Alertas de Pago" 
              isAlert={Number(dashStats?.cobros_pendientes) > 0}
            />
          </div>

          {/* Alerts Center */}
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-danger skew-x-[-15deg]" />
                <h2 className="text-xs font-black text-text-dim uppercase tracking-[0.4em]">
                  Alertas Críticas
                </h2>
              </div>
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
                className="flex items-center gap-2 text-[10px] font-black text-primary hover:text-white transition-all uppercase tracking-widest disabled:opacity-50 group"
              >
                <RefreshCw className={`w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ${evaluarMutation.isPending ? 'animate-spin' : ''}`} />
                Sincronizar Datos
              </button>
            </div>

            {alerts?.length > 0 ? (
              <div className="grid gap-4">
                {alerts.map(alert => (
                  <GlassCard key={alert.id} className="!p-0 border-none ring-1 ring-white/5 bg-bg-surface group hover:ring-danger/40 transition-all relative overflow-hidden rounded-2xl">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-danger opacity-80" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6">
                      <div className="flex gap-5 items-start">
                        <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center shrink-0 border border-danger/20 shadow-lg group-hover:scale-110 transition-transform">
                          <AlertCircle className="w-6 h-6 text-danger" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-black text-text-primary italic uppercase tracking-normal leading-tight">{alert.mensaje}</p>
                          <div className="flex flex-wrap items-center gap-3">
                             <span className="text-[9px] font-black bg-danger/10 text-danger px-2 py-0.5 rounded uppercase tracking-widest">
                               {alert.tipo.replace(/_/g, ' ')}
                             </span>
                             <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest flex items-center gap-1">
                               <RefreshCw className="w-2.5 h-2.5" /> {new Date(alert.created_at).toLocaleTimeString()}
                             </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => resolverMutation.mutate(alert.id)}
                        className="w-full sm:w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-dim hover:text-primary hover:bg-primary/10 transition-all shrink-0 border border-white/5 active:scale-95 shadow-sm"
                        title="Marcar como resuelta"
                      >
                        <CheckCircle className="w-6 h-6" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-bg-surface rounded-[2rem] border border-white/5 shadow-inner">
                <div className="w-16 h-16 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Bell className="w-8 h-8 text-primary opacity-20" />
                </div>
                <p className="text-[11px] font-black text-text-dim uppercase tracking-[0.3em] italic">Sin incidencias detectadas</p>
              </div>
            )}
          </div>

          {/* Strategic Actions Header */}
          <div className="space-y-8 pt-8">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-secondary skew-x-[-15deg]" />
              <h2 className="text-xs font-black text-text-dim uppercase tracking-[0.4em]">
                Misiones Críticas
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { to: '/admin/torneo',   icon: Shield,     label: 'Arquitectura', sub: 'Torneo', color: 'text-primary',   bg: 'bg-primary/5',   border: 'hover:ring-primary/40' },
                { to: '/admin/roster',   icon: Users,      label: 'Equipos',      sub: 'Roster', color: 'text-secondary', bg: 'bg-secondary/5', border: 'hover:ring-secondary/40' },
                { to: '/admin/partidos', icon: Swords,     label: 'Partidos',     sub: 'Resultados',color: 'text-warning',   bg: 'bg-warning/5',   border: 'hover:ring-warning/40' },
                { to: '/admin/premios',  icon: Trophy,     label: 'Premios',      sub: 'Escrutinio', color: 'text-accent-gold',bg: 'bg-accent-gold/5',border: 'hover:ring-accent-gold/40' },
              ].map(a => (
                <Link key={a.to} to={a.to}
                  className={`flex flex-col gap-6 p-8 rounded-[2rem] bg-bg-surface ring-1 ring-white/5 ${a.border} transition-all duration-500 group relative overflow-hidden shadow-xl hover:-translate-y-2`}>
                  <div className={`absolute -bottom-8 -right-8 w-32 h-32 ${a.bg} blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  
                  <div className={`w-16 h-16 rounded-[1.5rem] ${a.bg} flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <a.icon className={`w-8 h-8 ${a.color}`} />
                  </div>
                  
                  <div>
                    <p className="text-2xl font-heading font-black tracking-wide text-text-primary uppercase italic leading-none mb-2">{a.label}</p>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] text-text-dim font-black uppercase tracking-[0.2em]">{a.sub}</p>
                       <RefreshCw className="w-3 h-3 text-text-dim group-hover:text-primary group-hover:rotate-180 transition-all duration-700" />
                    </div>
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
            <span className="text-xs text-text-dim group-focus-within:text-primary transition-colors">
              {(import.meta.env.VITE_API_DOM || 'canchalibre.app/').replace(/^https?:\/\//, '').replace(/\/$/, '')}/liga/
            </span>
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
