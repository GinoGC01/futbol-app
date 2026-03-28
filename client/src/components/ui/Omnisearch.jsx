import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import * as Dialog from '@radix-ui/react-dialog'
import { Search, Trophy, Shield, Users, Target, Rocket, Settings, Calendar, Award } from 'lucide-react'
import { adminService } from '../../services/adminService'

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export default function Omnisearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ ligas: [], jugadores: [] })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const debouncedQuery = useDebounce(query, 300)

  // Toggle with CMD+K / CTRL+K
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Auto-focus logic can be delegated to Radix Dialog automatically
  const performSearch = useCallback(async (q) => {
    if (!q) {
      setResults({ ligas: [], jugadores: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      // 1. Fetch ligas and filter
      const ligasRes = await adminService.getLigas().catch(() => ({ data: [] }))
      const allLigas = ligasRes.data || []
      const matchedLigas = allLigas.filter((l) =>
        l.nombre.toLowerCase().includes(q.toLowerCase())
      )

      // 2. Fetch jugadores from backend
      const jugRes = await adminService.searchJugadores(q).catch(() => ({ data: [] }))
      const matchedJugadores = jugRes.data || []

      setResults({ ligas: matchedLigas, jugadores: matchedJugadores })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    performSearch(debouncedQuery)
  }, [debouncedQuery, performSearch])

  const handleSelect = (path) => {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  const quickActions = [
    { label: 'Torneos & Ligas', icon: Trophy, path: '/admin/torneo' },
    { label: 'Gestión de Equipos', icon: Users, path: '/admin/roster' },
    { label: 'Fixture & Resultados', icon: Calendar, path: '/admin/partidos' },
    { label: 'Sala de Premiaciones', icon: Award, path: '/admin/premios' }
  ]

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-bg-deep/80 backdrop-blur-md"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-[15%] left-[50%] z-50 w-full max-w-2xl translate-x-[-50%] overflow-hidden rounded-xl glass-ultrathin bg-bg-surface/80 p-0 shadow-2xl"
              >
                {/* Search Header */}
                <div className="flex items-center border-b border-white/[0.08] px-4 py-3">
                  <Search className="h-5 w-5 text-text-dim" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Busca ligas, jugadores o navega en el sistema..."
                    className="flex-1 bg-transparent px-4 py-2 text-text-primary outline-none placeholder:text-text-dim/60 font-medium"
                    autoFocus
                  />
                  {loading && <div className="spinner h-4 w-4 border-2" />}
                  <div className="ml-2 flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-text-dim border border-white/10">
                    <span className="text-xs">esc</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-none">
                  {!query && (
                    <div className="p-2">
                      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-widest text-text-dim">
                        Acciones Rápidas (Admin)
                      </p>
                      <div className="grid gap-1">
                        {quickActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelect(action.path)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-text-secondary hover:bg-white/5 hover:text-primary transition-colors focus:bg-white/5 focus:outline-none"
                          >
                            <action.icon className="h-4 w-4" />
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {query && !loading && results.ligas.length === 0 && results.jugadores.length === 0 && (
                    <div className="p-10 text-center text-text-dim">
                      <Target className="mx-auto mb-3 h-8 w-8 opacity-20" />
                      <p className="text-sm">No se encontraron resultados para "{query}"</p>
                    </div>
                  )}

                  {results.ligas.length > 0 && (
                    <div className="mb-4 p-2">
                      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                        Ligas Profesionales
                      </p>
                      <div className="grid gap-1">
                        {results.ligas.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => handleSelect(`/liga/${l.slug}`)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-primary/10 transition-colors focus:bg-primary/10 focus:outline-none group"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 border border-white/10 group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{l.nombre}</p>
                              <p className="text-[11px] text-text-dim">{l.zona} · {l.tipo_futbol}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.jugadores.length > 0 && (
                    <div className="mb-2 p-2">
                      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-widest text-secondary">
                        Jugadores & Plantel
                      </p>
                      <div className="grid gap-1">
                        {results.jugadores.map((j) => (
                          <button
                            key={j.id}
                            onClick={() => handleSelect(`/jugador/${j.id}`)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-text-primary hover:bg-secondary/10 transition-colors focus:bg-secondary/10 focus:outline-none group"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:border-secondary/30 group-hover:bg-secondary/5 transition-colors overflow-hidden">
                              {j.foto_url ? (
                                <img src={j.foto_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Users className="h-4 w-4 text-secondary" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{j.nombre} {j.apellido}</p>
                              <p className="text-[11px] text-text-dim">DNI: {j.dni}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
