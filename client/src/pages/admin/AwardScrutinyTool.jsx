import { useState, useEffect } from 'react'
import { 
  useLigas, 
  useTemporadas, 
  usePremiosAdmin, 
  useCrearPremio, 
  useTemporadaTree, 
  useTogglePublicacionPremio,
  useAsignarGanador 
} from '../../hooks/useAdmin'
import { adminService } from '../../services/adminService'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Award, Plus, Search, Trophy, BarChart3, Crown, ChevronDown, Check } from 'lucide-react'

import { useLigaActiva } from '../../context/LigaContext'
import Loader from '../../components/ui/Loader'
import { toast } from 'sonner'

export default function AwardScrutinyTool() {
  const { liga } = useLigaActiva()
  const { data: temporadas } = useTemporadas(liga?.id)
  
  // Estado para la temporada seleccionada
  const [selectedTemporadaId, setSelectedTemporadaId] = useState('')

  // Efecto para autoseleccionar la temporada activa/finalizada al cargar
  useEffect(() => {
    if (temporadas?.length > 0 && !selectedTemporadaId) {
      const active = temporadas.find(t => t.estado === 'activa') || temporadas[0]
      setSelectedTemporadaId(active.id)
    }
  }, [temporadas, selectedTemporadaId])

  const { data: premios, isLoading } = usePremiosAdmin(selectedTemporadaId)
  const [showNewPremio, setShowNewPremio] = useState(false)
  const { data: tree } = useTemporadaTree(selectedTemporadaId)
  const [analisis, setAnalisis] = useState(null)
  const [loadingAnalisis, setLoadingAnalisis] = useState(false)
  const [activePremio, setActivePremio] = useState(null)

  async function runAnalisis(premio) {
    setLoadingAnalisis(true)
    setActivePremio(premio)
    try {
      const data = await adminService.sugerirGanadores(premio.id)
      setAnalisis(data)
    } catch (err) {
      toast.error('Error al analizar candidatos')
      setAnalisis({ candidatos: [], nota: err.message })
    }
    setLoadingAnalisis(false)
  }

  const togglePubMutation = useTogglePublicacionPremio()
  const asignarMutation = useAsignarGanador()

  async function togglePub(premioId, publicado) {
    try {
      await togglePubMutation.mutateAsync({ id: premioId, publicado })
      toast.success(publicado ? 'Premio publicado' : 'Premio ocultado')
    } catch (err) {
      toast.error('Error al actualizar visibilidad')
    }
  }

  async function asignar(candidato) {
    if (!activePremio) return
    try {
      await asignarMutation.mutateAsync({
        premioId: activePremio.id,
        equipo_id: candidato.equipo_id,
        jugador_id: candidato.jugador_id,
        valor_record: candidato.valor_record,
        compartido: false
      })
      toast.success('Ganador asignado correctamente')
      setAnalisis(null)
      setActivePremio(null)
    } catch (err) {
      toast.error('Error al asignar ganador')
    }
  }

  if (isLoading && !premios) return <Loader text="Cargando premios..." className="py-20" />

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Premios y Escrutinio</h1>
          <p className="text-sm text-text-dim">Gestioná los reconocimientos de la temporada.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <select 
              value={selectedTemporadaId} 
              onChange={(e) => setSelectedTemporadaId(e.target.value)}
              className="pl-3 pr-8 py-2 bg-bg-deep border border-border-default rounded-lg text-xs font-medium appearance-none outline-none focus:border-accent-gold transition-colors"
            >
              {temporadas?.map(t => (
                <option key={t.id} value={t.id}>Temporada: {t.nombre}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          </div>

          <Button variant="gold" size="sm" onClick={() => setShowNewPremio(true)} disabled={!selectedTemporadaId}>
            <Plus className="w-4 h-4" /> Nuevo
          </Button>
        </div>
      </div>

      {premios?.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {premios.map(p => (
            <GlassCard key={p.id} className={`${p.publicado ? '!border-accent-gold/20 bg-accent-gold/[0.02]' : ''} flex flex-col`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  p.publicado ? 'bg-accent-gold/10' : 'bg-secondary/10'
                }`}>
                  <Award className={`w-5 h-5 ${p.publicado ? 'text-accent-gold' : 'text-secondary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-heading font-semibold truncate">{p.nombre}</p>
                    <Badge status={p.publicado ? 'gold' : 'borrador'} label={p.publicado ? 'Público' : 'Privado'} size="xs" />
                  </div>
                  <p className="text-[11px] text-text-dim uppercase tracking-wider font-medium">
                    {p.criterio?.replace('_', ' ')} · {p.categoria}
                  </p>
                </div>
              </div>

              {/* Winners Display */}
              <div className="flex-1 space-y-2 mb-4">
                {p.ganadores?.length > 0 ? (
                  p.ganadores.map(g => (
                    <div key={g.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-bg-deep/50 border border-border-subtle">
                      <Crown className="w-4 h-4 text-accent-gold shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {g.jugador ? `${g.jugador.nombre} ${g.jugador.apellido}` : g.equipo?.nombre}
                        </p>
                        {g.valor_record && <p className="text-[10px] text-accent-gold font-medium">{g.valor_record}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center border border-dashed border-border-default rounded-xl">
                    <p className="text-xs text-text-dim italic">Sin ganador asignado</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => runAnalisis(p)} 
                  loading={loadingAnalisis && activePremio?.id === p.id}
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> 
                  {p.ganadores?.length > 0 ? 'Recalcular' : 'Escrutinio'}
                </Button>
                <Button 
                  variant={p.publicado ? 'ghost' : 'outline'} 
                  size="sm" 
                  onClick={() => togglePub(p.id, !p.publicado)}
                >
                  {p.publicado ? 'Ocultar' : 'Publicar'}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Award} 
          title="Sin premios configurados" 
          description="Aún no has definido premios para esta temporada. Agregá categorías como Goleador, Valla Invicta, etc."
          action={<Button variant="gold" size="sm" onClick={() => setShowNewPremio(true)}>Configurar Primer Premio</Button>} 
        />
      )}

      {/* Analisis Modal */}
      <Modal 
        open={!!analisis} 
        onClose={() => { setAnalisis(null); setActivePremio(null); }} 
        title={`Escrutinio: ${activePremio?.nombre}`} 
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-accent-gold/5 border border-accent-gold/10 rounded-xl">
            <p className="text-xs text-accent-gold font-medium mb-1 flex items-center gap-1.5">
              <Trophy className="w-3 h-3" /> Criterio: {activePremio?.criterio?.replace(/_/g, ' ')}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {analisis?.nota || 'A continuación se muestran los candidatos ordenados según el algoritmo de la liga.'}
            </p>
          </div>

          {analisis?.candidatos?.length > 0 ? (
            <div className="overflow-hidden border border-border-subtle rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-deep/50 border-b border-border-subtle">
                    <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-3 px-4">#</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-3 px-4">Candidato</th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-text-dim py-3 px-4">Detalle</th>
                    <th className="text-right text-[11px] uppercase tracking-wider text-text-dim py-3 px-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {analisis.candidatos.slice(0, 10).map((c, i) => (
                    <tr key={i} className={`group hover:bg-white/[0.02] transition-colors ${i === 0 ? 'bg-accent-gold/[0.03]' : ''}`}>
                      <td className="py-3 px-4 font-bold text-text-dim">
                        {i === 0 ? <Crown className="w-4 h-4 text-accent-gold" /> : i + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-primary">{c.nombre || c.equipo}</div>
                        <div className="text-[10px] text-text-dim uppercase">{c.equipo_nombre || c.equipo || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-accent-gold">
                        {c.valor_record}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="gold" 
                          size="xs" 
                          onClick={() => asignar(c)}
                          loading={asignarMutation.isPending}
                        >
                          Elegir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border-default rounded-xl">
              <p className="text-sm text-text-dim">No hay candidatos que cumplan los requisitos mínimos.</p>
            </div>
          )}

          {activePremio?.criterio === 'personalizado' && (
            <div className="pt-4 border-t border-border-subtle text-center">
              <p className="text-xs text-text-dim mb-3">Este premio es manual. Podés asignar cualquier jugador/equipo desde sus perfiles.</p>
            </div>
          )}
        </div>
      </Modal>

      <NewPremioModal 
        open={showNewPremio} 
        onClose={() => setShowNewPremio(false)} 
        temporadaId={selectedTemporadaId} 
        fases={tree?.fases} 
      />
    </div>
  )
}

function NewPremioModal({ open, onClose, temporadaId, fases }) {
  const [form, setForm] = useState({ nombre: '', criterio: 'goleador', categoria: 'jugador', descripcion: '', fase_id: '' })
  const mutation = useCrearPremio()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!temporadaId) {
      toast.error('Seleccioná una temporada primero')
      return
    }
    
    try {
      const payload = { temporada_id: temporadaId, ...form }
      if (!payload.fase_id) delete payload.fase_id
      
      await mutation.mutateAsync(payload)
      toast.success('Premio creado exitosamente')
      onClose()
      setForm({ nombre: '', criterio: 'goleador', categoria: 'jugador', descripcion: '', fase_id: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear el premio')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Reconocimiento">
      <form onSubmit={submit} className="flex flex-col gap-5 py-2">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-dim ml-1">Nombre del Premio</label>
          <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Bota de Oro, Valla Invicta..." required
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-accent-gold transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-dim ml-1">Criterio</label>
            <div className="relative">
              <select value={form.criterio} onChange={set('criterio')}
                className="w-full pl-4 pr-10 py-3 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-accent-gold transition-all appearance-none">
                <option value="goleador">Goleador</option>
                <option value="valla_menos_vencida">Valla Menos Vencida</option>
                <option value="valla_invicta">Valla Invicta</option>
                <option value="asistencia">Máximo Asistente</option>
                <option value="fair_play">Fair Play</option>
                <option value="posicion_tabla">Posición en Tabla</option>
                <option value="personalizado">Personalizado</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-dim ml-1">Categoría</label>
            <div className="relative">
              <select value={form.categoria} onChange={set('categoria')}
                className="w-full pl-4 pr-10 py-3 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-accent-gold transition-all appearance-none">
                <option value="jugador">Jugador</option>
                <option value="equipo">Equipo</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-dim ml-1">Alcance (Fase)</label>
          <div className="relative">
            <select value={form.fase_id} onChange={set('fase_id')}
              className="w-full pl-4 pr-10 py-3 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-accent-gold transition-all appearance-none">
              <option value="">Toda la Temporada (Acumulado)</option>
              {fases?.map(f => (
                <option key={f.id} value={f.id}>Solo Fase: {f.nombre}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-dim ml-1">Descripción</label>
          <textarea value={form.descripcion} onChange={set('descripcion')} placeholder="Detalles adicionales sobre el premio..." rows={2}
            className="w-full px-4 py-3 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-accent-gold transition-all resize-none" />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="gold" loading={mutation.isPending} className="w-full py-6 rounded-2xl shadow-lg shadow-accent-gold/10">
            Crear Premio
          </Button>
        </div>
      </form>
    </Modal>
  )
}

