import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Trophy, Users, Swords, Award, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { useState } from 'react'

const links = [
  { to: '/admin',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/torneo',  icon: Trophy,          label: 'Torneo' },
  { to: '/admin/roster',  icon: Users,           label: 'Equipos' },
  { to: '/admin/jugadores', icon: User,           label: 'Jugadores' },
  { to: '/admin/partidos',icon: Swords,          label: 'Partidos' },
  { to: '/admin/premios', icon: Award,           label: 'Premios' },
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
      <div className="h-16 flex items-center justify-center border-b border-border-subtle px-4">
        {!collapsed && (
          <span className="text-lg font-heading font-bold text-primary tracking-tight">
            Liga<span className="text-text-primary">Admin</span>
          </span>
        )}
        {collapsed && <span className="text-lg font-bold text-primary">L</span>}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-primary/10 text-primary shadow-glow-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }
            `}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="h-12 flex items-center justify-center border-t border-border-subtle text-text-dim hover:text-text-primary transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
