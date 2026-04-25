import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import BottomNav from '../components/layout/BottomNav'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Globe, ChevronDown, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LigaProvider, useLigaActiva } from '../context/LigaContext'

function AdminLayoutContent() {
  const { user, signOut } = useAuth()
  const { liga, setLiga, ligas } = useLigaActiva()

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="lg:hidden text-lg font-heading font-bold text-primary tracking-tight mr-2">
              L<span className="text-text-primary">A</span>
            </span>
            
            {/* Liga Selector */}
            {ligas.length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-elevated border border-border-subtle hover:border-primary/50 transition-all text-left max-w-[180px] sm:max-w-[240px]">
                  <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-xs font-bold truncate">
                    {liga?.nombre || 'Seleccionar Liga'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-text-dim group-hover:text-primary transition-colors shrink-0" />
                </button>
                
                {ligas.length > 1 && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-bg-surface border border-border-subtle rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <div className="p-1.5 flex flex-col">
                      {ligas.map(l => (
                        <button
                          key={l.id}
                          onClick={() => setLiga(l)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            l.id === liga?.id 
                              ? 'bg-primary/10 text-primary' 
                              : 'hover:bg-bg-elevated text-text-secondary'
                          }`}
                        >
                          {l.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-dim hover:text-primary transition-colors"
              title="Ver portal público"
            >
              <Globe className="w-4 h-4" />
            </Link>

            <span className="text-xs text-text-dim hidden md:block truncate max-w-[160px]">
              {user?.email}
            </span>

            <button
              onClick={signOut}
              className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-dim hover:text-danger transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
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
