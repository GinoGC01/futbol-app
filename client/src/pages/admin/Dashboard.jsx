import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import GestionEquipos from './GestionEquipos'
import GestionFixture from './GestionFixture'
import GestionResultados from './GestionResultados'

const TABS = [
  { id: 'equipos', label: '🏟 Equipos' },
  { id: 'fixture', label: '📅 Fixture' },
  { id: 'resultados', label: '📝 Resultados' },
]

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [tab, setTab] = useState('equipos')
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span>⚽</span>
          <h1>Panel de administración</h1>
        </div>
        <div className="user-info">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleSignOut} className="btn-salir">Salir</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            data-testid={`tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-main">
        {tab === 'equipos' && <GestionEquipos />}
        {tab === 'fixture' && <GestionFixture />}
        {tab === 'resultados' && <GestionResultados />}
      </main>
    </div>
  )
}
