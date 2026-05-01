import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Trophy, Users, Swords, Award, ChevronLeft, ChevronRight, User, Settings } from 'lucide-react'
import { useState } from 'react'

const links = [
  { to: '/admin',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/torneo',  icon: Trophy,          label: 'Torneo' },
  { to: '/admin/roster',  icon: Users,           label: 'Equipos' },
  { to: '/admin/jugadores', icon: User,           label: 'Jugadores' },
  { to: '/admin/partidos',icon: Swords,          label: 'Partidos' },
  { to: '/admin/premios', icon: Award,           label: 'Premios' },
  { to: '/admin/settings', icon: Settings,        label: 'Configuración' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`
      hidden lg:flex flex-col h-screen sticky top-0
      bg-bg-surface border-r border-border-subtle
      transition-all duration-300 shrink-0
      ${collapsed ? 'w-[68px]' : 'w-[220px]'}
    `}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border-subtle px-4 bg-bg-deep/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/images/isotipo.png" alt="" className="h-8 w-8 object-contain" />
            <span className="text-xl font-heading font-bold text-primary tracking-wider uppercase italic">
              Cancha<span className="text-text-primary">Libre</span>
            </span>
          </div>
        )}
        {collapsed && <img src="/images/isotipo.png" alt="C" className="h-8 w-8 object-contain" />}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-lg
              text-xs font-heading tracking-widest uppercase transition-all duration-300
              ${isActive
                ? 'bg-primary text-bg-deep shadow-[0_0_20px_rgba(206,222,11,0.3)] skew-x-[-12deg]'
                : 'text-text-secondary hover:text-primary hover:translate-x-1'
              }
            `}
          >
            {({ isActive }) => (
              <div className={`${isActive ? 'skew-x-[12deg]' : ''} flex items-center gap-3`}>
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-bg-deep' : ''}`} />
                {!collapsed && <span>{label}</span>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="h-12 flex items-center justify-center border-t border-border-subtle text-text-dim hover:text-primary transition-colors bg-bg-deep/30"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
