import { User, Calendar, Trash2, UserCheck, CheckSquare } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import GlassCard from '../../../components/ui/GlassCard'

export default function PlayerCard({ jugador, onEnroll, isGlobal = false, selectionMode = false, isSelected = false, onToggle }) {
  return (
    <GlassCard 
      className={`relative overflow-hidden group border-none ring-1 transition-all duration-500 p-4 sm:p-6 cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5 shadow-[0_0_40px_rgba(206,222,11,0.1)] grayscale-0' 
          : isGlobal 
            ? 'ring-white/5 bg-white/[0.02] grayscale-[0.5] hover:grayscale-0 hover:ring-primary/40' 
            : 'ring-white/10 hover:ring-success/40'
      }`}
      onClick={() => selectionMode ? onToggle() : null}
    >
      {/* Selection Overlay Checkbox */}
      {selectionMode && (
        <div className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
          isSelected ? 'bg-primary border-primary rotate-0 scale-110' : 'border-white/20 bg-black/40 rotate-12'
        }`}>
          {isSelected && <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-bg-deep" />}
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-white/[0.03] to-transparent rounded-bl-[80px] pointer-events-none" />
      <User 
        className="absolute -right-4 -bottom-4 w-24 h-24 sm:w-32 sm:h-32 opacity-[0.01] sm:opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 pointer-events-none group-hover:scale-125 group-hover:-rotate-12 text-primary" 
      />

      <div className="flex flex-col gap-4 sm:gap-5 relative z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary border-2 border-white/5 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
            {jugador.foto_url ? (
              <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl sm:text-2xl font-heading font-black italic">{jugador.nombre[0]}{jugador.apellido[0]}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-heading font-black text-text-primary leading-[1.1] uppercase italic tracking-wide truncate group-hover:text-primary transition-colors">
              {jugador.nombre} {jugador.apellido}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 sm:mt-1.5">
              {jugador.fecha_nacimiento && (
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-primary uppercase italic tracking-widest">
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                  {new Date(jugador.fecha_nacimiento).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: '2-digit' })}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-mono text-text-dim uppercase tracking-[0.2em] font-bold">
                <span className="w-1 h-2 bg-white/20 skew-x-[-15deg]" /> DNI: {jugador.dni || '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
           <Badge status={isGlobal ? 'borrador' : 'activa'} label={isGlobal ? 'MERCADO' : 'FICHADO'} className="text-[8px] font-black px-2.5 py-1 rounded italic tracking-widest" />
           
           {jugador.ligas_historial?.map((ligaName, idx) => (
             <span key={idx} className="text-[8px] font-black text-text-dim border border-white/5 bg-white/5 px-2.5 py-1 rounded italic uppercase tracking-widest">
               {ligaName}
             </span>
           ))}
        </div>

        {!selectionMode && (
          <div className="flex items-center gap-2 pt-1 sm:pt-2">
            <Button 
              onClick={(e) => { e.stopPropagation(); onEnroll(); }} 
              className={`flex-1 h-11 sm:h-12 font-black uppercase italic tracking-wide text-[10px] sm:text-xs transition-all ${
                isGlobal 
                  ? 'bg-primary text-bg-deep shadow-lg shadow-primary/20 hover:scale-[1.02]' 
                  : 'bg-white/5 border border-white/10 text-text-primary hover:bg-primary/10 hover:border-primary/30'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 stroke-[3]" /> Asignar Equipo
            </Button>
            <button 
              onClick={(e) => { e.stopPropagation(); /* delete logic */ }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-text-dim hover:text-danger hover:bg-danger/10 hover:border-danger/20 transition-all active:scale-90 shrink-0 group/del"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/del:scale-110" />
            </button>
          </div>
        )}
        
        {selectionMode && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
            <span className="text-[10px] font-black uppercase italic tracking-wide text-text-dim">
              {isSelected ? 'LISTO PARA FICHAR' : 'CLICK PARA SELECCIONAR'}
            </span>
            {isSelected && <Badge status="activa" label="SELECCIONADO" className="text-[7px] px-2 py-0.5" />}
          </div>
        )}
      </div>
    </GlassCard>
  )
}
