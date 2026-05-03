import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Shield, Mail, Lock as LockIcon, User, MapPin, FileText, RefreshCw, Share2, Rss, Users as UsersIcon } from 'lucide-react'
import { api } from '../../lib/api'
import GoogleAuthButton from '../../components/auth/GoogleAuthButton'
export default function Register() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: '', password: '', nombre: '', telefono: '', ligaNombre: '', slug: '', tipoFutbol: 'f7', zona: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  async function handleResend(e) {
    e.preventDefault()
    if (countdown > 0) return
    
    setResending(true)
    setError('')
    try {
      await api.post('/identity/resend-verification', { email: form.email })
      setCountdown(60)
    } catch (err) {
      setError('No se pudo reenviar el email. Intentalo más tarde.')
    } finally {
      setResending(false)
    }
  }

  async function handleStep1(e) {
    e.preventDefault()
    setStep(2)
  }

  async function handleStep2(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/identity/register', {
        email: form.email,
        password: form.password,
        nombre_organizador: form.nombre,
        telefono: form.telefono,
        nombre_liga: form.ligaNombre,
        slug: form.slug || form.ligaNombre.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        tipo_futbol: form.tipoFutbol,
        zona: form.zona
      })
      setStep(3)
    } catch (err) {
      const backendError = err.response?.data?.message || err.response?.data?.error || err.message
      const validationErrors = err.response?.data?.errors?.map(e => e.msg).join('. ')
      setError(validationErrors || backendError || 'Error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100
  const stepLabel = step === 1 ? 'DATOS DE LA CUENTA' : step === 2 ? 'CONFIGURACIÓN DE LIGA' : 'VERIFICACIÓN'

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white selection:bg-primary selection:text-black flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-6 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-3">
          <img src="/images/isotipo.png" alt="Cancha Libre" className="h-16 md:h-20" />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="px-5 py-2 border border-white text-xs font-bold hover:bg-white hover:text-black transition-all">
            INGRESAR
          </Link>
          <Link to="/admin/register" className="px-5 py-2 bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-all">
            ORGANIZAR
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] pointer-events-none z-0">
          <img src="/images/isotipo.png" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="w-full max-w-lg relative z-10">
          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div className="text-[10px] font-black italic tracking-widest text-primary">
                PASO 0{step}
                <span className="block text-white text-sm not-italic mt-1 uppercase tracking-[0.2em]">{stepLabel}</span>
              </div>
              <div className="text-xs font-black italic text-primary">{progress}%</div>
            </div>
            <div className="h-1.5 bg-white/5 w-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-primary" 
              />
            </div>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-heavy p-8 sm:p-10 relative"
            style={{ clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)' }}
          >
            {step === 1 && (
              <form onSubmit={handleStep1} className="flex flex-col gap-6">
                <h3 className="text-sm font-black italic uppercase tracking-[0.3em] mb-2">UNIRSE A LA ÉLITE</h3>
                
                <div className="grid gap-6">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    NOMBRE COMPLETO
                    <input type="text" value={form.nombre} onChange={set('nombre')} required placeholder="INGRESÁ TU NOMBRE"
                      className="w-full mt-2 px-4 py-4 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/10 outline-none focus:border-primary/50 transition-all" />
                  </label>

                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    CORREO ELECTRÓNICO
                    <input type="email" value={form.email} onChange={set('email')} required placeholder="EJ: ORGANIZADOR@CANCHALIBRE.COM"
                      className="w-full mt-2 px-4 py-4 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/10 outline-none focus:border-primary/50 transition-all" />
                  </label>

                  <div className="grid md:grid-cols-2 gap-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                      CONTRASEÑA
                      <input type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="••••••••"
                        className="w-full mt-2 px-4 py-4 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/10 outline-none focus:border-primary/50 transition-all" />
                    </label>

                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                      TELÉFONO
                      <input type="tel" value={form.telefono} onChange={set('telefono')} required placeholder="+XX 000 0000"
                        className="w-full mt-2 px-4 py-4 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/10 outline-none focus:border-primary/50 transition-all" />
                    </label>
                  </div>
                </div>

                {error && <p className="text-xs text-danger bg-danger-dim p-4 font-bold uppercase tracking-widest text-center">{error}</p>}

                <button type="submit" disabled={loading} className="w-full bg-primary text-black py-5 text-lg font-black italic uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group disabled:opacity-50">
                  CONTINUAR
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14H11V21L20 10H13Z" />
                  </svg>
                </button>

                <p className="text-[9px] font-bold text-center text-white/30 uppercase tracking-widest mt-4">
                  AL CONTINUAR ACEPTAS NUESTROS <Link to="/" className="text-white hover:text-primary underline">TÉRMINOS DE SERVICIO</Link>
                </p>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">O ACCESO RÁPIDO</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <GoogleAuthButton 
                  onError={setError} 
                  onLoadingChange={setLoading} 
                  text="signup_with" 
                />
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleStep2} className="flex flex-col gap-6">
                <h3 className="text-sm font-black italic uppercase tracking-[0.3em] mb-2">CONFIGURAR LIGA</h3>
                
                <div className="grid gap-6">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    NOMBRE DE LA LIGA
                    <input type="text" value={form.ligaNombre} onChange={set('ligaNombre')} required placeholder="EJ: COPA DE CAMPEONES"
                      className="w-full mt-2 px-4 py-4 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/10 outline-none focus:border-primary/50 transition-all" />
                  </label>

                  <div className="grid md:grid-cols-2 gap-6">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                      TIPO DE FÚTBOL
                      <select value={form.tipoFutbol} onChange={set('tipoFutbol')}
                        className="w-full mt-2 px-4 py-4 bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-primary/50 transition-all appearance-none uppercase font-bold">
                        <option value="f5">Fútbol 5</option>
                        <option value="f7">Fútbol 7</option>
                        <option value="f9">Fútbol 9</option>
                        <option value="f11">Fútbol 11</option>
                      </select>
                    </label>

                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                      ZONA / CIUDAD
                      <input type="text" value={form.zona} onChange={set('zona')} placeholder="EJ: PALERMO, CABA"
                        className="w-full mt-2 px-4 py-4 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/10 outline-none focus:border-primary/50 transition-all" />
                    </label>
                  </div>
                </div>

                {error && <p className="text-xs text-danger bg-danger-dim p-4 font-bold uppercase tracking-widest text-center">{error}</p>}

                <div className="flex flex-col md:flex-row gap-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 border border-white/20 text-xs font-black uppercase tracking-widest hover:bg-white/5">
                    VOLVER
                  </button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-primary text-black py-4 text-sm font-black italic uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50">
                    {loading ? 'CREANDO...' : 'FUNDAR LIGA'}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-primary/10 flex items-center justify-center mx-auto mb-8 border border-primary/20">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-heading font-black italic text-primary uppercase mb-4 tracking-wide">¡CASI LISTO!</h2>
                <p className="text-sm font-bold text-white/60 uppercase tracking-widest mb-8 leading-relaxed">
                  Hemos enviado un enlace de verificación a tu correo. Por favor, verifícalo para activar tu cuenta.
                </p>
                
                <div className="flex flex-col gap-4">
                  <button onClick={() => navigate('/admin/login')} className="w-full bg-primary text-black py-5 text-sm font-black uppercase tracking-widest hover:bg-primary/90">
                    IR AL INICIO DE SESIÓN
                  </button>
                  <button 
                    onClick={handleResend} 
                    disabled={resending || countdown > 0}
                    className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {resending 
                      ? 'REENVIANDO...' 
                      : countdown > 0 
                        ? `REENVIAR EN ${countdown}S` 
                        : '¿NO RECIBISTE EL EMAIL? REENVIAR'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 md:px-8 py-12 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src="/images/logotipo.png" alt="Cancha Libre" className="h-10 md:h-12" />
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
              © {new Date().getFullYear()} CANCHA LIBRE. RENDIMIENTO SIN COMPROMISO.
            </p>
          </div>
          <div className="flex gap-8 text-[10px] font-bold tracking-widest text-white/40 uppercase">
            <button className="hover:text-white transition-all">PRIVACIDAD</button>
            <button className="hover:text-white transition-all">TÉRMINOS</button>
            <button className="hover:text-white transition-all">SOPORTE</button>
            <button className="hover:text-white transition-all">API</button>
          </div>
          <div className="flex gap-6">
            <button className="text-white/60 hover:text-primary transition-all"><Share2 className="w-5 h-5" /></button>
            <button className="text-white/60 hover:text-primary transition-all"><Rss className="w-5 h-5" /></button>
            <button className="text-white/60 hover:text-primary transition-all"><UsersIcon className="w-5 h-5" /></button>
          </div>
        </div>
      </footer>
    </div>
  )
}

