import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Shield, Mail, Lock, User, MapPin, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'

export default function Register() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ email: '', password: '', nombre: '', telefono: '', ligaNombre: '', slug: '', tipoFutbol: 'f7', zona: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleStep1(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (err) { setLoading(false); return setError(err.message) }
    // Create organizador profile via API
    try {
      await api.post('/identity/organizador', { nombre: form.nombre, telefono: form.telefono })
    } catch {
      // May fail if already exists, continue
    }
    setLoading(false)
    setStep(2)
  }

  async function handleStep2(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/identity/ligas', {
        nombre: form.ligaNombre,
        slug: form.slug || form.ligaNombre.toLowerCase().replace(/\s+/g, '-'),
        tipo_futbol: form.tipoFutbol,
        zona: form.zona
      })
      setStep(3)
    } catch (err) {
      setError(err.message)
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
          <form onSubmit={handleStep1} className="flex flex-col gap-4">
            <h2 className="text-lg font-heading font-bold text-center mb-2">Creá tu cuenta</h2>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><User className="w-3.5 h-3.5" /> Nombre completo</div>
              <input type="text" value={form.nombre} onChange={set('nombre')} required
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><Mail className="w-3.5 h-3.5" /> Email</div>
              <input type="email" value={form.email} onChange={set('email')} required
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><Lock className="w-3.5 h-3.5" /> Contraseña</div>
              <input type="password" value={form.password} onChange={set('password')} required minLength={6}
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            {error && <p className="text-xs text-danger bg-danger-dim rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" loading={loading} className="w-full mt-2">Continuar</Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} className="flex flex-col gap-4">
            <h2 className="text-lg font-heading font-bold text-center mb-2">Configurá tu liga</h2>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><Shield className="w-3.5 h-3.5" /> Nombre de la liga</div>
              <input type="text" value={form.ligaNombre} onChange={set('ligaNombre')} required
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><FileText className="w-3.5 h-3.5" /> Tipo de fútbol</div>
              <select value={form.tipoFutbol} onChange={set('tipoFutbol')}
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
                <option value="f5">Fútbol 5</option>
                <option value="f7">Fútbol 7</option>
                <option value="f9">Fútbol 9</option>
                <option value="f11">Fútbol 11</option>
              </select>
            </label>
            <label className="text-xs font-medium text-text-dim">
              <div className="flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5" /> Zona</div>
              <input type="text" value={form.zona} onChange={set('zona')} placeholder="Ej: Palermo, CABA"
                className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
            </label>
            {error && <p className="text-xs text-danger bg-danger-dim rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" loading={loading} className="w-full mt-2">Crear liga</Button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold mb-2">¡Todo listo!</h2>
            <p className="text-sm text-text-dim mb-6">Tu liga fue creada con éxito. Ahora podés configurar temporadas, equipos y más.</p>
            <Button onClick={() => navigate('/admin')} className="w-full">Ir al Dashboard</Button>
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
