import { Link, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import PublicNavbar from '../components/ui/PublicNavbar'

export default function PublicLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary selection:bg-primary selection:text-black flex flex-col relative overflow-x-hidden">
      
      {/* GLOBAL BACKGROUND DECORATION */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden fixed">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] grayscale">
          <img src="/images/isotipo.png" alt="" className="w-full h-full object-contain scale-150" />
        </div>
      </div>

      <PublicNavbar />

      {/* PAGE CONTENT */}
      <main className="flex-1 relative z-10 pt-20">
        <Outlet />
      </main>

      {/* SHARED PUBLIC FOOTER */}
      <footer className="relative z-10 py-12 text-center border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <img src="/images/logotipo.png" alt="Cancha Libre" className="h-6 opacity-30 mx-auto mb-6 grayscale" />
          <p className="text-[9px] font-bold text-text-dim uppercase tracking-[0.3em] leading-loose opacity-50">
            Cancha Libre v2.5 <br />
            "En el asfalto no hay excusas, solo resultados."
          </p>
          
          <div className="mt-8 flex justify-center gap-8 text-[9px] font-black text-text-dim tracking-widest uppercase">
            <Link to="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
            <Link to="/terminos" className="hover:text-primary transition-colors">Términos</Link>
            <Link to="/ayuda" className="hover:text-primary transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
