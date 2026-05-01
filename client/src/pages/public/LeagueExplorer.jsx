import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Shield, ChevronLeft, ChevronRight, Trophy, Share2, Rss, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/ui/Badge'

export default function LeagueExplorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [ligas, setLigas] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const PAGE_SIZE = 5
  const currentPage = parseInt(searchParams.get('page') || '1')
  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    async function fetchLigas() {
      setLoading(true)

      let query = supabase
        .from('liga')
        .select('id, nombre, slug, zona, tipo_futbol, created_at', { count: 'exact' })

      if (searchQuery) {
        query = query.ilike('nombre', `%${searchQuery}%`)
      }

      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (!error) {
        setLigas(data || [])
        setTotalCount(count || 0)
      }
      setLoading(false)
    }

    fetchLigas()
  }, [currentPage, searchQuery])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function handleSearch(e) {
    e.preventDefault()
    const queryTerm = e.target.search.value
    setSearchParams({ q: queryTerm, page: '1' })
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > totalPages) return
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white selection:bg-primary selection:text-black">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/isotipo.png" alt="Cancha Libre" className="md:h-20 h-16" />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="px-6 py-2 border border-white text-xs font-bold hover:bg-white hover:text-black transition-all">
            INGRESAR
          </Link>
          <Link to="/admin/register" className="px-6 py-2 bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-all">
            ORGANIZAR
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <h1 className="text-5xl md:text-7xl font-heading font-black italic tracking-wide uppercase mb-4">
              EXPLORADOR <span className="text-primary">DE LIGAS</span>
            </h1>
            <p className="text-text-secondary text-sm font-bold uppercase tracking-[0.2em] opacity-80">
              Descubrí torneos y ligas competitivas en tu región. {totalCount} resultados encontrados.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex border-2 border-white/10 bg-black/40 backdrop-blur-md overflow-hidden p-1 focus-within:border-primary/50 transition-all w-full md:w-96">
            <div className="flex-1 flex items-center px-4">
              <Search className="w-4 h-4 text-white/40 mr-3" />
              <input
                name="search"
                type="text"
                defaultValue={searchQuery}
                placeholder="BUSCAR..."
                className="w-full bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest placeholder:text-white/20"
              />
            </div>
            <button type="submit" className="bg-primary text-black px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-primary/90">
              OK
            </button>
          </form>
        </div>

        <div className="space-y-4 min-h-[600px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 flex flex-col items-center justify-center gap-4"
              >
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-xs font-bold tracking-widest text-text-dim">SINCRONIZANDO LIGAS...</p>
              </motion.div>
            ) : ligas.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4"
              >
                {ligas.map((liga, i) => (
                  <motion.div
                    key={liga.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      to={`/liga/${liga.slug}`}
                      className="group flex flex-col md:flex-row items-center gap-6 p-6 bg-white/[0.02] border border-white/5 hover:border-primary/40 transition-all relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/[0.02] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />

                      <div className="w-20 h-20 bg-bg-surface flex items-center justify-center shrink-0 border border-white/5 group-hover:border-primary/20 transition-all relative z-10">
                        <Shield className="w-10 h-10 text-white/20 group-hover:text-primary transition-all duration-300" />
                      </div>

                      <div className="flex-1 text-center md:text-left relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                          <h3 className="text-2xl font-heading font-black italic tracking-normal group-hover:text-primary transition-colors uppercase">
                            {liga.nombre}
                          </h3>
                          <Badge status="activa" label="REGISTRO ABIERTO" className="scale-75 origin-left" />
                        </div>
                        <p className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">
                          {liga.zona} • {liga.tipo_futbol?.toUpperCase()} • CREADA {new Date(liga.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-8 relative z-10">
                        <div className="hidden lg:block text-right">
                          <p className="text-xs font-black tracking-widest text-primary italic">LIGA ACTIVA</p>
                          <p className="text-[9px] font-bold text-white/40 uppercase">TEMPORADA 2024</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                          <ChevronRight className="w-6 h-6 group-hover:text-black transition-all" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 text-center"
              >
                <Trophy className="w-16 h-16 text-white/10 mx-auto mb-6" />
                <h2 className="text-2xl font-heading font-bold text-text-dim italic">NO ENCONTRAMOS LIGAS</h2>
                <p className="text-sm text-text-dim tracking-widest mt-2 uppercase">PROBÁ CON OTROS TÉRMINOS DE BÚSQUEDA</p>
                <button
                  onClick={() => setSearchParams({ page: '1' })}
                  className="mt-8 text-xs font-black text-primary border-b border-primary hover:text-white hover:border-white transition-all uppercase tracking-widest"
                >
                  LIMPIAR FILTROS
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-12 h-12 text-sm font-black transition-all border ${currentPage === i + 1
                    ? 'bg-primary text-black border-primary'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src="/images/logotipo.png" alt="Cancha Libre" className="h-10" />
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
              © {new Date().getFullYear()} CANCHA LIBRE. RENDIMIENTO SIN COMPROMISO.
            </p>
          </div>

          <div className="flex gap-8 text-[10px] font-bold tracking-widest text-white/40 uppercase">
            <button className="hover:text-white transition-all">PRIVACIDAD</button>
            <button className="hover:text-white transition-all">TÉRMINOS</button>
            <button className="hover:text-white transition-all">SOPORTE</button>
            <button className="hover:text-white transition-all">API</button>
          </div>

          <div className="flex gap-6">
            <button className="text-white/60 hover:text-primary transition-all"><Share2 className="w-5 h-5" /></button>
            <button className="text-white/60 hover:text-primary transition-all"><Rss className="w-5 h-5" /></button>
            <button className="text-white/60 hover:text-primary transition-all"><Users className="w-5 h-5" /></button>
          </div>
        </div>
      </footer>
    </div>
  )
}
