import { useState, useEffect } from 'react'
import { useLigas, useEquipos, useTemporadas, useJugadoresLiga, useInscripcionesEquipo, useAddJugador, useJugadoresOrganizador, useSearchGlobalJugadores } from '../../hooks/useAdmin'
import { useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { User, Search, UserPlus, Shield, Trophy, ChevronRight, ChevronLeft, AlertCircle, Trash2, UserCheck, Calendar } from 'lucide-react'
import { useLigaActiva } from '../../context/LigaContext'

import Loader from '../../components/ui/Loader'

export default function PlayerManager() {
  const { liga } = useLigaActiva()
  const [globalPage, setGlobalPage] = useState(1)
  const { data: jugadores, isLoading } = useJugadoresLiga(liga?.id)
  const { data: allJugadoresRaw } = useJugadoresOrganizador(globalPage, 12)
  const allJugadores = allJugadoresRaw?.list || []
  const totalPages = allJugadoresRaw?.totalPages || 1
  const totalCount = allJugadoresRaw?.count || 0
  
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showAdd, setShowAdd] = useState({ open: false, mode: 'search' })
  const [selectedForEnroll, setSelectedForEnroll] = useState(null)
  const queryClient = useQueryClient()

  // Debounce search query to avoid spamming the backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [query])

  const { data: searchResults, isFetching: isSearching } = useSearchGlobalJugadores(debouncedQuery)

  const filtered = (jugadores || []).filter(j => 
    `${j.nombre} ${j.apellido}`.toLowerCase().includes(query.toLowerCase()) ||
    j.dni?.includes(query)
  )

  // Si hay búsqueda activa (>2 chars), mostramos resultados remotos. Si no, mostramos los recientes.
  const poolJugadores = (debouncedQuery.length >= 2) ? (searchResults || []) : (allJugadores || [])
  
  const globalMatches = poolJugadores
    .filter(j => !jugadores?.find(lj => lj.id === j.id)) // Excluir los que ya están en esta liga

  const recentUnsigned = globalMatches

  if (isLoading) return <Loader text="Cargando jugadores de la liga..." className="py-20" />

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-3">
            <User className="w-7 h-7 text-primary" />
            Gestión de <span className="text-primary italic">Jugadores</span>
          </h1>
          <p className="text-sm text-text-dim mt-1">Administra el talento de {liga?.nombre} y realiza nuevas inscripciones.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowAdd({ open: true, mode: 'create' })}>
            <UserPlus className="w-4 h-4 mr-2" /> Crear Jugador
          </Button>
          <Button onClick={() => setShowAdd({ open: true, mode: 'search' })} className="shadow-lg shadow-primary/20">
            <Search className="w-4 h-4 mr-2" /> Fichar (Global)
          </Button>
        </div>
      </div>

      {/* Search & Stats */}
      {/* ... rest of the component ... */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, apellido o DNI..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-bg-surface border border-border-subtle rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-sm"
          />
        </div>
        <div className="flex items-center gap-3 px-6 bg-bg-surface border border-border-subtle rounded-2xl">
          <div className="text-center">
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-tighter">Total Liga</p>
            <p className="text-lg font-heading font-bold text-primary leading-none">{jugadores?.length || 0}</p>
          </div>
          <div className="w-px h-8 bg-border-subtle" />
          <div className="text-center">
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-tighter">Filtrados</p>
            <p className="text-lg font-heading font-bold text-text-primary leading-none">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-8">
        {/* Current Roster */}
        {filtered.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-success uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <UserCheck className="w-3.5 h-3.5" /> Jugadores en esta Liga
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(jugador => (
                <PlayerCard 
                  key={jugador.id} 
                  jugador={jugador} 
                  onEnroll={() => setSelectedForEnroll(jugador)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Mercado Global / Resultados de Búsqueda */}
        {(globalMatches.length > 0 || isSearching) && (
          <div className="space-y-4 animate-slide-up">
            <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              {debouncedQuery.length >= 2 ? (
                <>
                  <Shield className="w-3.5 h-3.5" /> 
                  Resultados del Servidor 
                  {isSearching && <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />}
                </>
              ) : (
                <>
                  <Trophy className="w-3.5 h-3.5" /> Mercado de Fichajes (Disponibles)
                </>
              )}
            </h4>
            
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${isSearching ? 'opacity-50' : 'opacity-100'}`}>
              {globalMatches.map(jugador => (
                <PlayerCard 
                  key={jugador.id} 
                  jugador={jugador} 
                  isGlobal={true}
                  onEnroll={() => setSelectedForEnroll(jugador)} 
                />
              ))}
            </div>

            {/* Pagination Controls (Only in Default Market view) */}
            {debouncedQuery.length < 2 && totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4 border-t border-border-subtle mt-6">
                <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                  Mostrando {(globalPage - 1) * 12 + 1} - {Math.min(globalPage * 12, totalCount)} de {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setGlobalPage(p => Math.max(1, p - 1))}
                    disabled={globalPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (globalPage <= 3) pageNum = i + 1;
                      else if (globalPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = globalPage - 2 + i;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setGlobalPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            globalPage === pageNum 
                              ? 'bg-primary text-secondary' 
                              : 'text-text-dim hover:bg-bg-surface'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setGlobalPage(p => Math.min(totalPages, p + 1))}
                    disabled={globalPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty Search State */}
        {((query && filtered.length === 0 && globalMatches.length === 0 && !isSearching) || 
          (!query && totalCount === 0)) && (
          <div className="py-20 text-center space-y-4 glass border border-white/5 rounded-3xl">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-text-dim opacity-20" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-text-primary">
              {query ? 'No se encontraron jugadores' : 'No posee jugadores para fichar'}
            </h3>
            <p className="text-sm text-text-dim max-w-xs mx-auto">
              {query 
                ? 'Prueba con otro término de búsqueda o registra un nuevo talento global.' 
                : 'Comienza registrando un nuevo jugador en el mercado global.'}
            </p>
            <Button onClick={() => setShowAdd({ open: true, mode: 'search' })} variant="outline">
              {query ? 'Buscar Globalmente' : 'Explorar Mercado'}
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPlayerModal 
        open={showAdd.open} 
        initialMode={showAdd.mode}
        onClose={() => setShowAdd({ ...showAdd, open: false })} 
        onEnroll={(player) => setSelectedForEnroll(player)}
        ligaId={liga?.id}
      />
      
      <EnrollPlayerModal 
        open={!!selectedForEnroll} 
        onClose={() => setSelectedForEnroll(null)} 
        jugador={selectedForEnroll}
        ligaId={liga?.id}
      />
    </div>
  )
}

function PlayerCard({ jugador, onEnroll, isGlobal = false }) {
  return (
    <GlassCard className={`relative overflow-hidden group border-white/5 hover:border-primary/30 transition-all duration-500 ${isGlobal ? 'opacity-80 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary border border-white/5 group-hover:scale-110 transition-transform duration-500 shrink-0">
          {jugador.foto_url ? (
            <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <User className="w-8 h-8 opacity-40" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-text-primary leading-tight truncate">
            {jugador.nombre} <span className="text-primary italic">{jugador.apellido}</span>
          </h3>
          {jugador.fecha_nacimiento && (
            <p className="text-[10px] font-medium text-primary mt-0.5 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" /> 
              {new Date(jugador.fecha_nacimiento).toLocaleDateString('es-AR')}
            </p>
          )}
          <p className="text-[10px] font-mono text-text-dim mt-1 uppercase">DNI: {jugador.dni || 'No registrado'}</p>
          
          <div className="flex flex-wrap gap-1.5 mt-3">
             <Badge variant="ghost" className={`${isGlobal ? 'bg-warning/10 text-warning' : 'bg-white/5 text-text-dim'} text-[9px] px-2 py-0.5 border border-white/5 uppercase tracking-tighter font-bold`}>
               {isGlobal ? 'En el Mercado' : 'En tu Equipo'}
             </Badge>
             
             {jugador.ligas_historial?.map((ligaName, idx) => (
               <Badge key={idx} variant="ghost" className="bg-primary/5 text-primary border border-primary/20 text-[9px] px-2 py-0.5">
                 {ligaName}
               </Badge>
             ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button onClick={onEnroll} variant="outline" size="sm" className="flex-1 h-10 border-white/10 hover:border-primary/50 hover:bg-primary/5">
          <UserCheck className="w-4 h-4 mr-2" /> Asignar Equipo
        </Button>
        <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-xl text-text-dim hover:text-danger hover:bg-danger/10 shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Gradient effect */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </GlassCard>
  )
}

function AddPlayerModal({ open, onClose, ligaId, onEnroll, initialMode = 'search' }) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [isCreating, setIsCreating] = useState(initialMode === 'create')
  const [form, setForm] = useState({ nombre: '', apellido: '', dni: '', fecha_nacimiento: '' })
  const toast = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) {
      setIsCreating(initialMode === 'create')
      if (initialMode === 'create') {
        setForm({ nombre: '', apellido: '', dni: '', fecha_nacimiento: '' })
      } else {
        setQuery('')
        setResults([])
      }
    }
  }, [open, initialMode])

  async function handleSearch() {
    if (query.length < 2) return
    setSearching(true)
    try {
      const data = await adminService.searchJugadores(query)
      setResults(data || [])
    } catch { toast.error('Error al buscar') }
    setSearching(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      // Nota: El wrapper api.js ya hace el unwrap de .data
      const newPlayer = await adminService.createJugador(form)
      toast.success('Jugador registrado globalmente')
      
      // Invalidamos para que aparezca en el pool de "otras ligas"
      queryClient.invalidateQueries({ queryKey: ['jugadores-organizador'] })
      
      onClose()
      if (onEnroll) onEnroll(newPlayer)
    } catch (e) { 
      toast.error('Error al registrar') 
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Fichar Jugador" maxWidth="max-w-md">
      {!isCreating ? (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input 
              autoFocus
              value={query} 
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar en el mercado global..." 
              className="w-full pl-9 pr-20 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm"
            />
            <Button size="xs" onClick={handleSearch} loading={searching} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4">Buscar</Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
             {results.map(j => (
               <div key={j.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary uppercase font-bold text-xs">{j.nombre[0]}{j.apellido[0]}</div>
                     <div>
                        <p className="text-sm font-bold text-text-primary">{j.nombre} {j.apellido}</p>
                        <p className="text-[10px] text-text-dim uppercase">{j.dni || 'Sin ID'}</p>
                     </div>
                  </div>
                  <Button size="xs" variant="ghost" className="text-primary hover:bg-primary/10" onClick={() => { onClose(); onEnroll(j); }}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
               </div>
             ))}

             {query && results.length === 0 && !searching && (
               <div className="py-8 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-text-dim mx-auto opacity-30" />
                  <p className="text-sm text-text-dim">El jugador no existe en ninguna liga.</p>
                  <Button onClick={() => setIsCreating(true)} size="sm" className="w-full">Registrar como Nuevo</Button>
               </div>
             )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="space-y-4 animate-fade-in">
           <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-text-dim uppercase">Nombre</label>
                <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm" />
             </div>
             <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-text-dim uppercase">Apellido</label>
                <input type="text" required value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm" />
             </div>
           </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                 <label className="text-[10px] font-bold text-text-dim uppercase">DNI (Identificación)</label>
                 <input type="text" value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-mono" />
              </div>
              <div className="space-y-1.5 text-left">
                 <label className="text-[10px] font-bold text-text-dim uppercase">Fecha Nacimiento</label>
                 <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm" />
              </div>
            </div>
           <Button type="submit" className="w-full mt-4 h-12 text-sm font-bold shadow-lg shadow-primary/20">Crear Jugador</Button>
           <Button variant="ghost" onClick={() => setIsCreating(false)} className="w-full text-xs text-text-dim">Volver a búsqueda</Button>
        </form>
      )}
    </Modal>
  )
}

function EnrollPlayerModal({ open, onClose, jugador, ligaId }) {
  const { data: equipos } = useEquipos(ligaId)
  const [selectedEquipoId, setSelectedEquipoId] = useState('')
  const { data: temporadas } = useTemporadas(ligaId)
  
  const [form, setForm] = useState({ temporada_id: '', dorsal: '', posicion: 'mediocampista' })
  const addMutation = useAddJugador()
  const toast = useToast()

  const { data: inscripciones } = useInscripcionesEquipo(ligaId, selectedEquipoId)
  
  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedEquipoId || !form.temporada_id) return toast.error('Selecciona equipo y temporada')
    
    const insc = (inscripciones || []).find(i => i.temporada_id === form.temporada_id)
    if (!insc) return toast.error('El equipo no está inscrito en esa temporada')

    try {
      await addMutation.mutateAsync({
        plantel_id: insc.plantel.id,
        jugador_id: jugador.id,
        posicion: form.posicion,
        dorsal: form.dorsal ? Number(form.dorsal) : undefined
      })
      toast.success(`${jugador.nombre} inscrito exitosamente`)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error en inscripción')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Asignar a Equipo" maxWidth="max-w-md">
       <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center gap-3">
             <div className="w-12 h-12 rounded-xl bg-primary text-secondary flex items-center justify-center font-bold text-lg">{jugador?.nombre[0]}{jugador?.apellido[0]}</div>
             <div>
                <p className="text-sm font-bold text-text-primary">{jugador?.nombre} {jugador?.apellido}</p>
                <p className="text-[10px] text-text-dim uppercase truncate max-w-[200px]">{equipos?.find(e => e.id === selectedEquipoId)?.nombre || 'Selecciona equipo'}</p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">1. Seleccionar Equipo</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <select 
                    value={selectedEquipoId} 
                    onChange={e => setSelectedEquipoId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Selecciona un equipo...</option>
                    {equipos?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">2. Temporada de Juego</label>
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                  <select 
                    disabled={!selectedEquipoId}
                    value={form.temporada_id} 
                    onChange={e => setForm({...form, temporada_id: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Selecciona temporada...</option>
                    {(temporadas || []).filter(t => t.estado !== 'finalizada').map(t => (
                      <option key={t.id} value={t.id}>{t.nombre} ({t.estado})</option>
                    ))}
                  </select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-text-dim uppercase">Dorsal</label>
                  <input type="number" value={form.dorsal} onChange={e => setForm({...form, dorsal: e.target.value})} placeholder="Ej: 10" className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-mono" />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-text-dim uppercase">Posición</label>
                  <select value={form.posicion} onChange={e => setForm({...form, posicion: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm appearance-none cursor-pointer">
                    <option value="arquero">Arquero</option>
                    <option value="defensor">Defensor</option>
                    <option value="mediocampista">Mediocampista</option>
                    <option value="delantero">Delantero</option>
                  </select>
                </div>
             </div>
          </div>

          <Button type="submit" loading={addMutation.isPending} className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-[#0D0D0D] shadow-lg shadow-primary/20">Finalizar Fichaje</Button>
       </form>
    </Modal>
  )
}
