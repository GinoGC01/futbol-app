import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock as LockIcon, Share2, Rss, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'
import Button from '../../components/ui/Button'

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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white selection:bg-primary selection:text-black flex flex-col">
      {/* Navbar (Header) */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/isotipo.png" alt="Cancha Libre" className="h-20" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" >LIGAS</NavLink>
            <NavLink to="/ligas">TORNEOS</NavLink>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin/login" className="px-6 py-2 border border-primary text-primary text-xs font-bold transition-all">
            INGRESAR
          </Link>
          <Link to="/admin/register" className="px-6 py-2 bg-primary text-black text-xs font-bold hover:bg-primary/90 transition-all">
            ORGANIZAR
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Isotipo (Watermark) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] opacity-[0.02] pointer-events-none z-0">
          <img src="/images/isotipo.png" alt="" className="w-full h-full object-contain" />
        </div>

        <div className="w-full max-w-lg relative z-10">
          <div className="text-center mb-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center mb-6"
            >
              <img src="/images/logotipo.png" alt="Logo" className="h-32 object-contain" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-heading font-black italic tracking-tighter leading-tight uppercase">
              ACCESO PARA<br />
              <span className="text-primary">ORGANIZADORES</span>
            </h1>
            <div className="w-24 h-1 bg-primary mx-auto mt-4" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-primary bg-black/40 backdrop-blur-md p-8 md:p-10"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-3.5 h-3.5" />
                  IDENTIDAD DEL ORGANIZADOR
                </div>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="CORREO ELECTRÓNICO"
                  required
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all" 
                />
              </label>

              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <LockIcon className="w-3.5 h-3.5" />
                    CÓDIGO DE ACCESO
                  </div>
                  <Link to="/admin/forgot-password" title="¿OLVIDASTE LA CLAVE?" className="hover:text-primary transition-colors">
                    ¿OLVIDASTE LA CLAVE?
                  </Link>
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-all" 
                />
              </label>

              {error && <p className="text-xs text-danger bg-danger-dim rounded-lg px-3 py-2 text-center uppercase font-bold tracking-widest">{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-black py-5 text-lg font-black italic uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group"
              >
                {loading ? '...' : (
                  <>
                    ENTRAR AL CAMPO
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14H11V21L20 10H13Z" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-white/10 pt-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                ¿AÚN SIN EQUIPO?
              </p>
              <Link to="/admin/register" className="text-primary font-black italic uppercase tracking-widest hover:underline text-sm">
                REGÍSTRATE AQUÍ
              </Link>
            </div>
          </motion.div>

          <p className="text-center text-[10px] italic font-bold text-white/20 uppercase tracking-[0.2em] mt-8">
            "En el asfalto no hay excusas, solo resultados."
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-12 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src="/images/logotipo.png" alt="Cancha Libre" className="h-12" />
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
              © {new Date().getFullYear()} CANCHA LIBRE. RENDIMIENTO SIN COMPROMISO.
            </p>
          </div>
          
          <div className="flex gap-8">
            <FooterLink>PRIVACIDAD</FooterLink>
            <FooterLink>TÉRMINOS</FooterLink>
            <FooterLink>SOPORTE</FooterLink>
            <FooterLink>API</FooterLink>
          </div>

          <div className="flex gap-6">
            <button className="text-white/60 hover:text-primary transition-all"><Share2 className="w-5 h-5" /></button>
            <button className="text-white/60 hover:text-primary transition-all"><Rss className="w-5 h-5" /></button>
            <button className="text-white/60 hover:text-primary transition-all"><Users className="w-5 h-5" /></button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function NavLink({ to, children, active }) {
  return (
    <Link to={to} className={`text-xs font-bold tracking-[0.2em] transition-all hover:text-primary ${active ? 'text-primary border-b-2 border-primary pb-1' : 'text-white'}`}>
      {children}
    </Link>
  )
}

function FooterLink({ children }) {
  return (
    <button className="text-[10px] font-bold tracking-widest text-white/40 hover:text-white transition-all uppercase">
      {children}
    </button>
  )
}

