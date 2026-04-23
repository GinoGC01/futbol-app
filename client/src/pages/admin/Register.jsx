import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Shield, Mail, Lock, User, MapPin, FileText, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'

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
      // Usamos el endpoint unificado de onboarding
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
      
      // Ya no hacemos auto-login (signIn) porque el backend requiere verificación de email.
      // Simplemente pasamos al paso 3 (Éxito/Revisar email).
      setStep(3)
    } catch (err) {
      console.error('Registration Error:', err)
      
      // Extraer mensaje de error del backend
      const backendError = err.response?.data?.message || err.response?.data?.error || err.message
      const validationErrors = err.response?.data?.errors?.map(e => e.msg).join('. ')
      
      const msg = validationErrors || backendError || 'Error inesperado. Por favor, revisa los datos e intenta con otro email.'
      setError(msg)
    }
    setLoading(false)
  }


  const steps = [
    { num: 1, label: 'Cuenta' },
    { num: 2, label: 'Liga' },
    { num: 3, label: 'Listo' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-secondary/3 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-heavy rounded-2xl p-8 relative z-10"
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map(s => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s.num ? 'bg-primary text-bg-deep' : 'bg-bg-elevated text-text-dim'
              }`}>{s.num}</div>
              <span className={`text-xs font-medium ${step >= s.num ? 'text-primary' : 'text-text-dim'}`}>{s.label}</span>
              {s.num < 3 && <div className={`w-8 h-0.5 ${step > s.num ? 'bg-primary' : 'bg-border-subtle'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <form data-testid="step1-form" onSubmit={handleStep1} className="flex flex-col gap-4">
            <h2 className="text-lg font-heading font-bold text-center mb-2">Creá tu cuenta</h2>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><User className="w-3.5 h-3.5" /> Nombre completo</div>
              <input data-testid="register-nombre" type="text" value={form.nombre} onChange={set('nombre')} required
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><Mail className="w-3.5 h-3.5" /> Email</div>
              <input data-testid="register-email" type="email" value={form.email} onChange={set('email')} required
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><Lock className="w-3.5 h-3.5" /> Contraseña</div>
              <input data-testid="register-password" type="password" value={form.password} onChange={set('password')} required minLength={6}
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5" /> Teléfono</div>
              <input data-testid="register-telefono" type="tel" value={form.telefono} onChange={set('telefono')} required placeholder="Ej: +54 9 11 1234-5678"
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            {error && <p data-testid="register-error" className="text-xs text-danger bg-danger-dim rounded-lg px-3 py-2">{error}</p>}
            <Button data-testid="register-continuar" type="submit" loading={loading} className="w-full mt-2">Continuar</Button>
          </form>
        )}

        {step === 2 && (
          <form data-testid="step2-form" onSubmit={handleStep2} className="flex flex-col gap-4">
            <h2 className="text-lg font-heading font-bold text-center mb-2">Configurá tu liga</h2>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><Shield className="w-3.5 h-3.5" /> Nombre de la liga</div>
              <input data-testid="register-liga-nombre" type="text" value={form.ligaNombre} onChange={set('ligaNombre')} required
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><FileText className="w-3.5 h-3.5" /> Tipo de fútbol</div>
              <select data-testid="register-tipo-futbol" value={form.tipoFutbol} onChange={set('tipoFutbol')}
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
                <option value="f5">Fútbol 5</option>
                <option value="f7">Fútbol 7</option>
                <option value="f9">Fútbol 9</option>
                <option value="f11">Fútbol 11</option>
              </select>
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5" /> Zona</div>
              <input data-testid="register-zona" type="text" value={form.zona} onChange={set('zona')} placeholder="Ej: Palermo, CABA"
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            {error && <p data-testid="register-error" className="text-xs text-danger bg-danger-dim rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 mt-2">
              <Button 
                data-testid="register-volver"
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setError('')
                  setStep(1)
                }} 
                className="flex-1"
              >
                Volver
              </Button>
              <Button data-testid="register-submit" type="submit" loading={loading} className="flex-[2]">Crear liga</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold mb-2">¡Casi listo!</h2>
            <p className="text-sm text-text-dim mb-6">Hemos enviado un enlace de verificación a tu correo. Por favor, verifícalo para activar tu cuenta y poder ingresar.</p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/admin/login')} className="w-full">Ir al Login</Button>
              <button 
                onClick={handleResend} 
                disabled={resending || countdown > 0}
                className="text-xs text-text-dim hover:text-primary transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                {resending 
                  ? 'Reenviando...' 
                  : countdown > 0 
                    ? `Podrás reenviar en ${countdown}s` 
                    : '¿No recibiste el email? Reenviar'}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <p className="text-center text-sm text-text-dim mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/admin/login" className="text-primary font-medium hover:underline">Iniciar sesión</Link>
          </p>
        )}
      </motion.div>
    </div>
  )
}
