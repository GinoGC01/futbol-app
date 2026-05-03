import React from 'react'
import { 
  HelpCircle, 
  ChevronRight, 
  Trophy, 
  Users, 
  Edit3, 
  Calendar, 
  ListChecks, 
  ArrowRight,
  Zap,
  ShieldCheck,
  Layout,
  BarChart3
} from 'lucide-react'
import GlassCard from '../ui/GlassCard'

const HelpStep = ({ icon: Icon, title, description, details, order }) => (
  <div className="relative flex gap-6 group">
    {/* Line connector */}
    {order !== 5 && (
      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
    )}
    
    <div className="relative">
      <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 shadow-lg z-10">
        <Icon className="w-6 h-6" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-secondary text-[10px] font-black flex items-center justify-center italic z-20 shadow-md">
        {order}
      </div>
    </div>
    
    <div className="flex-1 pb-12">
      <h4 className="text-lg font-heading font-black text-text-primary uppercase italic tracking-tight mb-2 group-hover:text-primary transition-colors">
        {title}
      </h4>
      <p className="text-sm text-text-dim leading-relaxed mb-4">
        {description}
      </p>
      <ul className="space-y-2">
        {details.map((detail, idx) => (
          <li key={idx} className="flex items-center gap-2 text-[11px] font-bold text-text-primary/70 uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            {detail}
          </li>
        ))}
      </ul>
    </div>
  </div>
)

export default function HelpSection() {
  const steps = [
    {
      icon: Trophy,
      title: 'Cómo crear una liga',
      description: 'La liga es el contenedor principal de toda tu información. Define la identidad visual y los parámetros globales de tu organización.',
      details: [
        'Configura el Nombre y el Logo oficial',
        'Define la Modalidad (Fútbol 5, 7, 11, etc)',
        'El sistema genera un URL único (slug) para compartir',
        'Establece el costo de inscripción base'
      ]
    },
    {
      icon: Users,
      title: 'Gestión de Equipos y Jugadores',
      description: 'Puebla tu liga con los protagonistas. Puedes gestionar planteles completos con herramientas de carga masiva.',
      details: [
        'Usa "Fichaje en Bloque" para ahorrar tiempo',
        'Registra DNI, Dorsal y Foto de cada jugador',
        'Vincula jugadores a sus equipos correspondientes',
        'Controla el estado de los pagos de inscripción'
      ]
    },
    {
      icon: Edit3,
      title: 'Modificación y Personalización',
      description: 'Mantén la información actualizada. La configuración de la liga permite ajustes dinámicos que impactan en tiempo real.',
      details: [
        'Cambia la ubicación o zona de juego',
        'Actualiza la descripción y reglas del torneo',
        'Modifica el logo para eventos especiales',
        'Nota: El slug y la modalidad son permanentes'
      ]
    },
    {
      icon: Calendar,
      title: 'Arquitecto de Temporadas',
      description: 'Define la competencia. Una liga puede tener múltiples temporadas (ej. Apertura, Clausura, Copa).',
      details: [
        'Elige el formato: Liga (Todos contra todos) o Eliminación',
        'Selecciona qué equipos participan en esta edición',
        'Define fechas de inicio y finalización aproximadas',
        'Configura el número de ascensos/descensos o premios'
      ]
    },
    {
      icon: ListChecks,
      title: 'Control de la Temporada',
      description: 'Una vez lanzada, supervisa el progreso y ajusta lo necesario sin perder integridad de datos.',
      details: [
        'Genera el Fixture Automático con un click',
        'Carga resultados y eventos (goles, tarjetas)',
        'Gestiona sanciones y suspensiones de jugadores',
        'Archiva temporadas finalizadas (Soft Delete)'
      ]
    }
  ]

  return (
    <div className="space-y-12 mt-16 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            <Zap className="w-3 h-3" /> Soporte Administrativo
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-text-primary uppercase italic tracking-tighter">
            Centro de <span className="text-primary">Adopción</span>
          </h2>
          <p className="text-sm text-text-dim max-w-lg">
            Sigue esta guía detallada para configurar tu ecosistema deportivo de manera eficiente y profesional.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-bg-surface/50 p-4 rounded-2xl border border-border-subtle">
           <div className="w-10 h-10 rounded-xl bg-bg-deep flex items-center justify-center text-primary">
              <HelpCircle className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-text-dim tracking-widest">¿Necesitas más ayuda?</p>
              <p className="text-xs font-bold text-text-primary">Soporte Técnico 24/7</p>
           </div>
        </div>
      </div>

      {/* Main Steps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-2">
          {steps.map((step, index) => (
            <HelpStep 
              key={index}
              order={index + 1}
              icon={step.icon}
              title={step.title}
              description={step.description}
              details={step.details}
            />
          ))}
        </div>

        {/* Visual Summary Card */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <GlassCard className="!p-8 border-primary/20 bg-primary/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
               
               <h3 className="text-xl font-heading font-black text-primary uppercase italic mb-8 flex items-center gap-3">
                 <Layout className="w-6 h-6" /> Resumen Maestro
               </h3>

               <div className="space-y-8">
                  {/* Visual Roadmap */}
                  {[
                    { label: 'Estructura', sub: 'Crea tu Liga', color: 'bg-primary' },
                    { label: 'Protagonistas', sub: 'Equipos y Jugadores', color: 'bg-primary' },
                    { label: 'Competición', sub: 'Diseña la Temporada', color: 'bg-primary' },
                    { label: 'Acción', sub: 'Resultados y Fixture', color: 'bg-primary' }
                  ].map((item, idx) => (
                    <div key={idx} className="relative flex items-center gap-5 group">
                      <div className={`w-10 h-10 rounded-xl ${item.color} text-secondary flex items-center justify-center font-black italic shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 border-b border-white/5 pb-4 group-last:border-0 group-last:pb-0">
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">{item.label}</p>
                        <p className="text-sm font-bold text-text-primary">{item.sub}</p>
                      </div>
                      {idx !== 3 && (
                        <div className="absolute left-5 top-10 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent" />
                      )}
                    </div>
                  ))}
               </div>

               <div className="mt-10 p-5 rounded-2xl bg-bg-deep border border-white/5 space-y-4">
                  <div className="flex items-center gap-3 text-primary">
                    <BarChart3 className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest italic">Tip Pro</span>
                  </div>
                  <p className="text-[11px] text-text-dim leading-relaxed font-medium italic">
                    "Configura primero tus equipos y jugadores antes de crear la temporada. Esto te permitirá asignarlos de forma inmediata al fixture."
                  </p>
               </div>
            </GlassCard>

            <div className="p-6 rounded-[2rem] border border-border-subtle bg-bg-surface/30 flex items-center justify-between group hover:bg-primary/5 transition-colors cursor-help">
               <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-text-dim tracking-widest">Versión del Sistema</p>
                  <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">LEAGUE ARENA V2.5.0</p>
               </div>
               <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-primary" />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-10 border-t border-white/5 opacity-30">
        <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-text-dim">
           <span>Integridad</span>
           <span>Velocidad</span>
           <span>Prestigio</span>
        </div>
      </div>
    </div>
  )
}
