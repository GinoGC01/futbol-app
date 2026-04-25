import { useState } from 'react'
import { useLigas, useTemporadas, usePremiosAdmin, useCrearPremio } from '../../hooks/useAdmin'
import { adminService } from '../../services/adminService'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Award, Plus, Search, Trophy, BarChart3, Crown } from 'lucide-react'

import { useLigaActiva } from '../../context/LigaContext'

export default function AwardScrutinyTool() {
  const { liga } = useLigaActiva()
  const { data: temporadas } = useTemporadas(liga?.id)
  const temporadaActiva = temporadas?.find(t => t.estado === 'activa' || t.estado === 'finalizada')

  const { data: premios, isLoading } = usePremiosAdmin(temporadaActiva?.id)
  const [showNewPremio, setShowNewPremio] = useState(false)
  const { data: tree } = useTemporadaTree(temporadaActiva?.id)
  const [analisis, setAnalisis] = useState(null)
  const [loadingAnalisis, setLoadingAnalisis] = useState(false)
  const [selectedPremio, setSelectedPremio] = useState(null)

  async function runAnalisis(premioId) {
    setLoadingAnalisis(true)
    setSelectedPremio(premioId)
    try {
      const data = await adminService.sugerirGanadores(premioId)
      setAnalisis(data)
    } catch (err) {
      setAnalisis({ candidatos: [], nota: err.message })
    }
    setLoadingAnalisis(false)
  }

  async function togglePub(premioId, publicado) {
    await adminService.togglePublicacion(premioId, publicado)
  }

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Premios y Escrutinio</h1>
        <Button variant="gold" size="sm" onClick={() => setShowNewPremio(true)}>
          <Plus className="w-4 h-4" /> Nuevo Premio
        </Button>
      </div>

      {premios?.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {premios.map(p => (
            <GlassCard key={p.id} className={p.publicado ? '!border-accent-gold/20' : ''}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  p.publicado ? 'bg-accent-gold/10' : 'bg-secondary/10'
                }`}>
                  <Award className={`w-5 h-5 ${p.publicado ? 'text-accent-gold' : 'text-secondary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold truncate">{p.nombre}</p>
                  <p className="text-[11px] text-text-dim">{p.criterio?.replace('_', ' ')} · {p.categoria}</p>
                </div>
                <Badge status={p.publicado ? 'gold' : 'borrador'} label={p.publicado ? 'Público' : 'Privado'} />
              </div>

              {/* Winners */}
              {p.ganadores?.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {p.ganadores.map(g => (
                    <div key={g.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg-deep/50">
                      <Crown className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {g.jugador ? `${g.jugador.nombre} ${g.jugador.apellido}` : g.equipo?.nombre}
                      </span>
                      {g.valor_record && <span className="text-[11px] text-accent-gold ml-auto shrink-0">{g.valor_record}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => runAnalisis(p.id)} loading={loadingAnalisis && selectedPremio === p.id}>
                  <BarChart3 className="w-3.5 h-3.5" /> Analizar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => togglePub(p.id, !p.publicado)}>
                  {p.publicado ? 'Ocultar' : 'Publicar'}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState icon={Award} title="Sin premios" description="Configurá los premios de la temporada."
          action={<Button variant="gold" size="sm" onClick={() => setShowNewPremio(true)}>Crear Premio</Button>} />
      )}

      {/* Analisis Modal */}
      <Modal open={!!analisis} onClose={() => setAnalisis(null)} title="Escrutinio Fino" size="lg">
        {analisis?.nota && <p className="text-sm text-text-dim mb-4">{analisis.nota}</p>}
        {analisis?.candidatos?.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2">#</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2">Candidato</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2">Equipo</th>
                  <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {analisis.candidatos.slice(0, 10).map((c, i) => (
                  <tr key={i} className={`border-b border-border-subtle ${i === 0 ? 'bg-accent-gold/[0.04]' : ''}`}>
                    <td className={`py-2 font-bold ${i === 0 ? 'text-accent-gold' : 'text-text-dim'}`}>{i + 1}</td>
                    <td className="py-2 font-medium">{c.nombre || c.equipo}</td>
                    <td className="py-2 text-text-secondary text-xs">{c.equipo_nombre || c.equipo || '—'}</td>
                    <td className="py-2 text-xs text-accent-gold">{c.valor_record}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-dim text-center py-6">Sin candidatos para este criterio.</p>
        )}
      </Modal>

      <NewPremioModal open={showNewPremio} onClose={() => setShowNewPremio(false)} temporadaId={temporadaActiva?.id} fases={tree?.fases} />
    </div>
  )
}

function NewPremioModal({ open, onClose, temporadaId, fases }) {
  const [form, setForm] = useState({ nombre: '', criterio: 'goleador', categoria: 'jugador', descripcion: '', fase_id: '' })
  const mutation = useCrearPremio()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const payload = { temporada_id: temporadaId, ...form }
    if (!payload.fase_id) delete payload.fase_id
    await mutation.mutateAsync(payload)
    onClose()
    setForm({ nombre: '', criterio: 'goleador', categoria: 'jugador', descripcion: '', fase_id: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Premio">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Bota de Oro" required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <select value={form.criterio} onChange={set('criterio')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
          <option value="goleador">Goleador</option>
          <option value="valla_menos_vencida">Valla Menos Vencida</option>
          <option value="valla_invicta">Valla Invicta</option>
          <option value="fair_play">Fair Play</option>
          <option value="posicion_tabla">Posición en Tabla</option>
          <option value="personalizado">Personalizado</option>
        </select>
        <select value={form.categoria} onChange={set('categoria')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
          <option value="jugador">Jugador</option>
          <option value="equipo">Equipo</option>
        </select>
        <select value={form.fase_id} onChange={set('fase_id')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
          <option value="">Toda la Temporada (Acumulado)</option>
          {fases?.map(f => (
            <option key={f.id} value={f.id}>Solo Fase: {f.nombre}</option>
          ))}
        </select>
        <textarea value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción (opcional)" rows={2}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all resize-none" />
        <Button type="submit" variant="gold" loading={mutation.isPending} className="w-full">Crear Premio</Button>
      </form>
    </Modal>
  )
}
