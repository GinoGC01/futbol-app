import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTokenMissing, setIsTokenMissing] = useState(false)

  useEffect(() => {
    if (!token) {
      setIsTokenMissing(true)
      setError('El link de recuperación no es válido o ha expirado.')
    }
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden.')
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.')
    }

    setLoading(true)

    try {
      await api.post('/identity/reset-password', { token, password })
      toast.success('Contraseña actualizada. Ya podés iniciar sesión.')
      navigate('/admin/login')
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (isTokenMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm glass-heavy rounded-2xl p-8 text-center"
        >
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h1 className="text-xl font-heading font-bold mb-2">Link invàlido</h1>
          <p className="text-sm text-text-dim mb-6">{error}</p>
          <Button asChild className="w-full">
            <Link to="/admin/forgot-password">Solicitar nuevo link</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-heavy rounded-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-heading font-bold">Nueva contraseña</h1>
          <p className="text-sm text-text-dim mt-1">Elegí una contraseña segura para tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-xs font-medium text-text-dim">
            Nueva Contraseña
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-dim hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          <label className="text-xs font-medium text-text-dim">
            Confirmar Contraseña
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </label>

          {error && (
            <p className="text-xs text-danger bg-danger-dim rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Restablecer contraseña
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
