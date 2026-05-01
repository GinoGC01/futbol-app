import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import BottomNav from '../components/layout/BottomNav'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Globe, ChevronDown, Shield, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LigaProvider, useLigaActiva } from '../context/LigaContext'
import { useAlertas } from '../hooks/useAdmin'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/ui/Toast'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

function AdminLayoutContent() {
  const { user, signOut } = useAuth()
  const { liga, setLiga, ligas } = useLigaActiva()
  const { data: alerts } = useAlertas(liga?.id)
  const toast = useToast()
  const queryClient = useQueryClient()

  // Real-time subscription
  useEffect(() => {
    if (!liga?.id) return

    const channel = supabase
      .channel('public:alerta')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerta', filter: `liga_id=eq.${liga.id}` },
        (payload) => {
          // Toast notification
          toast.info(`Nueva Alerta: ${payload.new.mensaje}`)
          // Invalidate queries to refresh list
          queryClient.invalidateQueries({ queryKey: ['alertas', liga.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [liga?.id])

  const unreadCount = alerts?.length || 0

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-white/5 bg-bg-surface/80 backdrop-blur-xl sticky top-0 z-30 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex items-center gap-2 mr-2">
              <img src="/images/isotipo.png" alt="" className="h-8 w-8 object-contain" />
              <span className="text-xl font-heading font-bold text-primary tracking-wide uppercase italic">
                C<span className="text-text-primary">L</span>
              </span>
            </div>
            
            {/* Liga Selector */}
            {ligas.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-3 px-4 py-2 bg-bg-deep/50 border border-white/5 hover:border-primary/50 transition-all skew-x-[-12deg] group">
                  <div className="skew-x-[12deg] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">
                      {liga?.nombre || 'Seleccionar Liga'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-text-dim group-hover:text-primary transition-colors" />
                  </div>
                </button>
                
                {ligas.length > 1 && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-bg-surface border border-white/10 rounded-none shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <div className="p-2 flex flex-col gap-1">
                      {ligas.map(l => (
                        <button
                          key={l.id}
                          onClick={() => setLiga(l)}
                          className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                            l.id === liga?.id 
                              ? 'bg-primary text-bg-deep skew-x-[-8deg]' 
                              : 'hover:bg-white/5 text-text-secondary hover:text-primary'
                          }`}
                        >
                          <span className={l.id === liga?.id ? 'skew-x-[8deg] block' : ''}>{l.nombre}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Link
                to="/admin"
                className="w-10 h-10 bg-white/5 flex items-center justify-center text-text-dim hover:text-primary transition-all skew-x-[-12deg] group"
                title="Alertas"
              >
                <Bell className="w-5 h-5 skew-x-[12deg] group-hover:scale-110" />
              </Link>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-[10px] font-black text-white flex items-center justify-center rounded-none border-2 border-bg-surface animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>

            <Link
              to="/"
              className="w-10 h-10 bg-white/5 flex items-center justify-center text-text-dim hover:text-primary transition-all skew-x-[-12deg] group"
              title="Ver portal público"
            >
              <Globe className="w-5 h-5 skew-x-[12deg] group-hover:scale-110" />
            </Link>

            <div className="hidden md:flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">{user?.email?.split('@')[0]}</span>
              <span className="text-[9px] text-primary/50 font-bold uppercase tracking-wide">Administrator</span>
            </div>

            <button
              onClick={signOut}
              className="w-10 h-10 bg-danger/10 flex items-center justify-center text-danger hover:bg-danger hover:text-white transition-all skew-x-[-12deg] group"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5 skew-x-[12deg] group-hover:scale-110" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}

export default function AdminLayout() {
  return (
    <LigaProvider>
      <AdminLayoutContent />
    </LigaProvider>
  )
}
