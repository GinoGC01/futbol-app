import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, Trophy, ArrowRight, Share2, Rss, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/ui/Badge'

export default function Home() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/ligas?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white selection:bg-primary selection:text-black">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/isotipo.png" alt="Cancha Libre" className="h-20" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" active>LIGAS</NavLink>
            <NavLink to="/ligas">TORNEOS</NavLink>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="px-6 py-2 border border-white text-xs font-bold hover:bg-white hover:text-black transition-all">
            INGRESAR
          </Link>
          <Link to="/admin/register" className="px-6 py-2 bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-all">
            ORGANIZAR
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-48 px-6 text-center overflow-hidden">
        {/* Background Isotipo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] opacity-[0.03] pointer-events-none z-0">
          <img src="/images/isotipo.png" alt="" className="w-full h-full object-contain" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <h1 className="text-6xl md:text-8xl font-heading font-black mb-6 tracking-wide leading-[0.9] uppercase">
            TU TORNEO,<br />
            <span className="text-primary italic">NIVEL PROFESIONAL</span>
          </h1>

          <p className="text-text-secondary text-xs md:text-sm font-bold uppercase tracking-[0.3em] mb-12 max-w-2xl mx-auto opacity-70">
            Tabla de posiciones, fixture, goleadores y premios en tiempo real. Organiza como un profesional.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex max-w-2xl mx-auto border-2 border-white/10 bg-black/40 backdrop-blur-md overflow-hidden p-1 focus-within:border-primary/50 transition-all">
            <div className="flex-1 flex items-center px-4">
              <Search className="w-5 h-5 text-white/40 mr-4" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="BUSCAR LIGA, CLUB O CIUDAD..."
                className="w-full bg-transparent border-none outline-none text-sm font-bold uppercase tracking-widest placeholder:text-white/20"
              />
            </div>
            <button 
              type="submit" 
              disabled={searching}
              className="bg-primary text-black px-10 py-3 text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
            >
              {searching ? '...' : 'BUSCAR'}
            </button>
          </form>
        </motion.div>
      </section>

      {/* Featured Section */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
          <h2 className="text-3xl font-heading font-black italic text-primary tracking-wide uppercase">
            LIGAS DESTACADAS
          </h2>
          <Link to="/ligas" className="flex items-center gap-2 text-xs font-bold tracking-widest hover:text-primary transition-all uppercase group">
            Ver todas las ligas <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LeagueCard 
            title="COPA DE CAMPEONES"
            subtitle="32 EQUIPOS • PREMIO $500K"
            badge="LIVE"
            badgeColor="activa"
            cta="VER TORNEO"
          />
          <LeagueCard 
            title="METROPOLITAN ELITE"
            subtitle="16 EQUIPOS • F8 AMATEUR"
            badge="REGISTRO ABIERTO"
            badgeColor="parcial"
            cta="INSCRIBIRSE"
          />
          <LeagueCard 
            title="LIGA NOCTURNA PRO"
            subtitle="24 EQUIPOS • ESTADIO ÚNICO"
            badge="FINAL DE TEMPORADA"
            badgeColor="finalizada"
            cta="VER POSICIONES"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-8 py-16 flex flex-wrap justify-between gap-12">
          <StatItem label="PARTIDOS/MES" value="+2,400" />
          <div className="hidden md:block w-px h-12 bg-white/10" />
          <StatItem label="TORNEOS ACTIVOS" value="150" />
          <div className="hidden md:block w-px h-12 bg-white/10" />
          <StatItem label="ATLETAS REGISTRADOS" value="50K" />
          <div className="hidden md:block w-px h-12 bg-white/10" />
          <StatItem label="CIUDADES" value="12" />
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src="/images/logotipo.png" alt="Cancha Libre" className="h-12" />
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold text-center md:text-left">
              © {new Date().getFullYear()} CANCHA LIBRE. RENDIMIENTO SIN COMPROMISO.
            </p>
          </div>
          
          <div className="flex gap-8">
            <FooterLink>PRIVACIDAD</FooterLink>
            <FooterLink>TÉRMINOS</FooterLink>
            <FooterLink>SOPORTE</FooterLink>
            <FooterLink>API</FooterLink>
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

function NavLink({ to, children, active }) {
  return (
    <Link to={to} className={`text-xs font-bold tracking-[0.2em] transition-all hover:text-primary ${active ? 'text-primary border-b-2 border-primary pb-1' : 'text-white'}`}>
      {children}
    </Link>
  )
}

function LeagueCard({ title, subtitle, badge, badgeColor, cta }) {
  return (
    <div className="relative aspect-[4/5] bg-[#1A1A1A] overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/50 transition-all">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-[#222] transition-transform duration-700 group-hover:scale-110" />
      
      {/* Content */}
      <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
        <div className="mb-4">
          <Badge status={badgeColor} label={badge} className="scale-90 origin-left" />
        </div>
        <h3 className="text-2xl font-heading font-black italic leading-tight mb-1 group-hover:text-primary transition-colors uppercase tracking-normal">
          {title}
        </h3>
        <p className="text-[10px] font-bold text-white/40 tracking-widest mb-8 uppercase">
          {subtitle}
        </p>
        
        <button className="w-full py-4 border border-white text-[11px] font-black tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-all">
          {cta}
        </button>
      </div>
    </div>
  )
}

function StatItem({ label, value }) {
  return (
    <div className="text-center flex-1">
      <p className="text-4xl font-heading font-black text-primary italic tracking-wide mb-1">
        {value}
      </p>
      <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase">
        {label}
      </p>
    </div>
  )
}

function FooterLink({ children }) {
  return (
    <button className="text-[10px] font-bold tracking-widest text-white/40 hover:text-white transition-all uppercase">
      {children}
    </button>
  )
}
