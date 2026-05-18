import { useState, useEffect } from 'react'
import { useJugadoresLiga, useJugadoresOrganizador, useSearchGlobalJugadores } from '../../../hooks/useAdmin'
import Loader from '../../../components/ui/Loader'
import Button from '../../../components/ui/Button'
import { Trophy, Search, UserPlus, CheckSquare, X, ChevronLeft, ChevronRight, User, Shield, Plus } from 'lucide-react'
import { useLigaActiva } from '../../../context/LigaContext'

// Import Split Subcomponents
import PlayerCard from './PlayerCard'
import AddPlayerModal from './AddPlayerModal'
import EnrollPlayerModal from './EnrollPlayerModal'
import BatchFichajeModal from './BatchFichajeModal'

export default function PlayerManager() {
  const { liga } = useLigaActiva()
  const [globalPage, setGlobalPage] = useState(1)
  const { data: jugadores, isLoading } = useJugadoresLiga(liga?.id)
  const { data: allJugadoresRaw, isFetching: isFetchingMarket } = useJugadoresOrganizador(globalPage, 12)
  const allJugadores = allJugadoresRaw?.list || []
  const totalPages = allJugadoresRaw?.totalPages || 1
  const totalCount = allJugadoresRaw?.count || 0
  
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showAdd, setShowAdd] = useState({ open: false, mode: 'search' })
  const [selectedForEnroll, setSelectedForEnroll] = useState(null)
  
  // Selection Mode State
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [showBatchFichaje, setShowBatchFichaje] = useState(false)

  const toggleSelection = (player) => {
    setSelectedPlayers(prev => {
      const exists = prev.find(p => p.id === player.id)
      if (exists) return prev.filter(p => p.id !== player.id)
      return [...prev, player]
    })
  }

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

  if (isLoading) return <Loader text="Cargando jugadores de la liga..." className="py-20" />

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-32 px-4 sm:px-0">
      {/* Full Screen Loader for Market Transitions */}
      {isFetchingMarket && (
        <Loader fullScreen text="SINCRONIZANDO MERCADO GLOBAL..." size="xl" />
      )}
      {/* Header Sección - Optimized for Mobile */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-6 sm:pb-10">
        <div className="space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Talent Portal
          </div>
          <div className="relative pt-1 sm:pt-2">
            <h1 className="text-3xl sm:text-6xl font-heading font-black tracking-wide leading-none uppercase italic">
              Gestión de <span className="text-primary">Jugadores</span>
            </h1>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-full bg-primary/30 skew-x-[-15deg] hidden lg:block" />
          </div>
          <p className="text-xs sm:text-base text-text-dim max-w-md font-medium leading-tight italic uppercase tracking-normal">
             {liga?.nombre ? "Descubre, ficha y asigna talento a los clubes de ".concat(liga.nombre, ".") : "Crea una liga para comenzar"}.
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
          {!selectionMode ? (
            <>
              <Button 
                variant="primary" 
                onClick={() => setShowAdd({ open: true, mode: 'search' })}
                className="col-span-2 h-14 sm:h-16 px-8 font-black uppercase italic tracking-widest shadow-xl shadow-primary/20 order-first lg:order-last sm:flex-1 lg:flex-none"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 mr-2 stroke-[4]" /> Fichar Global
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowAdd({ open: true, mode: 'create' })}
                className="h-12 sm:h-14 px-4 bg-white/5 border border-white/10 text-text-dim hover:text-primary font-black uppercase italic tracking-wide text-[10px] sm:text-xs"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Crear
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectionMode(true)
                  setSelectedPlayers([])
                }}
                className="h-12 sm:h-14 px-4 bg-white/5 border border-white/10 text-text-dim hover:text-primary font-black uppercase italic tracking-wide text-[10px] sm:text-xs"
              >
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> En Bloque
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectionMode(false)
                setSelectedPlayers([])
              }}
              className="col-span-2 h-14 sm:h-16 px-6 font-black uppercase italic tracking-widest border bg-primary text-bg-deep border-primary shadow-lg shadow-primary/20"
            >
              <X className="w-5 h-5 mr-2 stroke-[3]" /> Cancelar Selección
            </Button>
          )}
        </div>
      </div>

      {/* Floating Selection Bar - Refined Aggressive Style */}
      {selectionMode && selectedPlayers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg animate-slide-up">
          <div className="bg-bg-deep/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-2 sm:p-3 flex items-center justify-between shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            {/* Background accent line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <div className="flex items-center gap-3 sm:gap-5 pl-2 sm:pl-4">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-primary blur-md opacity-30 animate-pulse-live" />
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-primary text-bg-deep rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl italic shadow-lg skew-x-[-10deg]">
                  <span className="skew-x-[10deg]">{selectedPlayers.length}</span>
                </div>
              </div>
              <div className="hidden xs:block">
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-0.5 italic leading-none">Seleccionados</p>
                <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider italic leading-none">Roster en espera</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pr-1">
              <button 
                onClick={() => {
                  setSelectionMode(false)
                  setSelectedPlayers([])
                }}
                className="h-11 sm:h-12 px-4 sm:px-6 rounded-xl font-black uppercase italic tracking-widest text-[9px] sm:text-[10px] text-text-dim hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <Button 
                onClick={() => setShowBatchFichaje(true)}
                className="h-11 sm:h-12 px-6 sm:px-8 bg-primary text-bg-deep font-black uppercase italic tracking-widest text-[10px] sm:text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all skew-x-[-15deg] group/btn"
              >
                <div className="flex items-center gap-2 skew-x-[15deg]">
                  Continuar <ChevronRight className="w-4 h-4 stroke-[4] group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}

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
            className="w-full pl-16 pr-4 py-6 bg-bg-surface border border-white/5 rounded-3xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-black text-sm uppercase italic tracking-wide placeholder:text-text-dim/40 text-text-primary"
          />
        </div>
        
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-1 lg:w-40 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-bg-surface border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-full bg-primary/5 skew-x-[-20deg] translate-x-6 pointer-events-none" />
            <p className="text-[9px] sm:text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Total Liga</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-primary italic leading-none">{jugadores?.length || 0}</p>
          </div>
          <div className="flex-1 lg:w-40 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-bg-surface border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-full bg-secondary/5 skew-x-[-20deg] translate-x-6 pointer-events-none" />
            <p className="text-[9px] sm:text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-0.5 sm:mb-1">Filtrados</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-text-primary italic leading-none">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="space-y-8">
        {/* Current Roster */}
        {filtered.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-success uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <Trophy className="w-3.5 h-3.5" /> Jugadores en esta Liga
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(jugador => (
                <PlayerCard 
                  key={jugador.id} 
                  jugador={jugador} 
                  onEnroll={() => setSelectedForEnroll(jugador)} 
                  selectionMode={selectionMode}
                  isSelected={selectedPlayers.some(p => p.id === jugador.id)}
                  onToggle={() => toggleSelection(jugador)}
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
            
            {/* Pagination Controls - Moved to top for better Mobile UX */}
            {debouncedQuery.length < 2 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 sm:py-6 border-b sm:border-t border-white/5 mb-2 sm:mb-0 sm:mt-6">
                <div className="text-center sm:text-left order-2 sm:order-1">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] italic">
                    Mostrando <span className="text-primary">{(globalPage - 1) * 12 + 1} - {Math.min(globalPage * 12, totalCount)}</span> de {totalCount}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setGlobalPage(p => Math.max(1, p - 1))}
                    disabled={globalPage === 1}
                    className="h-10 w-10 sm:h-8 sm:w-8 p-0 border-white/10 hover:border-primary/50 text-text-primary bg-bg-surface"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
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
                          className={`w-9 h-9 sm:w-8 sm:h-8 rounded-xl text-xs font-black transition-all ${
                            globalPage === pageNum 
                              ? 'bg-primary text-bg-deep skew-x-[-12deg]' 
                              : 'text-text-dim hover:bg-white/5'
                          }`}
                        >
                          <span className={globalPage === pageNum ? 'skew-x-[12deg] block' : ''}>{pageNum}</span>
                        </button>
                      );
                    })}
                  </div>

                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => setGlobalPage(p => Math.min(totalPages, p + 1))}
                    disabled={globalPage === totalPages}
                    className="h-10 w-10 sm:h-8 sm:w-8 p-0 border-white/10 hover:border-primary/50 text-text-primary bg-bg-surface"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${isSearching || isFetchingMarket ? 'opacity-50' : 'opacity-100'}`}>
              {globalMatches.map(jugador => (
                <PlayerCard 
                  key={jugador.id} 
                  jugador={jugador} 
                  isGlobal={true}
                  onEnroll={() => setSelectedForEnroll(jugador)} 
                  selectionMode={selectionMode}
                  isSelected={selectedPlayers.some(p => p.id === jugador.id)}
                  onToggle={() => toggleSelection(jugador)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty Search State */}
        {((query && filtered.length === 0 && globalMatches.length === 0 && !isSearching && !isFetchingMarket) || 
          (!query && totalCount === 0 && !isFetchingMarket)) && (
          <div className="py-24 text-center space-y-8 animate-fade-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse-live" />
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-bg-surface border-2 border-dashed border-white/10 flex items-center justify-center mx-auto mb-6">
                <User className="w-12 h-12 sm:w-16 sm:h-16 text-text-dim opacity-30 animate-pulse" />
              </div>
            </div>
            <div className="space-y-4 max-w-sm mx-auto">
              <h3 className="text-2xl sm:text-3xl font-heading font-black tracking-wide uppercase italic">
                {query ? 'Sin Resultados' : 'Sin Jugadores'}
              </h3>
              <p className="text-sm text-text-dim font-medium uppercase tracking-normal italic">
                {query 
                  ? 'No encontramos coincidencias para tu búsqueda. Intenta con otro término o explora el mercado global.' 
                  : 'Tu liga aún no tiene registros de talento. Comienza fichando desde el mercado global ahora mismo.'}
              </p>
            </div>
            <Button 
              onClick={() => setShowAdd({ open: true, mode: 'search' })} 
              className="h-16 px-10 bg-primary text-bg-deep font-black uppercase italic tracking-wide shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
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

      <BatchFichajeModal 
        open={showBatchFichaje}
        onClose={() => setShowBatchFichaje(false)}
        selectedPlayers={selectedPlayers}
        setSelectedPlayers={setSelectedPlayers}
        ligaId={liga?.id}
        onSuccess={() => {
          setSelectionMode(false)
          setSelectedPlayers([])
        }}
      />
    </div>
  )
}
