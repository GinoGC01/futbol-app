import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Home, ChevronLeft, Search, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-deep text-text-primary selection:bg-primary selection:text-black flex flex-col relative overflow-hidden">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-primary/5 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-secondary/5 blur-[140px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* LARGE WATERMARK */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] select-none pointer-events-none">
          <h1 className="text-[30vw] font-black italic tracking-tighter uppercase leading-none text-white text-center">
            404
          </h1>
        </div>
      </div>

      {/* HEADER */}
      <header className="relative z-20 flex items-center justify-between p-6 md:px-12 md:py-8 w-full max-w-7xl mx-auto">
        <Link to="/" className="group flex items-center gap-2">
          <img src="/images/isotipo.png" alt="Cancha Libre" className="h-8 md:h-10 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-text-secondary group-hover:text-primary transition-colors">
            CANCHA LIBRE
          </span>
        </Link>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-2xl text-center">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8 relative inline-block"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <h2 className="text-[120px] md:text-[200px] font-heading font-black italic tracking-tighter leading-none uppercase mb-0 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 relative z-10">
              404
            </h2>
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-primary text-bg-deep p-3 rounded-none skew-x-[-10deg]"
            >
              <AlertTriangle className="w-8 h-8" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h3 className="text-3xl md:text-5xl font-heading font-black italic tracking-tighter uppercase mb-4 text-white">
              FUERA DE JUEGO
            </h3>
            <p className="text-text-secondary text-sm md:text-base font-medium max-w-md mx-auto mb-10 leading-relaxed">
              La página que buscas no existe o ha sido movida a otra posición en el campo. <br className="hidden md:block" /> 
              No te preocupes, el partido sigue.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/" 
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary text-bg-deep font-heading text-lg italic font-black uppercase tracking-tighter hover:bg-white transition-all active:scale-95 group"
              >
                <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                VOLVER AL INICIO
              </Link>
              
              <Link 
                to="/ligas" 
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border border-white/10 text-white font-heading text-lg italic font-black uppercase tracking-tighter hover:bg-white/5 hover:border-primary/50 transition-all active:scale-95 group"
              >
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                EXPLORAR LIGAS
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* FOOTER ACCENT */}
      <footer className="relative z-20 p-8 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-px w-12 bg-white/10" />
          <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.4em]">CANCHA LIBRE SPORTS TECH</span>
          <div className="h-px w-12 bg-white/10" />
        </div>
      </footer>
    </div>
  )
}
