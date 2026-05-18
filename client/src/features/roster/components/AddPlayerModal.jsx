import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { rosterService } from '../../../services/rosterService'
import { useToast } from '../../../components/ui/Toast'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { Search, UserPlus, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'

export default function AddPlayerModal({ open, onClose, onEnroll, initialMode = 'search' }) {
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
      const data = await rosterService.searchJugadores(query)
      setResults(data || [])
    } catch { 
      toast.error('Error al buscar') 
    }
    setSearching(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const newPlayer = await rosterService.createJugador(form)
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
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col border border-white/10 overflow-hidden bg-white/[0.02] transition-all focus-within:border-primary/50 group shadow-2xl">
            {/* Input Section */}
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-primary/10 text-primary group-focus-within:bg-primary group-focus-within:text-bg-deep transition-all z-10">
                <Search className="w-6 h-6 stroke-[3]" />
              </div>
              <input 
                autoFocus
                value={query} 
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="DNI, NOMBRE O APELLIDO..." 
                className="w-full pl-20 pr-6 py-8 bg-transparent border-none outline-none text-lg font-black uppercase italic tracking-[0.05em] placeholder:text-text-dim/20 text-text-primary"
              />
            </div>

            {/* Action Bar (Vertical) */}
            <button 
              disabled={searching}
              onClick={handleSearch}
              className="w-full py-6 bg-primary hover:bg-primary-dim text-bg-deep font-black uppercase italic tracking-[0.3em] text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 relative overflow-hidden group/btn"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              
              {searching ? (
                <div className="flex items-center gap-3">
                  <span className="spinner !w-4 !h-4 !border-bg-deep/30 !border-t-bg-deep" />
                  <span>BUSCANDO...</span>
                </div>
              ) : (
                <>
                  <span className="relative z-10">EJECUTAR BÚSQUEDA GLOBAL</span>
                  <ChevronRight className="w-5 h-5 stroke-[4] group-hover/btn:translate-x-2 transition-transform relative z-10" />
                </>
              )}
            </button>
          </div>

          <div className="max-h-[50vh] sm:max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
             {results.map(j => (
               <div key={j.id} className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group-hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center text-primary font-black text-xl italic border border-white/5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all">
                        {j.nombre[0]}{j.apellido[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-black uppercase italic tracking-normal text-text-primary group-hover:text-primary transition-colors">{j.nombre} {j.apellido}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-[10px] text-text-dim font-bold tracking-widest uppercase italic">DNI: {j.dni || '—'}</p>
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          <p className="text-[10px] text-text-dim font-bold tracking-widest uppercase italic">GLOBAL</p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-12 px-6 bg-white/5 border border-white/10 text-primary font-black italic uppercase tracking-widest text-[10px] hover:bg-primary hover:text-bg-deep transition-all" 
                      onClick={() => { onClose(); onEnroll(j); }}
                    >
                      SELECCIONAR <UserPlus className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
               </div>
             ))}

             {query && results.length === 0 && !searching && (
               <div className="py-16 text-center bg-white/[0.01] rounded-[2.5rem] border-2 border-dashed border-white/5 space-y-6">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative w-20 h-20 bg-bg-surface border border-white/10 rounded-3xl flex items-center justify-center mx-auto opacity-40">
                      <AlertCircle className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-black text-text-dim uppercase italic tracking-normal">Sin coincidencias globales</p>
                    <p className="text-xs text-text-dim/60 font-bold uppercase italic tracking-wide">El jugador aún no existe en el sistema.</p>
                  </div>
                  <Button 
                    onClick={() => setIsCreating(true)} 
                    className="h-14 px-10 bg-white/5 border border-white/10 text-primary hover:bg-primary/10 font-black italic uppercase tracking-widest"
                  >
                    REGISTRAR PERFIL NUEVO
                  </Button>
               </div>
             )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="space-y-8 animate-fade-in">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="space-y-2.5">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] ml-1 italic">Nombre</label>
                <input 
                  type="text" 
                  required 
                  autoFocus
                  placeholder="EJ: JUAN"
                  value={form.nombre} 
                  onChange={e => setForm({...form, nombre: e.target.value})} 
                  className="w-full px-5 py-5 bg-bg-surface border border-white/5 rounded-none outline-none focus:border-primary text-sm font-black uppercase italic tracking-wide placeholder:text-text-dim/20" 
                />
             </div>
             <div className="space-y-2.5">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] ml-1 italic">Apellido</label>
                <input 
                  type="text" 
                  required 
                  placeholder="EJ: PEREZ"
                  value={form.apellido} 
                  onChange={e => setForm({...form, apellido: e.target.value})} 
                  className="w-full px-5 py-5 bg-bg-surface border border-white/5 rounded-none outline-none focus:border-primary text-sm font-black uppercase italic tracking-wide placeholder:text-text-dim/20" 
                />
             </div>
           </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                 <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] ml-1 italic">DNI / Pasaporte</label>
                 <input 
                  type="text" 
                  placeholder="SOLO NÚMEROS"
                  value={form.dni} 
                  onChange={e => setForm({...form, dni: e.target.value})} 
                  className="w-full px-5 py-5 bg-bg-surface border border-white/5 rounded-none outline-none focus:border-primary text-sm font-mono font-black italic placeholder:text-text-dim/20" 
                 />
              </div>
              <div className="space-y-2.5">
                 <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] ml-1 italic">Fecha de Nacimiento</label>
                 <input 
                  type="date" 
                  value={form.fecha_nacimiento} 
                  onChange={e => setForm({...form, fecha_nacimiento: e.target.value})} 
                  className="w-full px-5 py-5 bg-bg-surface border border-white/5 rounded-none outline-none focus:border-primary text-sm font-black italic text-text-primary" 
                 />
              </div>
            </div>
           
           <div className="pt-4 space-y-4">
             <Button noSkew type="submit" className="w-full h-18 bg-primary text-bg-deep font-black uppercase italic tracking-[0.2em] text-lg shadow-2xl shadow-primary/20 group">
                <span className="flex items-center justify-center gap-3">
                  REGISTRAR TALENTO <UserPlus className="w-6 h-6 stroke-[3]" />
                </span>
             </Button>
             <button 
              type="button" 
              onClick={() => setIsCreating(false)} 
              className="w-full text-[10px] font-black text-text-dim uppercase tracking-[0.4em] hover:text-primary transition-all italic flex items-center justify-center gap-2"
             >
                <ChevronLeft className="w-4 h-4" /> VOLVER AL BUSCADOR
             </button>
           </div>
        </form>
      )}
    </Modal>
  )
}
