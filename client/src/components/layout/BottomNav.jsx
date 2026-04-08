import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Trophy, Users, Swords, Award, User } from 'lucide-react'

const tabs = [
  { to: '/admin',         icon: LayoutDashboard, label: 'Home' },
  { to: '/admin/torneo',  icon: Trophy,          label: 'Torneo' },
  { to: '/admin/roster',  icon: Users,           label: 'Equipos' },
  { to: '/admin/jugadores', icon: User,           label: 'Players' },
  { to: '/admin/partidos',icon: Swords,          label: 'Live' },
]

export default function BottomNav() {
  return (
    <nav className="
      lg:hidden fixed bottom-0 left-0 right-0 z-40
      glass-heavy border-t border-border-subtle
      flex items-center justify-around
      h-16 px-2
      safe-area-pb
    ">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/admin'}
          className={({ isActive }) => `
            flex flex-col items-center justify-center gap-0.5
            py-1 px-3 rounded-xl min-w-[56px]
            text-[10px] font-semibold tracking-wide
            transition-all duration-200
            ${isActive
              ? 'text-primary'
              : 'text-text-dim'
            }
          `}
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
