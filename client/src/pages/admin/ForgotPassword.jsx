import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/identity/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Hubo un problema. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-secondary/3 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass-heavy rounded-2xl p-8 relative z-10"
      >
        {!success ? (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-xl font-heading font-bold">¿Olvidaste tu contraseña?</h1>
              <p className="text-sm text-text-dim mt-1">
                Ingresá tu email y te enviaremos un link para restablecerla.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="text-xs font-medium text-text-dim">
                Email
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </label>

              {error && (
                <p className="text-xs text-danger bg-danger-dim rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full mt-2">
                Enviar link de recuperación
              </Button>
            </form>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold mb-2">Email enviado</h2>
            <p className="text-sm text-text-dim mb-8">
              Si el email está registrado, recibirás instrucciones en unos instantes. No olvides revisar tu carpeta de spam.
            </p>
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/admin/login" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver al Login
              </Link>
            </Button>
          </motion.div>
        )}

        {!success && (
          <p className="text-center text-sm text-text-dim mt-8">
            <Link to="/admin/login" className="inline-flex items-center gap-2 hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Volver al login
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  )
}
