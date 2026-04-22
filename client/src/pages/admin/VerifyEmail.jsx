import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const token = searchParams.get('token')

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error')
        setMessage('Token de verificación no encontrado.')
        return
      }

      try {
        const res = await api.post('/identity/verify-email', { token })
        setStatus('success')
        setMessage(res.message || '¡Email verificado exitosamente!')
      } catch (err) {
        console.error('Verification error:', err)
        setStatus('error')
        setMessage(err.response?.data?.message || 'El token es inválido o ha expirado.')
      }
    }

    verify()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-heavy rounded-3xl p-10 text-center relative z-10"
      >
        {status === 'verifying' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
            <h2 className="text-2xl font-heading font-bold mb-2">Verificando tu email</h2>
            <p className="text-text-dim">Por favor espera un momento mientras validamos tu cuenta...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2 text-text-primary">¡Cuenta Verificada!</h2>
            <p className="text-text-dim mb-8">{message}</p>
            <Button 
              onClick={() => navigate('/admin/login')} 
              className="w-full flex items-center justify-center gap-2"
            >
              Ir al Inicio de Sesión <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-danger/10 rounded-2xl flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-danger" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2 text-text-primary">Error de Verificación</h2>
            <p className="text-text-dim mb-8">{message}</p>
            <div className="w-full flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/admin/register')} 
                className="w-full"
              >
                Volver al Registro
              </Button>
              <Link to="/admin/login" className="text-sm text-text-dim hover:text-primary transition-colors mt-2">
                ¿Ya tienes cuenta verificada? Inicia sesión
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
