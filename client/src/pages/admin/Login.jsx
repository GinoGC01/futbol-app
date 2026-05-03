import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, Lock as LockIcon, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'
import GoogleAuthButton from '../../components/auth/GoogleAuthButton'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const { token, user } = await api.post('/identity/login', { email, password })
      signIn(token, user)
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-deep text-text-primary selection:bg-primary selection:text-black flex flex-col relative overflow-x-hidden">
      
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] grayscale">
          <img src="/images/isotipo.png" alt="" className="w-full h-full object-contain scale-150" />
        </div>
      </div>

      {/* MOBILE HEADER */}
      <header className="relative z-20 flex items-center justify-between p-6 md:px-12 md:py-8 w-full max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/50 transition-all">
            <ChevronLeft className="w-5 h-5 text-text-secondary group-hover:text-primary" />
          </div>
          <span className="hidden sm:block text-[10px] font-black tracking-[0.2em] uppercase text-text-secondary group-hover:text-primary transition-colors">
            VOLVER AL INICIO
          </span>
        </Link>
        <img src="/images/isotipo.png" alt="Cancha Libre" className="h-10 md:h-12" />
        <div className="w-10 sm:w-24" /> {/* Spacer */}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md">
          
          {/* HEADER SECTION */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary mr-2" />
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Portal de Seguridad</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-heading font-black italic tracking-tighter leading-[0.9] uppercase mb-2">
              ACCESO 
            </h1>
            <p className="text-text-secondary text-xs font-bold tracking-[0.1em] uppercase">
              Panel de Control para Organizadores
            </p>
          </div>

          {/* FORM CONTAINER */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-heavy p-8 sm:p-10 relative"
          >
            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40" />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2 px-1">
                  <Mail className="w-3 h-3" /> Identidad del Organizador
                </label>
                <div className="relative group">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="CORREO ELECTRÓNICO"
                    required
                    className="w-full px-5 py-4 bg-bg-input border border-border-default text-sm text-white placeholder:text-text-dim outline-none focus:border-primary/50 transition-all rounded-none" 
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-focus-within:w-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-2">
                    <LockIcon className="w-3 h-3" /> Código de Acceso
                  </label>
                  <Link to="/admin/forgot-password" size="sm" className="text-[9px] font-black text-primary hover:underline uppercase tracking-tighter">
                    ¿Olvidaste la clave?
                  </Link>
                </div>
                <div className="relative group">
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    required
                    className="w-full px-5 py-4 bg-bg-input border border-border-default text-sm text-white placeholder:text-text-dim outline-none focus:border-primary/50 transition-all rounded-none" 
                  />
                  <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-focus-within:w-full" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-danger/10 border-l-4 border-danger p-3"
                  >
                    <p className="text-[10px] text-danger font-black uppercase tracking-widest leading-tight">
                      Error: {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full relative overflow-hidden bg-primary text-bg-deep py-5 font-heading text-xl italic font-black uppercase tracking-tighter group transition-all active:scale-95 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? 'AUTENTICANDO...' : (
                    <>
                      ENTRAR AL CAMPO
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">O ACCESO RÁPIDO</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <GoogleAuthButton 
              onError={setError} 
              onLoadingChange={setLoading} 
              text="continue_with" 
            />

            <div className="mt-10 text-center space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                ¿AÚN NO TIENES TU LIGA?
              </p>
              <Link 
                to="/admin/register" 
                className="inline-block px-8 py-3 border border-white/10 hover:border-primary/40 hover:text-primary transition-all text-xs font-black uppercase tracking-widest italic"
              >
                CREAR CUENTA AHORA
              </Link>
            </div>
          </motion.div>

          <footer className="mt-12 text-center">
            <p className="text-[9px] font-bold text-text-dim uppercase tracking-[0.3em] leading-loose opacity-50">
              Cancha Libre v2.5 <br />
              "En el asfalto no hay excusas, solo resultados."
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}

