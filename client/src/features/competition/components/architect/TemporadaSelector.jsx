import React from 'react'
import Badge from '../../../../components/ui/Badge'
import EmptyState from '../../../../components/ui/EmptyState'
import Button from '../../../../components/ui/Button'
import { Trophy } from 'lucide-react'

export default function TemporadaSelector({ temporadas, selectedTemp, onSelectTemp, onNewSeason }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-1 h-6 bg-primary skew-x-[-15deg]" />
        <h2 className="text-[10px] font-black text-text-dim uppercase tracking-[0.4em]">Ediciones Disponibles</h2>
      </div>
      
      {temporadas?.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
          {temporadas.map(t => (
            <button 
              key={t.id} 
              onClick={() => onSelectTemp(t.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black uppercase italic tracking-wide border transition-all snap-start shrink-0 min-w-[200px] sm:min-w-0 ${
                selectedTemp === t.id 
                  ? 'bg-primary/10 text-primary border-primary/30 ring-1 ring-primary/20 shadow-lg shadow-primary/5' 
                  : 'bg-bg-surface text-text-dim border-white/5 hover:border-white/20'
              }`}
            >
              <Trophy className={`w-5 h-5 ${selectedTemp === t.id ? 'text-primary' : 'text-text-dim opacity-50'}`} />
              <div className="text-left">
                <p className="leading-none mb-1">{t.nombre}</p>
                <Badge status={t.estado} className="text-[8px]" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Trophy} 
          title="Sin temporadas" 
          description="Comienza creando tu primera edición del torneo." 
          action={<Button onClick={onNewSeason} className="font-black italic uppercase tracking-wide">Crear Ahora</Button>} 
        />
      )}
    </div>
  )
}
