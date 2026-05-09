import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Mail, Clock, ShieldCheck } from 'lucide-react'

export default function Support() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pt-24 pb-16 px-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_rgba(206,222,11,0.03)_0%,_transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,_rgba(206,222,11,0.03)_0%,_transparent_50%)] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10 text-center">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          
          <h1 className="text-5xl md:text-7xl font-black italic uppercase  leading-none mb-4">
            Soporte y<br />
            <span className="text-primary drop-shadow-[0_0_15px_rgba(206,222,11,0.3)]">Ayuda.</span>
          </h1>
          <p className="text-primary/60 font-mono text-xs uppercase ">
            ESTAMOS ACÁ PARA BANCARTE
          </p>
        </motion.div>

        {/* Content Box */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-2xl"
        >
          <div className="space-y-12">
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              ¿Tenés problemas con la plataforma? ¿Dudas sobre cómo configurar tu torneo? O tal vez encontraste un error en el sistema. Escribinos, respondemos todas las consultas.
            </p>

            <div className="bg-primary/5 p-8 md:p-10 rounded-3xl border border-primary/20 hover:bg-primary/10 transition-colors">
              <p className="text-muted-foreground font-mono text-xs uppercase mb-6">
                CORREO ELECTRÓNICO DIRECTO
              </p>
              <a 
                href="mailto:ginociancia10@gmail.com" 
                className="inline-flex items-center justify-center gap-3 text-2xl md:text-3xl font-black italic hover:text-primary transition-colors group break-all"
              >
                <Mail className="w-8 h-8 text-primary group-hover:scale-110 transition-transform hidden sm:block" />
                GINOCIANCIA10@GMAIL.COM
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex gap-4">
                <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-white font-black uppercase text-lg mb-2">Monitoreo</h3>
                  <p className="text-muted-foreground text-sm">Soporte técnico 24/7. Monitoreamos los servidores constantemente.</p>
                </div>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex gap-4">
                <Clock className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-white font-black uppercase text-lg mb-2">Tiempos</h3>
                  <p className="text-muted-foreground text-sm">Generalmente respondemos consultas en menos de 24 horas hábiles.</p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Footer branding */}
        <div className="mt-12 text-center opacity-20 grayscale pointer-events-none">
          <img src="/images/logotipo.png" alt="Cancha Libre" className="h-6 mx-auto invert" />
        </div>
      </div>
    </div>
  )
}
