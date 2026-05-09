import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Mail, Shield, Scale, Info, Zap } from 'lucide-react'

export default function Terms() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pt-24 pb-16 px-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_rgba(206,222,11,0.03)_0%,_transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,_rgba(206,222,11,0.03)_0%,_transparent_50%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
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
          
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-4">
            Términos y<br />
            <span className="text-primary drop-shadow-[0_0_15px_rgba(206,222,11,0.3)]">Condiciones.</span>
          </h1>
          <p className="text-primary/60 font-mono text-xs uppercase tracking-[0.3em]">
            Última actualización: 9 de mayo, 2026
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
            
            <section>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Bienvenido a <strong className="text-white">Cancha Libre</strong>. Estos Términos y Condiciones rigen el uso de nuestra plataforma de gestión de torneos de fútbol. Al acceder o utilizar Cancha Libre, usted acepta estar sujeto a estos términos.
              </p>
            </section>

            <div className="grid gap-10">
              <Section 
                icon={<Info className="text-primary w-6 h-6" />}
                title="1. Aceptación de los Términos"
                content="Al registrarse o utilizar Cancha Libre, ya sea como organizador de torneos, jugador o espectador, usted acepta cumplir con estos términos. Si no está de acuerdo con alguna parte de los mismos, no podrá utilizar el servicio."
              />

              <Section 
                icon={<Zap className="text-primary w-6 h-6" />}
                title="2. Descripción del Servicio"
                content="Cancha Libre es un software como servicio (SaaS) diseñado para la organización y gestión de torneos deportivos. Proporcionamos herramientas para la creación de fixtures, tablas de posiciones, seguimiento de goleadores, gestión de pagos y difusión de resultados en tiempo real."
              />

              <Section 
                icon={<Shield className="text-primary w-6 h-6" />}
                title="3. Cuentas de Usuario"
                content={
                  <ul className="space-y-3 list-disc list-inside">
                    <li>Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.</li>
                    <li>Debe proporcionar información veraz y actualizada.</li>
                    <li>Cancha Libre se reserva el derecho de suspender o cancelar cuentas que incumplan estas normas o se consideren fraudulentas.</li>
                  </ul>
                }
              />

              <Section 
                title="4. Uso Permitido"
                content={
                  <div className="space-y-4">
                    <p>Usted se compromete a no:</p>
                    <ul className="space-y-3 list-disc list-inside">
                      <li>Utilizar el servicio para fines ilegales.</li>
                      <li>Publicar contenido ofensivo, discriminatorio o violento.</li>
                      <li>Intentar interferir con el correcto funcionamiento de la plataforma.</li>
                      <li>Realizar ingeniería inversa del software.</li>
                    </ul>
                  </div>
                }
              />

              <Section 
                title="5. Propiedad Intelectual"
                content="Todo el contenido, diseño, logotipos, código fuente y tecnología de Cancha Libre son propiedad exclusiva de los desarrolladores. Queda prohibida su reproducción total o parcial sin autorización previa."
              />

              <Section 
                title="6. Contenido Generado por el Usuario"
                content={
                  <ul className="space-y-3 list-disc list-inside">
                    <li>Usted conserva todos los derechos sobre la información que carga (nombres de equipos, jugadores, escudos, fotos).</li>
                    <li>Al subir este contenido, otorga a Cancha Libre una licencia no exclusiva para alojarlo y mostrarlo públicamente en las páginas asociadas a sus torneos.</li>
                    <li>Se prohíbe terminantemente cargar contenido que sea ofensivo, discriminatorio o que infrinja derechos de autor de terceros. Cancha Libre se reserva el derecho de eliminar dicho contenido sin previo aviso.</li>
                  </ul>
                }
              />

              <Section 
                icon={<Scale className="text-primary w-6 h-6" />}
                title="7. Limitación de Responsabilidad"
                highlight
                content={
                  <div className="space-y-4">
                    <p className="font-bold text-white italic uppercase tracking-wider">Responsabilidad Deportiva:</p>
                    <p>
                      Cancha Libre es una herramienta tecnológica de gestión. <span className="text-white">No somos responsables</span> por incidentes físicos, lesiones, daños materiales o conflictos que ocurran durante el desarrollo de los partidos en los predios deportivos. La seguridad y conducta en el campo son responsabilidad exclusiva de los organizadores y participantes del torneo.
                    </p>
                  </div>
                }
              />

              <Section 
                title="8. Privacidad y Datos"
                content="El uso de sus datos personales se rige por nuestra Política de Privacidad. Al utilizar el servicio, usted consiente el procesamiento de su información para los fines propios de la plataforma (gestión de torneos, notificaciones, etc.)."
              />

              <Section 
                title="9. Comunicaciones y Notificaciones"
                content="Al registrarse en Cancha Libre, usted acepta recibir correos electrónicos transaccionales o notificaciones del sistema relacionados con el estado de su cuenta, nuevas funcionalidades críticas o cambios en el servicio. Podrá darse de baja de comunicaciones no esenciales desde su perfil."
              />

              <Section 
                title="10. Pagos y Suscripciones"
                content={
                  <ul className="space-y-3 list-disc list-inside">
                    <li>Los pagos se procesarán a través de plataformas de terceros seguras.</li>
                    <li>Las tarifas están sujetas a cambios con previo aviso.</li>
                    <li>No se realizan reembolsos por períodos de suscripción ya iniciados, salvo disposición legal en contrario.</li>
                  </ul>
                }
              />

              <Section 
                title="11. Baja del Servicio y Retención de Datos"
                content={
                  <ul className="space-y-3 list-disc list-inside">
                    <li>Usted puede solicitar la eliminación de su cuenta en cualquier momento contactando a nuestro soporte.</li>
                    <li>Tras la eliminación de su cuenta, Cancha Libre se reserva el derecho de mantener información anonimizada o datos históricos (como resultados de torneos ya finalizados) para garantizar la integridad estadística de la plataforma.</li>
                  </ul>
                }
              />

              <Section 
                title="12. Modificaciones"
                content="Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación."
              />

              <Section 
                title="13. Ley Aplicable y Jurisdicción"
                content="Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a la jurisdicción de los tribunales competentes en la Ciudad Autónoma de Buenos Aires."
              />
            </div>

            {/* Footer info */}
            <div className="pt-12 border-t border-white/5 text-center">
              <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.4em] mb-6">
                ¿Tenés alguna consulta legal?
              </p>
              <a 
                href="mailto:info@canchalibre.pro" 
                className="inline-flex items-center gap-3 text-2xl font-black italic hover:text-primary transition-colors group"
              >
                <Mail className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                INFO@CANCHALIBRE.PRO
              </a>
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

function Section({ title, content, icon, highlight }) {
  return (
    <div className={`space-y-4 ${highlight ? 'p-6 bg-primary/5 rounded-2xl border border-primary/20' : ''}`}>
      <div className="flex items-center gap-4">
        {icon}
        <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">
          {title}
        </h2>
      </div>
      <div className="text-muted-foreground leading-relaxed text-lg pl-0 md:pl-10">
        {content}
      </div>
    </div>
  )
}
