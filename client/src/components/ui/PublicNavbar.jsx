import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X, LayoutGrid, Info } from 'lucide-react'

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] glass-ultrathin border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LOGO SECTION */}
        <div className="flex items-center gap-12">
          <Link to="/" className="relative group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3"
            >
              <img src="/images/isotipo.png" alt="Cancha Libre" className="h-10 w-auto" />
              <div className="h-6 w-px bg-white/10 hidden sm:block" />
              <span className="hidden sm:block font-heading italic font-black text-lg tracking-tighter text-white group-hover:text-primary transition-colors">
                CANCHA LIBRE
              </span>
            </motion.div>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-10">
            <NavLink to="/ligas" icon={<LayoutGrid className="w-3 h-3" />}>EXPLORAR</NavLink>
            <NavLink to="/nosotros" icon={<Info className="w-3 h-3" />}>NOSOTROS</NavLink>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/login" 
            className="hidden sm:block px-5 py-2 text-[10px] font-black tracking-widest text-text-dim hover:text-primary transition-colors uppercase border border-white/5 hover:border-primary/20"
          >
            INGRESAR
          </Link>
          <Link 
            to="/admin/register" 
            className="aggressive-btn !py-2 !px-6 !text-[11px] shadow-glow-primary active:scale-95"
          >
            ORGANIZAR
          </Link>
          
          {/* MOBILE TOGGLE */}
          <button 
            className="md:hidden p-2 text-white/60 hover:text-primary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-[81px] left-0 right-0 glass-heavy border-b border-white/10 p-8 md:hidden flex flex-col gap-8 overflow-hidden"
          >
            <div className="space-y-6">
              <MobileNavLink to="/ligas" onClick={() => setIsOpen(false)}>EXPLORAR TORNEOS</MobileNavLink>
              <MobileNavLink to="/nosotros" onClick={() => setIsOpen(false)}>NOSOTROS</MobileNavLink>
            </div>
            
            <div className="h-px bg-white/5 w-full" />
            
            <div className="flex flex-col gap-4">
               <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.4em]">Gestión Profesional</p>
               <Link 
                to="/admin/login" 
                onClick={() => setIsOpen(false)}
                className="text-white font-black italic uppercase tracking-widest text-sm py-2"
               >
                Acceso Organizadores
               </Link>
               <Link 
                to="/admin/register" 
                onClick={() => setIsOpen(false)}
                className="text-primary font-black italic uppercase tracking-widest text-sm py-2"
               >
                Fundar mi Liga Ahora
               </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

function NavLink({ to, children, icon }) {
  return (
    <Link 
      to={to} 
      className="flex items-center gap-2 text-[10px] font-black tracking-[0.3em] text-text-secondary hover:text-primary transition-all uppercase relative group"
    >
      {icon && <span className="opacity-40 group-hover:opacity-100 transition-opacity">{icon}</span>}
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-primary transition-all group-hover:w-full" />
    </Link>
  )
}

function MobileNavLink({ to, children, onClick }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="text-3xl font-heading italic font-black text-white hover:text-primary transition-colors flex items-center justify-between group"
    >
      {children}
      <X className="w-5 h-5 opacity-0 group-hover:opacity-40 -rotate-45" />
    </Link>
  )
}
