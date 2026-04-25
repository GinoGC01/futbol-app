import { useState } from 'react'
import { useLigas, useTemporadas, useCreateLiga, useDashboardStats } from '../../hooks/useAdmin'
import { useAuth } from '../../hooks/useAuth'
import StatCard from '../../components/ui/StatCard'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Shield, Users, Swords, DollarSign, Plus, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useLigaActiva } from '../../context/LigaContext'

export default function DashboardHome() {
  const { user } = useAuth()
  const { liga, isLoading } = useLigaActiva()
  const [showNewLiga, setShowNewLiga] = useState(false)
  
  const { data: temporadas } = useTemporadas(liga?.id)
  const { data: dashStats } = useDashboardStats(liga?.id)
  const temporadaActiva = temporadas?.find(t => t.estado === 'activa')

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">
            Hola, <span className="text-primary">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-sm text-text-dim">
            {liga ? `Administrando: ${liga.nombre}` : 'Bienvenido a la plataforma'}
          </p>
        </div>
        <Button onClick={() => setShowNewLiga(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" /> {liga ? 'Crear otra Liga' : 'Crear mi primera Liga'}
        </Button>
      </div>

      {!liga ? (
        <div className="py-20 text-center glass rounded-3xl border border-white/5 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <div className="max-w-sm mx-auto">
            <h2 className="text-xl font-heading font-bold mb-2">Comienza tu Legado</h2>
            <p className="text-sm text-text-dim mb-8">No hemos encontrado ninguna liga asociada a tu cuenta. Crea tu primera liga para empezar a gestionar torneos y equipos.</p>
            <Button onClick={() => setShowNewLiga(true)} size="lg" className="shadow-lg shadow-primary/20">
              Crear mi primera Liga
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Shield} value={liga?.nombre || '—'} label="Liga activa" />
            <StatCard icon={Users} value={temporadaActiva?.nombre || 'Sin temporada'} label="Temporada" />
            <StatCard icon={Swords} value={dashStats?.partidos_finalizados ?? '—'} label="Partidos jugados" />
            <StatCard icon={DollarSign} value={dashStats?.cobros_pendientes ?? '—'} label="Cobros pendientes" />
          </div>

          {/* Quick actions */}
          <GlassCard hover={false}>
            <h2 className="font-heading font-semibold mb-4">Acciones rápidas</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { to: '/admin/torneo',  icon: Shield,      label: 'Configurar Torneo', color: 'text-primary' },
                { to: '/admin/roster',  icon: Users,        label: 'Gestionar Equipos',  color: 'text-secondary' },
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
            placeholder="Ej: Liga Amateur Palermo"
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
