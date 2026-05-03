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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-bg-deep">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-1/2 h-full bg-primary/5 skew-x-[15deg] -translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/4 h-1/2 bg-secondary/5 skew-x-[-15deg] translate-x-1/4 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-bg-surface border-t-8 border-primary shadow-[0_40px_100px_rgba(0,0,0,0.7)] p-12 text-center relative z-10 rounded-none"
      >
        {status === 'verifying' && (
          <div className="flex flex-col items-center py-8">
            <div className="relative mb-10">
              <Loader2 className="w-20 h-20 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-primary/20 blur-xl animate-pulse" />
              </div>
            </div>
            <h2 className="text-5xl font-heading font-black mb-4 uppercase italic tracking-wide text-white">
              VERIFICANDO <span className="text-primary">SISTEMA</span>
            </h2>
            <p className="text-xs text-text-dim font-bold uppercase tracking-[0.2em] animate-pulse">
              Validando credenciales de acceso táctico...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-success/10 border border-success/20 flex items-center justify-center mb-8 skew-x-[-15deg] shadow-glow-success">
              <CheckCircle2 className="w-12 h-12 text-success skew-x-[15deg]" />
            </div>
            <h2 className="text-5xl font-heading font-black mb-4 uppercase italic tracking-wide text-white leading-none">
              ACCESO <span className="text-success">CONCEDIDO</span>
            </h2>
            <p className="text-sm text-text-dim font-bold uppercase tracking-widest mb-12 border-l-4 border-success pl-6 py-2">
              {message}
            </p>
            <Button 
              onClick={() => navigate('/admin/login')} 
              className="w-full h-16 text-xl font-black italic uppercase tracking-wide shadow-2xl shadow-success/20 flex items-center justify-center gap-4"
            >
              IR AL INICIO DE SESIÓN <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-danger/10 border border-danger/20 flex items-center justify-center mb-8 skew-x-[-15deg] shadow-glow-danger">
              <XCircle className="w-12 h-12 text-danger skew-x-[15deg]" />
            </div>
            <h2 className="text-5xl font-heading font-black mb-4 uppercase italic tracking-wide text-white leading-none">
              FALLO DE <span className="text-danger">AUTENTICACIÓN</span>
            </h2>
            <p className="text-sm text-text-dim font-bold uppercase tracking-widest mb-12 border-l-4 border-danger pl-6 py-2">
              {message}
            </p>
            <div className="w-full flex flex-col gap-4">
              <Button 
                onClick={() => navigate('/admin/register')} 
                className="w-full h-16 text-lg font-black italic uppercase tracking-wide bg-danger hover:bg-danger-hover shadow-xl shadow-danger/20"
              >
                VOLVER AL REGISTRO
              </Button>
              <Link to="/admin/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim hover:text-primary transition-all mt-4 border-b border-transparent hover:border-primary pb-1">
                ¿YA TIENES CUENTA VERIFICADA? INICIA SESIÓN
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
