import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Home() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (q.trim().length < 2) return
    setLoading(true)
    const { data } = await supabase
      .from('ligas')
      .select('id, nombre, slug, zona, logo_url')
      .ilike('nombre', `%${q.trim()}%`)
      .limit(10)
    setResults(data ?? [])
    setSearched(true)
    setLoading(false)
  }

  return (
    <div className="home-page">
      <div className="hero">
        <div className="hero-content">
          <h1>
            <span className="accent">⚽</span> Liga Amateur
          </h1>
          <p className="hero-sub">Encontrá tu liga. Seguí los resultados en tiempo real.</p>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrap">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Nombre de la liga..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                minLength={2}
                aria-label="Buscar liga"
                data-testid="search-input"
              />
            </div>
            <button type="submit" disabled={loading} data-testid="search-button">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>
      </div>

      <div className="results-container">
        {searched && results.length === 0 && (
          <p className="empty-msg" data-testid="no-results">
            No se encontraron ligas para "<strong>{q}</strong>"
          </p>
        )}

        <ul className="liga-results" data-testid="lista-resultados">
          {results.map(liga => (
            <li
              key={liga.id}
              onClick={() => navigate(`/liga/${liga.slug}`)}
              className="liga-result-item"
              data-testid="liga-item"
            >
              <div className="liga-avatar">
                {liga.logo_url
                  ? <img src={liga.logo_url} alt={liga.nombre} width={40} height={40} />
                  : <span>⚽</span>
                }
              </div>
              <div className="liga-info">
                <strong>{liga.nombre}</strong>
                {liga.zona && <span className="zona">{liga.zona}</span>}
              </div>
              <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </li>
          ))}
        </ul>

        <div className="home-footer">
          <a href="/admin/login" className="admin-link">Acceso administradores →</a>
        </div>
      </div>
    </div>
  )
}
