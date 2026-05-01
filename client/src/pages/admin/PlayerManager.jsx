// Aggressive UI Modernization - Player Management
import { useState, useEffect } from 'react'
import { useLigas, useEquipos, useTemporadas, useJugadoresLiga, useInscripcionesEquipo, useAddJugador, useJugadoresOrganizador, useSearchGlobalJugadores } from '../../hooks/useAdmin'
import { useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { User, Search, UserPlus, Shield, Trophy, ChevronRight, ChevronLeft, AlertCircle, Trash2, UserCheck, Calendar, ChevronDown } from 'lucide-react'
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
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-32 px-4 sm:px-0">
      {/* Header Sección */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            <Trophy className="w-3.5 h-3.5" /> Talent Portal
          </div>
          <div className="relative pt-2">
            <h1 className="text-4xl sm:text-6xl font-heading font-black tracking-tighter leading-[1.1] uppercase italic">
              Gestión de <span className="text-primary">Jugadores</span>
            </h1>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-full bg-primary/30 skew-x-[-15deg] hidden lg:block" />
          </div>
          <p className="text-base text-text-dim max-w-md font-medium leading-tight italic uppercase tracking-tight">
            Descubre, ficha y asigna talento a los clubes de {liga?.nombre}.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="ghost" 
            onClick={() => setShowAdd({ open: true, mode: 'create' })}
            className="flex-1 sm:flex-none h-14 px-6 bg-white/5 border border-white/10 text-text-dim hover:text-primary font-black uppercase italic tracking-tighter"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Crear
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowAdd({ open: true, mode: 'search' })}
            className="flex-1 sm:flex-none h-14 px-8 font-black uppercase italic tracking-tighter shadow-xl shadow-primary/20"
          >
            <Search className="w-6 h-6 mr-2 stroke-[4]" /> Fichar Global
          </Button>
        </div>
      </div>


      {/* Search & Stats */}
      {/* ... rest of the component ... */}
      {/* Search & Stats Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/10 text-primary group-focus-within:bg-primary group-focus-within:text-bg-deep transition-all">
            <Search className="w-5 h-5" />
          </div>
          <input 
            type="text" 
            placeholder="BUSCAR POR NOMBRE, APELLIDO O DNI..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-16 pr-4 py-6 bg-bg-surface border border-white/5 rounded-3xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-black text-sm uppercase italic tracking-tighter placeholder:text-text-dim/40"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 lg:w-40 p-4 rounded-3xl bg-bg-surface border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-full bg-primary/5 skew-x-[-20deg] translate-x-6 pointer-events-none" />
            <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-1">Total Liga</p>
            <p className="text-3xl font-heading font-black text-primary italic leading-none">{jugadores?.length || 0}</p>
          </div>
          <div className="flex-1 lg:w-40 p-4 rounded-3xl bg-bg-surface border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-full bg-secondary/5 skew-x-[-20deg] translate-x-6 pointer-events-none" />
            <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-1">Filtrados</p>
            <p className="text-3xl font-heading font-black text-text-primary italic leading-none">{filtered.length}</p>
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
          <div className="py-24 text-center space-y-8 animate-fade-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse-live" />
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-bg-surface border-2 border-dashed border-white/10 flex items-center justify-center mx-auto mb-6">
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-text-dim opacity-30" />
              </div>
            </div>
            <div className="space-y-4 max-w-sm mx-auto">
              <h3 className="text-2xl sm:text-3xl font-heading font-black tracking-tighter uppercase italic">
                {query ? 'Sin Resultados' : 'Sin Jugadores'}
              </h3>
              <p className="text-sm text-text-dim font-medium uppercase tracking-tight italic">
                {query 
                  ? 'No encontramos coincidencias para tu búsqueda. Intenta con otro término o explora el mercado global.' 
                  : 'Tu liga aún no tiene registros de talento. Comienza fichando desde el mercado global ahora mismo.'}
              </p>
            </div>
            <Button 
              onClick={() => setShowAdd({ open: true, mode: 'search' })} 
              className="h-16 px-10 bg-primary text-bg-deep font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              {query ? <Search className="w-6 h-6 mr-2" /> : <UserPlus className="w-6 h-6 mr-2" />}
              {query ? 'Explorar Mercado Global' : 'Fichar Primer Jugador'}
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
    <GlassCard className={`relative overflow-hidden group border-none ring-1 transition-all duration-500 p-6 ${
      isGlobal 
        ? 'ring-white/5 bg-white/[0.02] grayscale-[0.5] hover:grayscale-0 hover:ring-primary/40' 
        : 'ring-white/10 hover:ring-success/40'
    }`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.03] to-transparent rounded-bl-[80px] pointer-events-none" />
      <User 
        className="absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 pointer-events-none group-hover:scale-125 group-hover:-rotate-12" 
        style={{ color: isGlobal ? 'var(--color-primary)' : 'var(--color-primary)' }} 
      />

      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary border-2 border-white/5 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
            {jugador.foto_url ? (
              <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-heading font-black italic">{jugador.nombre[0]}{jugador.apellido[0]}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-heading font-black text-text-primary leading-[1.1] uppercase italic tracking-tighter truncate group-hover:text-primary transition-colors">
              {jugador.nombre} {jugador.apellido}
            </h3>
            <div className="flex flex-col gap-1 mt-1.5">
              {jugador.fecha_nacimiento && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase italic tracking-widest">
                  <Calendar className="w-3 h-3" /> 
                  {new Date(jugador.fecha_nacimiento).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: '2-digit' })}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim uppercase tracking-[0.2em] font-bold">
                <span className="w-1 h-2 bg-white/20 skew-x-[-15deg]" /> DNI: {jugador.dni || 'NO REGISTRADO'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
           <Badge status={isGlobal ? 'borrador' : 'activa'} label={isGlobal ? 'MERCADO' : 'FICHADO'} className="text-[8px] font-black px-2.5 py-1 rounded italic tracking-widest" />
           
           {jugador.ligas_historial?.map((ligaName, idx) => (
             <span key={idx} className="text-[8px] font-black text-text-dim border border-white/5 bg-white/5 px-2.5 py-1 rounded italic uppercase tracking-widest">
               {ligaName}
             </span>
           ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button 
            onClick={onEnroll} 
            className={`flex-1 h-12 font-black uppercase italic tracking-tighter text-xs transition-all ${
              isGlobal 
                ? 'bg-primary text-bg-deep shadow-lg shadow-primary/20 hover:scale-[1.02]' 
                : 'bg-white/5 border border-white/10 text-text-primary hover:bg-primary/10 hover:border-primary/30'
            }`}
          >
            <UserCheck className="w-4 h-4 mr-2 stroke-[3]" /> Asignar Equipo
          </Button>
          <button className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-text-dim hover:text-danger hover:bg-danger/10 hover:border-danger/20 transition-all active:scale-90 shrink-0 group/del">
            <Trash2 className="w-5 h-5 transition-transform group-hover/del:scale-110" />
          </button>
        </div>
      </div>
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
      const newPlayer = await adminService.createJugador(form)
      toast.success('Jugador registrado globalmente')
      queryClient.invalidateQueries({ queryKey: ['jugadores-organizador'] })
      onClose()
      if (onEnroll) onEnroll(newPlayer)
    } catch (e) { 
      toast.error('Error al registrar') 
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isCreating ? "Registrar Nuevo Talento" : "Buscador Global de Jugadores"} size={isCreating ? "sm" : "md"}>
      {!isCreating ? (
        <div className="space-y-8">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors" />
              <input 
                autoFocus
                value={query} 
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="DNI, NOMBRE O APELLIDO..." 
                className="w-full pl-12 pr-4 py-5 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-black uppercase italic tracking-tighter"
              />
            </div>
            <Button onClick={handleSearch} loading={searching} className="h-16 px-8 bg-primary text-bg-deep font-black uppercase italic tracking-tighter">Buscar</Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
             {results.map(j => (
               <div key={j.id} className="p-4 rounded-2xl bg-bg-surface/50 border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black italic border border-primary/20 group-hover:scale-110 transition-transform">
                        {j.nombre[0]}{j.apellido[0]}
                     </div>
                     <div className="min-w-0">
                        <p className="text-sm font-black uppercase italic tracking-tight text-text-primary">{j.nombre} {j.apellido}</p>
                        <p className="text-[10px] text-text-dim font-bold tracking-widest uppercase">ID: {j.dni || j.id.split('-')[0]}</p>
                     </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-primary bg-primary/5 border border-primary/20 font-black italic uppercase tracking-tighter" onClick={() => { onClose(); onEnroll(j); }}>
                    Fichar <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
               </div>
             ))}

             {query && results.length === 0 && !searching && (
               <div className="py-12 text-center bg-white/2 rounded-[2rem] border-2 border-dashed border-white/5 space-y-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto opacity-30">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-text-dim uppercase italic tracking-tight">Sin coincidencias globales</p>
                    <p className="text-[10px] text-text-dim/60 font-bold uppercase">Registra el perfil del jugador desde cero.</p>
                  </div>
                  <Button onClick={() => setIsCreating(true)} className="h-12 px-8 font-black italic uppercase tracking-tighter">Registrar Perfil Nuevo</Button>
               </div>
             )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="space-y-6 animate-fade-in">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Nombre</label>
                <input type="text" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-bold uppercase italic tracking-tighter" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Apellido</label>
                <input type="text" required value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} className="w-full px-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-bold uppercase italic tracking-tighter" />
             </div>
           </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">DNI / ID</label>
                 <input type="text" value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} className="w-full px-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-mono font-bold" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Fecha Nacimiento</label>
                 <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} className="w-full px-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-bold" />
              </div>
            </div>
           <Button type="submit" className="w-full h-16 bg-primary text-bg-deep font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-primary/20">Registrar en la Nube</Button>
           <button type="button" onClick={() => setIsCreating(false)} className="w-full text-[10px] font-black text-text-dim uppercase tracking-[0.2em] hover:text-primary transition-colors italic">Volver al Buscador</button>
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
    <Modal open={open} onClose={onClose} title="Asignar al Roster" size="sm">
       <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          <div className="p-6 bg-primary/10 border border-primary/20 rounded-[2rem] relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 skew-x-[-20deg] translate-x-12 pointer-events-none" />
             <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary text-bg-deep flex items-center justify-center font-black text-xl italic shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3">
                  {jugador?.nombre[0]}{jugador?.apellido[0]}
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic mb-1">Candidato Seleccionado</p>
                   <p className="text-2xl font-heading font-black text-text-primary uppercase italic leading-none tracking-tighter truncate">
                     {jugador?.nombre} {jugador?.apellido}
                   </p>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">1. Equipo de Destino</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:text-white transition-colors" />
                  <select 
                    value={selectedEquipoId} 
                    onChange={e => setSelectedEquipoId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-bold uppercase italic tracking-tighter appearance-none cursor-pointer"
                  >
                    <option value="">SELECCIONA UN EQUIPO...</option>
                    {equipos?.map(e => <option key={e.id} value={e.id}>{e.nombre.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">2. Temporada Activa</label>
                <div className="relative group">
                  <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warning group-focus-within:text-white transition-colors" />
                  <select 
                    disabled={!selectedEquipoId}
                    value={form.temporada_id} 
                    onChange={e => setForm({...form, temporada_id: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-bold uppercase italic tracking-tighter appearance-none cursor-pointer disabled:opacity-30 disabled:grayscale transition-all"
                  >
                    <option value="">SELECCIONA TEMPORADA...</option>
                    {(temporadas || []).filter(t => t.estado !== 'finalizada').map(t => (
                      <option key={t.id} value={t.id}>{t.nombre.toUpperCase()} ({t.estado.toUpperCase()})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Dorsal</label>
                  <input 
                    type="number" 
                    value={form.dorsal} 
                    onChange={e => setForm({...form, dorsal: e.target.value})} 
                    placeholder="10" 
                    className="w-full px-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-mono font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Posición</label>
                  <div className="relative group">
                    <select 
                      value={form.posicion} 
                      onChange={e => setForm({...form, posicion: e.target.value})} 
                      className="w-full px-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-bold uppercase italic tracking-tighter appearance-none cursor-pointer"
                    >
                      <option value="arquero">Arquero</option>
                      <option value="defensor">Defensor</option>
                      <option value="mediocampista">Mediocampista</option>
                      <option value="delantero">Delantero</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
                  </div>
                </div>
             </div>
          </div>

          <Button 
            type="submit" 
            loading={addMutation.isPending} 
            className="w-full h-20 bg-primary text-bg-deep font-black uppercase italic tracking-tighter text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Finalizar Fichaje
          </Button>
       </form>
    </Modal>
  )
}

