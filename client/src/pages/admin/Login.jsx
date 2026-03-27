import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Shield, Mail, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) return setError(err.message)
    navigate('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary/3 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-heavy rounded-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-heading font-bold">Acceso Organizador</h1>
          <p className="text-sm text-text-dim mt-1">Ingresá con tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-xs font-medium text-text-dim">
            Email
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full pl-9 pr-4 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </label>

          <label className="text-xs font-medium text-text-dim">
            Contraseña
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full pl-9 pr-4 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </label>

          {error && <p className="text-xs text-danger bg-danger-dim rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Iniciar Sesión
          </Button>
        </form>

        <p className="text-center text-sm text-text-dim mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/admin/register" className="text-primary font-medium hover:underline">Crear cuenta</Link>
        </p>
      </motion.div>
    </div>
  )
}
