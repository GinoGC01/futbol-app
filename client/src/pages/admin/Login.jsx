import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">⚽</span>
          <h1>Panel de Admin</h1>
          <p>Ingresá con tu cuenta para gestionar tu liga</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
              data-testid="email-input"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••"
              data-testid="password-input"
            />
          </label>
          {error && <p role="alert" className="error-msg" data-testid="error-msg">{error}</p>}
          <button type="submit" disabled={loading} data-testid="login-btn">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <a href="/" className="back-home">← Volver al inicio</a>
      </div>
    </div>
  )
}
