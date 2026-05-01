// Aggressive UI Modernization - Roster Management
import { useState } from 'react'
import { useLigas, useEquipos, useCreateEquipo, useDeleteEquipo, useTemporadas, useInscribirEquiposBatch } from '../../hooks/useAdmin'
import { adminService } from '../../services/adminService'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { Users, Plus, Search, UserPlus, Shield, ExternalLink, Settings, Trash2, ChevronRight, CheckSquare, Square, Layers, ChevronDown } from 'lucide-react'
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
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-32 px-4 sm:px-0">
      {/* Header Sección */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            <Users className="w-3.5 h-3.5" /> Club Management
          </div>
          <div className="relative pt-2">
            <h1 className="text-4xl sm:text-6xl font-heading font-black tracking-wide leading-[1.1] uppercase italic">
              Gestión de <span className="text-primary">Equipos</span>
            </h1>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-full bg-primary/30 skew-x-[-15deg] hidden lg:block" />
          </div>
          <p className="text-base text-text-dim max-w-md font-medium leading-tight italic uppercase tracking-normal">
            Administra el plantel, inscripciones y la identidad visual de cada equipo.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {!selectedEquipo && equipos?.length > 0 && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectionMode(!selectionMode)
                setSelectedIds([])
              }} 
              className={`flex-1 sm:flex-none h-14 px-6 font-black uppercase italic tracking-wide border transition-all ${
                selectionMode ? 'bg-primary text-bg-deep border-primary' : 'bg-white/5 border-white/10 text-text-dim hover:text-primary'
              }`}
            >
              <CheckSquare className="w-5 h-5 mr-2" /> {selectionMode ? 'Cancelar' : 'Selección'}
            </Button>
          )}
          {!selectionMode && (
            <>
              <Button 
                variant="ghost" 
                onClick={() => setShowSearchPlayer(true)} 
                className="flex-1 sm:flex-none h-14 px-6 bg-white/5 border border-white/10 text-text-dim hover:text-primary font-black uppercase italic tracking-wide"
              >
                <Search className="w-5 h-5 mr-2" /> Buscar
              </Button>
              <Button 
                variant="primary" 
                onClick={() => setShowNewEquipo(true)} 
                className="flex-1 sm:flex-none h-14 px-8 font-black uppercase italic tracking-wide shadow-xl shadow-primary/20"
              >
                <Plus className="w-6 h-6 mr-2 stroke-[4]" /> Nuevo Equipo
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Floating Action Bar for Selection Mode */}
      {selectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-bg-surface/80 backdrop-blur-xl border border-primary/30 rounded-2xl p-2 flex items-center gap-4 shadow-2xl ring-1 ring-primary/20">
            <div className="px-4 border-r border-white/10">
              <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Seleccionados</p>
              <p className="text-xl font-heading font-black text-primary italic leading-none">{selectedIds.length}</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowBatchEnroll(true)} 
              className="h-12 px-8 bg-primary text-bg-deep font-black uppercase italic tracking-wide shadow-lg shadow-primary/20"
            >
              <Layers className="w-4 h-4 mr-2" /> Inscribir en Lote
            </Button>
          </div>
        </div>
      )}


      {selectedEquipo ? (
        <TeamDetailView 
          equipo={selectedEquipo} 
          onBack={() => setSelectedEquipo(null)} 
          ligaId={liga?.id} 
        />
      ) : equipos?.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {equipos.map(eq => {
            const isSelected = selectedIds.includes(eq.id);
            const allInscripciones = eq.inscripciones || [];
            const activeInscripciones = allInscripciones.filter(i => i.temporada && i.temporada.estado !== 'finalizada' && !i.temporada.deleted_at);
            const archivedInscripciones = allInscripciones.filter(i => i.temporada && i.temporada.deleted_at);
            
            // Get player count from the most recent active inscription
            const playerCount = activeInscripciones[0]?.plantel?.inscripciones?.length || 0;

            return (
              <GlassCard 
                key={eq.id} 
                className={`group relative overflow-hidden border-none p-6 ring-1 transition-all cursor-pointer ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5 shadow-[0_0_40px_rgba(206,222,11,0.1)]' 
                    : 'ring-white/5 hover:ring-primary/30'
                }`} 
                onClick={() => selectionMode ? toggleSelection(eq.id) : setSelectedEquipo(eq)}
              >
                {/* Selection Marker */}
                {selectionMode && (
                  <div className={`absolute top-4 right-4 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-primary border-primary' : 'border-white/20 bg-black/20'
                  }`}>
                    {isSelected && <CheckSquare className="w-4 h-4 text-bg-deep" />}
                  </div>
                )}

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.03] to-transparent rounded-bl-[120px] pointer-events-none" />
                <Shield 
                  className="absolute -right-6 -bottom-6 w-40 h-40 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 pointer-events-none group-hover:scale-125 group-hover:rotate-12" 
                  style={{ color: eq.color_principal || 'var(--color-primary)' }} 
                />
                
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white/5 shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3"
                      style={{ backgroundColor: eq.color_principal ? `${eq.color_principal}20` : 'rgba(206, 222, 11, 0.1)' }}>
                      <Shield className="w-8 h-8" style={{ color: eq.color_principal || 'var(--color-primary)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-heading font-black uppercase italic tracking-wide leading-[1.1] truncate group-hover:text-primary transition-colors">
                        {eq.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(206,222,11,0.5)]" style={{ backgroundColor: eq.color_principal || 'var(--color-primary)' }} />
                        <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">
                          {selectionMode ? (isSelected ? 'Seleccionado' : 'Click para seleccionar') : 'Click para detalles'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1 h-2 bg-primary/40 skew-x-[-15deg]" /> Roster
                      </p>
                      <p className="text-lg font-heading font-black italic uppercase leading-none">
                        {playerCount} <span className="text-[10px] text-text-dim">JUG.</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1 h-2 bg-secondary/40 skew-x-[-15deg]" /> Estatus
                      </p>
                      <p className="text-lg font-heading font-black italic uppercase leading-none text-primary">
                        {activeInscripciones.length > 0 ? 'ACTIVO' : 'INACTIVO'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Footer Action Area */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex flex-wrap gap-1.5">
                        {activeInscripciones.length > 0 ? (
                          activeInscripciones.map(i => (
                            <Badge key={i.id} status="activa" label={i.temporada?.nombre} className="text-[8px] font-black px-2 py-0.5 rounded italic" />
                          ))
                        ) : (
                          <span className="text-[9px] font-black text-text-dim/40 uppercase italic tracking-widest">Sin Competencia Activa</span>
                        )}
                        {archivedInscripciones.length > 0 && (
                          <Badge 
                            status="borrador" 
                            label={`+${archivedInscripciones.length} Histórico`} 
                            className="text-[8px] font-black px-2 py-0.5 rounded italic bg-white/5 text-text-dim border-white/5" 
                          />
                        )}
                      </div>
                    </div>

                    {!selectionMode && (
                      <div className="flex items-center gap-2 ml-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Estás seguro de eliminar el equipo "${eq.nombre}"?`)) {
                              deleteEquipo.mutate(eq.id, {
                                onSuccess: () => toast.success('Equipo eliminado')
                              });
                            }
                          }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/10 transition-all active:scale-90 border border-transparent hover:border-danger/20"
                          title="Eliminar Equipo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-text-dim group-hover:text-primary group-hover:bg-primary/10 transition-all border border-white/10 group-hover:border-primary/20">
                          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      ) : (
        <div className="py-24 text-center space-y-8 animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse-live" />
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-bg-surface border-2 border-dashed border-white/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-text-dim opacity-30" />
            </div>
          </div>
          <div className="space-y-4 max-w-sm mx-auto">
            <h3 className="text-2xl sm:text-3xl font-heading font-black tracking-wide uppercase italic">Clubes No Encontrados</h3>
            <p className="text-sm text-text-dim font-medium uppercase tracking-normal italic">
              Tu liga aún no tiene equipos registrados. Comienza a construir tu roster oficial ahora mismo.
            </p>
          </div>
          <Button 
            onClick={() => setShowNewEquipo(true)} 
            className="h-16 px-10 bg-primary text-bg-deep font-black uppercase italic tracking-wide shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6 mr-2 stroke-[4]" /> Registrar Primer Equipo
          </Button>
        </div>
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
    <Modal open={open} onClose={onClose} title="Nuevo Equipo" size="sm">
      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Identidad Visual</label>
          <div className="relative group">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={form.nombre} 
              onChange={set('nombre')} 
              placeholder="Nombre del club" 
              required
              className="w-full pl-12 pr-4 py-4 bg-bg-input border border-white/5 rounded-2xl text-sm text-text-primary outline-none focus:border-primary transition-all font-bold placeholder:text-text-dim/50" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Color Principal</label>
          <div className="flex gap-3">
            <input 
              type="color" 
              value={form.color_principal} 
              onChange={set('color_principal')}
              className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-white/10 bg-bg-input p-1.5 hover:border-primary transition-all" 
            />
            <div className="flex-1 px-4 py-4 bg-bg-input border border-white/5 rounded-2xl flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-text-dim uppercase">{form.color_principal}</span>
              <div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: form.color_principal }} />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          loading={mutation.isPending} 
          className="w-full h-16 bg-primary text-bg-deep font-black uppercase italic tracking-wide text-lg shadow-xl shadow-primary/20"
        >
          Crear Equipo
        </Button>
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
    <Modal open={open} onClose={onClose} title="Buscador de Talentos">
      <div className="space-y-6">
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()} 
              placeholder="DNI, Nombre o Apellido..."
              className="w-full pl-12 pr-4 py-4 bg-bg-input border border-white/5 rounded-2xl text-sm text-text-primary outline-none focus:border-primary transition-all font-bold" 
            />
          </div>
          <Button onClick={search} loading={searching} className="h-14 px-8 bg-primary text-bg-deep font-black uppercase italic tracking-wide">
            Buscar
          </Button>
        </div>

        {results.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1 mb-2">Resultados en la Base de Datos</p>
            {results.map(j => (
              <div key={j.id} className="flex items-center gap-4 p-4 rounded-2xl bg-bg-surface/50 border border-white/5 hover:border-primary/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm italic border border-primary/20 group-hover:scale-110 transition-transform">
                  {j.nombre[0]}{j.apellido[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase italic tracking-normal">{j.nombre} {j.apellido}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-text-dim font-bold tracking-widest uppercase">ID: {j.id.split('-')[0]}</p>
                    {j.fecha_nacimiento && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <p className="text-[10px] text-text-dim font-bold uppercase">{j.fecha_nacimiento}</p>
                      </>
                    )}
                  </div>
                </div>
                <Badge status="activa" label="Fichado" className="text-[8px] font-black italic" />
              </div>
            ))}
          </div>
        ) : query && !searching ? (
          <div className="py-12 text-center bg-white/2 rounded-3xl border-2 border-dashed border-white/5">
            <Users className="w-12 h-12 text-text-dim opacity-20 mx-auto mb-4" />
            <p className="text-sm font-bold text-text-dim uppercase tracking-normal italic">No se encontraron jugadores.</p>
          </div>
        ) : null}
        
        <p className="text-[10px] text-text-dim text-center px-8 italic uppercase tracking-wider leading-relaxed">
          TIP: Podrás registrar jugadores nuevos directamente desde el panel de cada equipo.
        </p>
      </div>
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
      <div className="space-y-8">
        <div className="p-6 bg-primary/10 border border-primary/20 rounded-[2rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 skew-x-[-20deg] translate-x-12 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic mb-1">Equipos a Procesar</p>
            <p className="text-5xl font-heading font-black text-primary italic leading-none tracking-wide">
              {equipoIds.length} <span className="text-xl">CLUBES</span>
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Temporada de Destino</label>
            <div className="relative group">
              <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors" />
              <select 
                value={selectedTemporada} 
                onChange={e => setSelectedTemporada(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-bg-input border border-white/5 rounded-2xl text-sm text-text-primary outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                required
              >
                <option value="">Seleccionar temporada...</option>
                {availableTemporadas.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Cupos Máximos (Plantel)</label>
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors" />
              <input 
                type="number" 
                value={limiteJugadores} 
                onChange={e => setLimiteJugadores(e.target.value)}
                min="5" 
                max="50"
                className="w-full pl-12 pr-4 py-4 bg-bg-input border border-white/5 rounded-2xl text-sm text-text-primary outline-none focus:border-primary transition-all font-mono font-bold" 
              />
            </div>
          </div>

          <Button 
            type="submit" 
            loading={mutation.isPending} 
            className="w-full h-20 bg-primary text-bg-deep font-black uppercase italic tracking-wide text-xl shadow-2xl shadow-primary/20"
          >
            Confirmar Inscripción Masiva
          </Button>
        </form>
      </div>
    </Modal>
  )
}

