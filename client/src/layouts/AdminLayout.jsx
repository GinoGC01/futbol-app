import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import BottomNav from '../components/layout/BottomNav'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-bg-deep">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="lg:hidden text-lg font-heading font-bold text-primary tracking-tight">
              Liga<span className="text-text-primary">Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-dim hover:text-primary transition-colors"
              title="Ver portal público"
            >
              <Globe className="w-4 h-4" />
            </Link>

            <span className="text-xs text-text-dim hidden sm:block truncate max-w-[160px]">
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
