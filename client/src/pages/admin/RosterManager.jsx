import { useState } from 'react'
import { useLigas, useEquipos, useCreateEquipo, useDeleteEquipo, useTemporadas, useInscribirEquiposBatch } from '../../hooks/useAdmin'
import { adminService } from '../../services/adminService'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { Users, Plus, Search, UserPlus, Shield, ExternalLink, Settings, Trash2, ChevronRight, CheckSquare, Square, Layers } from 'lucide-react'
import TeamDetailView from './TeamDetailView'

import { useLigaActiva } from '../../context/LigaContext'
import Loader from '../../components/ui/Loader'

export default function RosterManager() {
  const { liga } = useLigaActiva()
  const { data: equipos, isLoading } = useEquipos(liga?.id)
  const { data: temporadas } = useTemporadas(liga?.id)
  const [showNewEquipo, setShowNewEquipo] = useState(false)
  const [showSearchPlayer, setShowSearchPlayer] = useState(false)
  const [showBatchEnroll, setShowBatchEnroll] = useState(false)
  const [selectedEquipo, setSelectedEquipo] = useState(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  
  const deleteEquipo = useDeleteEquipo()
  const toast = useToast()

  if (isLoading) return <Loader text="Cargando equipos de la liga..." className="py-20" />

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 md:h-12 bg-primary skew-x-[-15deg] shrink-0" />
            <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tighter uppercase italic leading-relaxed py-2">Gestión de Equipos</h1>
          </div>
          <p className="text-[10px] md:text-xs font-bold text-text-dim uppercase tracking-[0.3em] pl-4">Panel de Administración de Clubes</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!selectedEquipo && equipos?.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => {
              setSelectionMode(!selectionMode)
              setSelectedIds([])
            }} className={`${selectionMode ? 'text-primary bg-primary/10' : 'text-text-dim'} font-bold uppercase tracking-widest text-[10px]`}>
              <CheckSquare className="w-4 h-4 mr-2" /> {selectionMode ? 'Cancelar Selección' : 'Inscripción Masiva'}
            </Button>
          )}
          {selectionMode && selectedIds.length > 0 && (
            <Button variant="primary" size="sm" onClick={() => setShowBatchEnroll(true)} className="bg-primary text-bg-deep font-black uppercase italic tracking-tighter h-10 px-6">
              <Layers className="w-4 h-4 mr-2" /> Inscribir ({selectedIds.length})
            </Button>
          )}
          {!selectionMode && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowSearchPlayer(true)} className="text-text-dim hover:text-primary font-bold uppercase tracking-widest text-[10px]">
                <Search className="w-4 h-4 mr-2" /> Buscar Jugador
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowNewEquipo(true)} className="font-black uppercase italic tracking-tighter h-10 px-6">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Equipo
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedEquipo ? (
        <TeamDetailView 
          equipo={selectedEquipo} 
          onBack={() => setSelectedEquipo(null)} 
          ligaId={liga?.id} 
        />
      ) : equipos?.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {equipos.map(eq => {
            const isSelected = selectedIds.includes(eq.id);
            const activeInscripciones = eq.inscripciones?.filter(i => i.temporada?.estado !== 'finalizada') || [];
            
            return (
              <GlassCard 
                key={eq.id} 
                className={`group hover:ring-2 hover:ring-primary/50 cursor-pointer transition-all p-5 border-none ring-1 ring-white/5 relative overflow-hidden ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`} 
                onClick={() => selectionMode ? toggleSelection(eq.id) : setSelectedEquipo(eq)}
              >
                {/* Selection Overlay */}
                {selectionMode && (
                  <div className="absolute top-3 right-3 z-20">
                    {isSelected ? (
                      <CheckSquare className="w-6 h-6 text-primary fill-primary/20" />
                    ) : (
                      <Square className="w-6 h-6 text-text-dim" />
                    )}
                  </div>
                )}

                {/* Background gradient hint */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/[0.03] to-transparent rounded-bl-full" />
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-white/5 shadow-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: eq.color_principal ? `${eq.color_principal}20` : 'rgba(206, 222, 11, 0.1)' }}>
                      <Shield className="w-6 h-6" style={{ color: eq.color_principal || 'var(--color-primary)' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-black uppercase truncate leading-relaxed py-1">{eq.nombre}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: eq.color_principal || 'var(--color-primary)' }} />
                        <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.2em]">
                          {selectionMode ? (isSelected ? 'Seleccionado' : 'Click para seleccionar') : 'Ver Plantel'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!selectionMode && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Estás seguro de eliminar el equipo "${eq.nombre}"?`)) {
                            deleteEquipo.mutate(eq.id, {
                              onSuccess: () => toast.success('Equipo eliminado')
                            });
                          }
                        }}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/10 transition-all active:scale-90"
                        title="Eliminar Equipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-text-dim group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                  )}
                </div>
                
                {/* Stat footer in card */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[8px] font-black text-text-dim uppercase tracking-widest mb-1">Participando en</p>
                    <div className="flex flex-wrap gap-1">
                      {activeInscripciones.length > 0 ? (
                        activeInscripciones.map(i => (
                          <Badge key={i.id} status="activa" label={i.temporada?.nombre} className="text-[7px] px-1.5 py-0" />
                        ))
                      ) : (
                        <p className="text-[10px] font-black text-text-dim/50 uppercase italic">Ninguna activa</p>
                      )}
                    </div>
                  </div>
                  {!selectionMode && (
                    <div className="flex items-center gap-2 pl-4 border-l border-white/5 ml-2">
                      <ExternalLink className="w-3 h-3 text-text-dim group-hover:text-primary" />
                    </div>
                  )}
                </div>
              </GlassCard>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Users} title="Sin equipos" description="Empezá agregando equipos a tu liga."
          action={<Button size="sm" onClick={() => setShowNewEquipo(true)}>Agregar Equipo</Button>} />
      )}

      <NewEquipoModal open={showNewEquipo} onClose={() => setShowNewEquipo(false)} ligaId={liga?.id} />
      <SearchPlayerModal open={showSearchPlayer} onClose={() => setShowSearchPlayer(false)} />
      <BatchEnrollModal 
        open={showBatchEnroll} 
        onClose={() => {
          setShowBatchEnroll(false)
          setSelectionMode(false)
          setSelectedIds([])
        }} 
        equipoIds={selectedIds}
        temporadas={temporadas}
      />
    </div>
  )
}

function NewEquipoModal({ open, onClose, ligaId }) {
  const [form, setForm] = useState({ nombre: '', color_principal: '#CEDE0B' })
  const mutation = useCreateEquipo()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ liga_id: ligaId, ...form })
    onClose()
    setForm({ nombre: '', color_principal: '#CEDE0B' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Equipo">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Nombre del equipo" required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <label className="text-xs font-medium text-text-dim">
          Color principal
          <input type="color" value={form.color_principal} onChange={set('color_principal')}
            className="w-full h-10 mt-1.5 rounded-lg cursor-pointer border border-border-default bg-bg-input" />
        </label>
        <Button type="submit" loading={mutation.isPending} className="w-full">Crear Equipo</Button>
      </form>
    </Modal>
  )
}

function SearchPlayerModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const data = await adminService.searchJugadores(query)
      setResults(data || [])
    } catch { setResults([]) }
    setSearching(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Buscar Jugador (Global)">
      <div className="flex gap-2 mb-4">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()} placeholder="Nombre o apellido..."
          className="flex-1 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <Button size="sm" onClick={search} loading={searching}>Buscar</Button>
      </div>
      {results.length > 0 ? (
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {results.map(j => (
            <li key={j.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep/50">
              <UserPlus className="w-4 h-4 text-text-dim shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{j.nombre} {j.apellido}</p>
                {j.fecha_nacimiento && <p className="text-[11px] text-text-dim">{j.fecha_nacimiento}</p>}
              </div>
              <Badge status="activa" label="Existente" />
            </li>
          ))}
        </ul>
      ) : query && !searching ? (
        <p className="text-sm text-text-dim text-center py-4">Sin resultados. Podés crear un jugador nuevo.</p>
      ) : null}
    </Modal>
  )
}

function BatchEnrollModal({ open, onClose, equipoIds, temporadas }) {
  const [selectedTemporada, setSelectedTemporada] = useState('')
  const [limiteJugadores, setLimiteJugadores] = useState(20)
  const mutation = useInscribirEquiposBatch()
  const toast = useToast()

  const availableTemporadas = temporadas?.filter(t => t.estado !== 'finalizada') || []

  async function submit(e) {
    e.preventDefault()
    if (!selectedTemporada) return toast.error('Seleccioná una temporada')

    await mutation.mutateAsync({
      equipo_ids: equipoIds,
      temporada_id: selectedTemporada,
      limite_jugadores: limiteJugadores
    })

    toast.success('Equipos inscritos correctamente')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Inscripción Masiva">
      <div className="space-y-4">
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">Equipos Seleccionados: {equipoIds.length}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-dim uppercase tracking-widest ml-1">Temporada de Destino</label>
            <select 
              value={selectedTemporada} 
              onChange={e => setSelectedTemporada(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all"
              required
            >
              <option value="">Seleccionar temporada...</option>
              {availableTemporadas.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-text-dim uppercase tracking-widest ml-1">Límite de Jugadores por Plantel</label>
            <input 
              type="number" 
              value={limiteJugadores} 
              onChange={e => setLimiteJugadores(e.target.value)}
              min="5" 
              max="50"
              className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all"
            />
          </div>

          <Button type="submit" loading={mutation.isPending} className="w-full py-4 font-black uppercase italic tracking-tighter">
            Confirmar Inscripción Masiva
          </Button>
        </form>
      </div>
    </Modal>
  )
}
