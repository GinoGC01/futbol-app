import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, Trophy, ArrowRight, Target, Zap, Users, MapPin } from 'lucide-react'

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
    <div className="text-text-primary">
      {/* Hero Section */}
      <section className="relative pb-32 md:pt-12 md:pb-56 px-6 text-center flex flex-col justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/60">Plataforma #1 para Gestión de Ligas</span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-9xl font-heading font-black mb-8 tracking-tight leading-[0.85] uppercase">
            TU TORNEO<br />
            <span className="text-primary italic drop-shadow-[0_0_15px_rgba(206,222,11,0.3)]">NIVEL PROFESIONAL</span>
          </h1>

          <p className="text-text-secondary text-[10px] md:text-sm font-black uppercase tracking-widest mb-12 max-w-2xl mx-auto opacity-60 leading-relaxed">
            Estadísticas, fixtures y resultados en tiempo real. <br className="hidden md:block" />
            Diseñado para los que no aceptan menos que la excelencia.
          </p>

          {/* Premium Search Architecture */}
          <div className="relative mx-auto max-w-4xl group mt-8 px-4 md:px-8">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 rounded-full" />
            
            {/* Skewed Form Container */}
            <form 
              onSubmit={handleSearch}
              className="relative -skew-x-6 md:-skew-x-12 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 md:p-2 group-focus-within:border-primary/40 group-focus-within:bg-black/60 transition-all duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-stretch h-16 md:h-20"
            >
              {/* Unskewed Content Wrapper for Input */}
              <div className="flex-1 flex items-center pl-6 md:pl-10 relative skew-x-6 md:skew-x-12">
                <Search className="w-5 h-5 md:w-6 md:h-6 text-white/30 group-focus-within:text-primary transition-colors duration-300 drop-shadow-[0_0_8px_rgba(206,222,11,0)] group-focus-within:drop-shadow-[0_0_8px_rgba(206,222,11,0.5)]" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="EXPLORAR LIGAS, EQUIPOS O CIUDADES..."
                  className="w-full bg-transparent border-none py-2 px-4 md:px-6 outline-none text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-white placeholder:text-white/20"
                />
              </div>

              {/* Action Button */}
              <button 
                type="submit"
                disabled={searching}
                className="relative overflow-hidden bg-primary text-black px-6 md:px-12 flex items-center justify-center gap-3 hover:bg-[#d8eb0c] hover:shadow-[0_0_20px_rgba(206,222,11,0.4)] transition-all active:scale-95 group/btn"
              >
                {/* Button shine effect */}
                <div className="absolute top-0 -left-[100%] h-full w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-30 group-hover/btn:left-[200%] transition-all duration-700 ease-in-out skew-x-12" />
                
                <div className="flex items-center gap-2 md:gap-3 skew-x-6 md:skew-x-12">
                  {searching ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="font-heading italic font-black text-sm md:text-lg tracking-widest mt-0.5">BUSCAR</span>
                      <ArrowRight className="w-4 h-4 md:w-6 md:h-6 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-white/5 bg-white/[0.01] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          <StatItem label="PARTIDOS / MES" value="+2.4K" icon={<Target className="w-4 h-4" />} />
          <StatItem label="LIGAS ACTIVAS" value="150+" icon={<Trophy className="w-4 h-4" />} />
          <StatItem label="ATLETAS" value="50K" icon={<Users className="w-4 h-4" />} />
          <StatItem label="CIUDADES" value="12" icon={<MapPin className="w-4 h-4" />} />
        </div>
      </section>
    </div>
  )
}

function StatItem({ label, value, icon }) {
  return (
    <div className="text-center group">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 mb-4 group-hover:border-primary/40 transition-all">
        <span className="text-text-secondary group-hover:text-primary transition-colors">{icon}</span>
      </div>
      <p className="text-4xl md:text-5xl font-heading font-black text-primary italic tracking-tight mb-1 group-hover:scale-110 transition-transform">
        {value}
      </p>
      <p className="text-[9px] font-black text-text-dim tracking-[0.3em] uppercase">
        {label}
      </p>
    </div>
  )
}
