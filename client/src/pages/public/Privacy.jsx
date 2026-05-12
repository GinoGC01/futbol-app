import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Mail, Shield, Eye, Lock, FileText, Database, UserCheck } from 'lucide-react'

export default function Privacy() {
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
            Política de<br />
            <span className="text-primary drop-shadow-[0_0_15px_rgba(206,222,11,0.3)]">Privacidad.</span>
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
                En <strong className="text-white">Cancha Libre</strong> valoramos su privacidad y nos comprometemos a proteger sus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos la información cuando usted utiliza nuestra plataforma web y los servicios de gestión de torneos.
              </p>
            </section>

            <div className="grid gap-10">
              <Section 
                icon={<Database className="text-primary w-6 h-6" />}
                title="1. Información que Recopilamos"
                content={
                  <div className="space-y-4">
                    <p>Recopilamos diferentes tipos de información para ofrecerle y mejorar nuestro servicio:</p>
                    <ul className="space-y-3 list-disc list-inside">
                      <li><strong className="text-white">Datos de la cuenta:</strong> Nombre, dirección de correo electrónico, contraseña cifrada.</li>
                      <li><strong className="text-white">Datos del torneo:</strong> Nombres de equipos, nombres de jugadores, resultados de partidos, estadísticas, escudos y fotos que usted decida subir.</li>
                      <li><strong className="text-white">Datos técnicos:</strong> Dirección IP, tipo de navegador, información del dispositivo y registros de actividad en la plataforma.</li>
                    </ul>
                  </div>
                }
              />

              <Section 
                icon={<Shield className="text-primary w-6 h-6" />}
                title="2. Cómo Usamos la Información"
                content={
                  <ul className="space-y-3 list-disc list-inside">
                    <li>Proporcionar, operar y mantener las funcionalidades de Cancha Libre.</li>
                    <li>Procesar sus torneos, generar fixtures y actualizar tablas de posiciones automáticamente.</li>
                    <li>Enviarle notificaciones del sistema, alertas sobre el estado de su cuenta y correos electrónicos transaccionales.</li>
                    <li>Mejorar la experiencia del usuario y analizar cómo se utiliza nuestra plataforma.</li>
                    <li>Prevenir actividades fraudulentas y mejorar la seguridad del sistema.</li>
                  </ul>
                }
              />

              <Section 
                icon={<Eye className="text-primary w-6 h-6" />}
                title="3. Cómo Compartimos la Información"
                content={
                  <div className="space-y-4">
                    <p>Cancha Libre no vende ni alquila su información personal a terceros. Solo compartiremos su información en los siguientes casos:</p>
                    <ul className="space-y-3 list-disc list-inside">
                      <li><strong className="text-white">Público General:</strong> Los datos de los torneos, como resultados y tablas, son públicos.</li>
                      <li><strong className="text-white">Proveedores de Servicios:</strong> Empresas de terceros (ej. servidores) con acceso estrictamente necesario.</li>
                      <li><strong className="text-white">Requisitos Legales:</strong> Por requerimiento de autoridades públicas o legales.</li>
                    </ul>
                  </div>
                }
              />

              <Section 
                icon={<FileText className="text-primary w-6 h-6" />}
                title="4. Cookies y Tecnologías Similares"
                content="Utilizamos cookies y tecnologías de seguimiento similares para rastrear la actividad en nuestra plataforma y almacenar cierta información (como su sesión autenticada). Puede configurar su navegador para rechazar las cookies, pero es posible que algunas partes del servicio no funcionen correctamente si lo hace."
              />

              <Section 
                icon={<Lock className="text-primary w-6 h-6" />}
                title="5. Seguridad de los Datos"
                content="La seguridad de sus datos es fundamental para nosotros. Implementamos medidas de seguridad técnicas y organizativas para proteger su información contra accesos no autorizados, pérdida o alteración. Sin embargo, ningún método de transmisión por Internet es 100% seguro."
              />

              <Section 
                title="6. Retención de Datos"
                highlight
                content={
                  <div className="space-y-4">
                    <p>
                      Conservaremos su información personal solo durante el tiempo que sea necesario para los fines establecidos en esta política. Tenga en cuenta que si solicita la eliminación de su cuenta, <strong className="text-white">nos reservamos el derecho de conservar datos históricos anonimizados</strong> (como las estadísticas de un torneo pasado) para no perjudicar la integridad de las ligas en las que haya participado.
                    </p>
                  </div>
                }
              />

              <Section 
                icon={<UserCheck className="text-primary w-6 h-6" />}
                title="7. Sus Derechos"
                content="De acuerdo con la legislación argentina (Ley N° 25.326 de Protección de Datos Personales), usted tiene el derecho de solicitar el acceso, la rectificación, la actualización o la supresión de sus datos personales. Para ejercer estos derechos, comuníquese con nosotros."
              />

              <Section 
                title="8. Cambios en esta Política"
                content="Es posible que actualicemos nuestra Política de Privacidad de vez en cuando. Le notificaremos de cualquier cambio publicando la nueva Política en esta página y actualizando la fecha de 'Última actualización'."
              />
            </div>

            {/* Footer info */}
            <div className="pt-12 border-t border-white/5 text-center">
              <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-[0.4em] mb-6">
                ¿Tenés alguna consulta sobre tus datos?
              </p>
              <a 
                href="mailto:soporte@canchalibre.pro" 
                className="inline-flex items-center gap-3 text-2xl font-black italic hover:text-primary transition-colors group"
              >
                <Mail className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                SOPORTE@CANCHALIBRE.PRO
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
