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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-bg-deep">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 skew-x-[-15deg] translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-secondary/5 skew-x-[15deg] -translate-x-1/4 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md bg-bg-surface border-l-8 border-primary shadow-[20px_20px_60px_rgba(0,0,0,0.5)] p-10 relative z-10 rounded-none"
      >
        {!success ? (
          <>
            <div className="mb-10">
              <div className="inline-flex items-center gap-3 px-3 py-1 bg-primary text-bg-deep text-[10px] font-black uppercase tracking-[0.2em] skew-x-[-12deg] mb-6">
                <span className="skew-x-[12deg] flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Security Protocol
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-heading font-black tracking-wide leading-none uppercase italic text-white mb-4">
                ¿OLVIDASTE TU <span className="text-primary">CONTRASEÑA?</span>
              </h1>
              <p className="text-xs text-text-dim font-bold uppercase tracking-widest border-l-2 border-white/10 pl-4 py-1">
                Ingresá tu email y enviaremos el código de acceso táctico.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim group-focus-within:text-primary transition-colors">
                  Email de Recuperación
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="TU@EMAIL.COM"
                    className="w-full pl-12 pr-4 h-14 bg-bg-deep border border-white/5 rounded-none text-sm text-text-primary outline-none focus:border-primary transition-all font-bold tracking-widest placeholder:text-text-dim/30"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/20 p-4 skew-x-[-8deg]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-danger skew-x-[8deg]">
                    ERROR: {error}
                  </p>
                </div>
              )}

              <Button 
                type="submit" 
                loading={loading} 
                className="w-full h-16 text-lg font-black italic uppercase tracking-wide shadow-2xl shadow-primary/20"
              >
                Enviar link de recuperación
              </Button>
            </form>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-4"
          >
            <div className="w-20 h-20 bg-primary/10 flex items-center justify-center mb-8 skew-x-[-15deg] border border-primary/20 shadow-glow-primary">
              <CheckCircle2 className="w-10 h-10 text-primary skew-x-[15deg]" />
            </div>
            <h2 className="text-4xl font-heading font-black mb-4 uppercase italic tracking-wide text-white leading-none">
              EMAIL <span className="text-primary">ENVIADO</span>
            </h2>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest leading-relaxed mb-10 border-l-2 border-primary pl-6">
              Si el email está registrado, recibirás instrucciones en unos instantes. No olvides revisar tu carpeta de spam.
            </p>
            <Link 
              to="/admin/login" 
              className="w-full h-14 bg-white/5 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-white/10 transition-all border border-white/5 skew-x-[-12deg] group"
            >
              <div className="skew-x-[12deg] flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Login
              </div>
            </Link>
          </motion.div>
        )}

        {!success && (
          <div className="mt-12 pt-8 border-t border-white/5">
            <Link to="/admin/login" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-primary transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al inicio de sesión
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
