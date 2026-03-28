import { useState } from 'react'
import { useLigas, useTemporadas, useTemporadaTree, useCreateTemporada, useCreateFase, useCreateJornadas, useFormatos, useUpdateTemporada } from '../../hooks/useAdmin'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Trophy, Plus, ChevronRight, Layers, Calendar, Lock } from 'lucide-react'

export default function TournamentArchitect() {
  const { data: ligas } = useLigas()
  const liga = ligas?.[0]
  const { data: temporadas, isLoading } = useTemporadas(liga?.id)
  const { data: formatos } = useFormatos()
  const [selectedTemp, setSelectedTemp] = useState(null)
  const { data: tree } = useTemporadaTree(selectedTemp)

  const [showNewTemp, setShowNewTemp] = useState(false)
  const [showEditTemp, setShowEditTemp] = useState(false)
  const [showNewFase, setShowNewFase] = useState(false)
  const [showNewJornadas, setShowNewJornadas] = useState(false)
  const [selectedFase, setSelectedFase] = useState(null)

  const isVault = tree?.estado === 'finalizada'

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Arquitecto de Torneo</h1>
        <Button variant="outline" size="sm" onClick={() => setShowNewTemp(true)}>
          <Plus className="w-4 h-4" /> Nueva Temporada
        </Button>
      </div>

      {/* Temporada selector */}
      {temporadas?.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {temporadas.map(t => (
            <button key={t.id} onClick={() => setSelectedTemp(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${
                selectedTemp === t.id ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-dim border-border-subtle hover:border-border-default'
              }`}>
              <Trophy className="w-4 h-4" /> {t.nombre} <Badge status={t.estado} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon={Trophy} title="Sin temporadas" description="Creá tu primera temporada para empezar a organizar." action={<Button size="sm" onClick={() => setShowNewTemp(true)}>Crear Temporada</Button>} />
      )}

      {/* Tree display */}
      {tree && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="font-heading font-semibold text-lg">{tree.nombre}</h2>
                <div className="flex items-center gap-2 text-xs text-text-dim">
                  <span>Estado: <Badge status={tree.estado} /></span>
                  {tree.fecha_inicio && <span>• {new Date(tree.fecha_inicio).toLocaleDateString()}</span>}
                  {tree.fecha_fin && <span>al {new Date(tree.fecha_fin).toLocaleDateString()}</span>}
                </div>
              </div>
              {!isVault && (
                <Button variant="ghost" size="xs" onClick={() => setShowEditTemp(true)} className="text-text-dim hover:text-primary absolute right-4">
                  Editar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {tree.estado === 'borrador' && (
                <Button variant="primary" size="xs" onClick={() => setShowEditTemp(true)} className="bg-primary hover:bg-primary/90 text-secondary font-bold px-4">
                  Abrir Temporada
                </Button>
              )}
              {isVault && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-dim text-danger text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" /> MODO BÓVEDA
                </div>
              )}
            </div>
          </div>

          {/* Fases */}
          {tree.fases?.length > 0 ? tree.fases.map(fase => (
            <div key={fase.id} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-deep/50 mb-2">
                <Layers className="w-4 h-4 text-secondary" />
                <span className="font-medium text-sm">{fase.nombre}</span>
                <span className="text-xs text-text-dim">({fase.tipo?.replace('_', ' ')})</span>
                <ChevronRight className="w-3 h-3 text-text-dim ml-auto" />
                {!isVault && (
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedFase(fase.id); setShowNewJornadas(true) }}>
                    <Plus className="w-3 h-3" /> Jornadas
                  </Button>
                )}
              </div>
              {fase.jornadas?.length > 0 && (
                <div className="ml-6 flex flex-wrap gap-2">
                  {fase.jornadas.map(j => (
                    <div key={j.id} className="px-3 py-1.5 rounded-lg bg-bg-surface border border-border-subtle text-xs flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-text-dim" />
                      <span>Fecha {j.numero}</span>
                      <Badge status={j.estado} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-6">
              <p className="text-sm text-text-dim mb-3">Sin fases aún</p>
              {!isVault && <Button variant="outline" size="sm" onClick={() => setShowNewFase(true)}><Plus className="w-3 h-3" /> Crear Fase</Button>}
            </div>
          )}

          {tree.fases?.length > 0 && !isVault && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewFase(true)}>
              <Plus className="w-3 h-3" /> Agregar Fase
            </Button>
          )}
        </GlassCard>
      )}

      {/* Modals */}
      <NewTemporadaModal open={showNewTemp} onClose={() => setShowNewTemp(false)} ligaId={liga?.id} formatos={formatos} />
      {tree && <EditTemporadaModal open={showEditTemp} onClose={() => setShowEditTemp(false)} temporada={tree} />}
      <NewFaseModal open={showNewFase} onClose={() => setShowNewFase(false)} temporadaId={selectedTemp} />
      <NewJornadasModal open={showNewJornadas} onClose={() => setShowNewJornadas(false)} faseId={selectedFase} />
    </div>
  )
}

function NewTemporadaModal({ open, onClose, ligaId, formatos }) {
  const [form, setForm] = useState({ nombre: '', formato_tipo: '', fecha_inicio: '', fecha_fin: '' })
  const mutation = useCreateTemporada()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    let payload = { ...form, liga_id: ligaId }
    
    // Auto-seleccionar el primero si no hay uno seleccionado
    if (!payload.formato_tipo && formatos?.length > 0) {
      payload.formato_tipo = formatos[0].tipo
    }

    await mutation.mutateAsync(payload)
    onClose()
    setForm({ nombre: '', formato_tipo: '', fecha_inicio: '', fecha_fin: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Temporada">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Nombre de Temporada
          <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Apertura 2025" required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        </label>
        
        <label className="text-xs font-medium text-text-dim">
          Formato de Competencia
          <select value={form.formato_tipo} onChange={set('formato_tipo')} required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
            <option value="" disabled>Seleccionar formato...</option>
            {formatos?.map(f => (
              <option key={f.id} value={f.tipo}>{f.nombre} ({f.tipo.replace(/_/g, ' ')})</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Fecha Inicio
            <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Fecha Fin (Est.)
            <input type="date" value={form.fecha_fin} onChange={set('fecha_fin')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
        </div>
        <Button type="submit" loading={mutation.isPending} className="w-full mt-2">Crear Temporada</Button>
      </form>
    </Modal>
  )
}

function EditTemporadaModal({ open, onClose, temporada }) {
  const [form, setForm] = useState({ 
    nombre: temporada.nombre, 
    fecha_inicio: temporada.fecha_inicio?.split('T')[0] || '', 
    fecha_fin: temporada.fecha_fin?.split('T')[0] || '',
    estado: temporada.estado || 'borrador'
  })
  const mutation = useUpdateTemporada()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ id: temporada.id, ...form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Temporada">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Nombre de Temporada
          <input type="text" value={form.nombre} onChange={set('nombre')} required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Fecha Inicio
            <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Estado de Temporada
            <select value={form.estado} onChange={set('estado')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none uppercase font-bold tracking-wider">
              <option value="borrador">Borrador</option>
              <option value="proximamente">Próximamente</option>
              <option value="abierta">Abierta (Inscripciones)</option>
              <option value="en_curso">En Curso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </label>
        </div>
        <p className="text-[10px] text-text-dim italic">* La fecha de finalización puede modificarse en cualquier momento antes de finalizar la temporada.</p>
        <Button type="submit" loading={mutation.isPending} className="w-full mt-2">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}


function NewFaseModal({ open, onClose, temporadaId }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'todos_contra_todos' })
  const mutation = useCreateFase()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ temporada_id: temporadaId, ...form, puntos_victoria: 3, puntos_empate: 1 })
    onClose()
    setForm({ nombre: '', tipo: 'todos_contra_todos' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Fase">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Fase Regular" required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <select value={form.tipo} onChange={set('tipo')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
          <option value="todos_contra_todos">Todos contra todos</option>
          <option value="grupos">Grupos</option>
          <option value="eliminacion_directa">Eliminación directa</option>
        </select>
        <Button type="submit" loading={mutation.isPending} className="w-full">Crear Fase</Button>
      </form>
    </Modal>
  )
}

function NewJornadasModal({ open, onClose, faseId }) {
  const [cantidad, setCantidad] = useState(5)
  const mutation = useCreateJornadas()

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ fase_id: faseId, cantidad: Number(cantidad) })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Generar Jornadas">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min={1} max={50} required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <p className="text-xs text-text-dim">Se crearán {cantidad} jornadas automáticamente.</p>
        <Button type="submit" loading={mutation.isPending} className="w-full">Generar</Button>
      </form>
    </Modal>
  )
}
