import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, ChevronRight, Trophy, Shield, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('liga')
      .select('id, nombre, slug, zona, tipo_futbol')
      .ilike('nombre', `%${query.trim()}%`)
      .limit(10)
    setResults(data || [])
    setSearching(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <Trophy className="w-3.5 h-3.5" />
            PLATAFORMA DE TORNEOS AMATEUR
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4 leading-tight">
            Tu torneo,{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              nivel profesional
            </span>
          </h1>

          <p className="text-text-secondary text-lg mb-10 max-w-lg mx-auto">
            Tabla de posiciones, fixture, goleadores y premios en tiempo real.
            Organiza como un profesional.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-md mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar liga por nombre..."
                className="w-full pl-10 pr-4 py-3 bg-bg-surface border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <Button type="submit" loading={searching}>
              Buscar
            </Button>
          </form>
        </motion.div>
      </section>

      {/* Results */}
      {results.length > 0 && (
        <section className="max-w-md mx-auto w-full px-6 pb-12">
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-2"
          >
            {results.map((liga, i) => (
              <motion.li
                key={liga.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => navigate(`/liga/${liga.slug}`)}
                  className="w-full flex items-center gap-4 p-4 glass rounded-xl text-left transition-all hover:border-border-accent hover:-translate-y-0.5 group"
                >
                  <div className="w-11 h-11 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{liga.nombre}</p>
                    <p className="text-xs text-text-dim">{liga.zona} · {liga.tipo_futbol?.toUpperCase()}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors" />
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto py-8 text-center border-t border-border-subtle">
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 text-sm text-text-dim hover:text-primary transition-colors"
        >
          Acceso para organizadores <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </footer>
    </div>
  )
}
