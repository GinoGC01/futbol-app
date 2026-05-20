import React from 'react'
import FaseCard from './FaseCard'
import { Layers, Plus } from 'lucide-react'
import Button from '../../../../components/ui/Button'

export default function FaseList({ fases, isVault, onNewFase, ...faseCardProps }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-6 bg-secondary skew-x-[-15deg]" />
        <h3 className="text-xs font-black text-text-dim uppercase tracking-[0.4em]">Estructura de Fases</h3>
      </div>

      {fases?.length > 0 ? (
        <div className="grid gap-6">
          {fases.map(fase => (
            <FaseCard 
              key={fase.id} 
              fase={fase} 
              isVault={isVault} 
              {...faseCardProps} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-bg-deep/50 rounded-[2rem] border-2 border-dashed border-white/5">
          <Layers className="w-16 h-16 text-text-dim/20 mx-auto mb-6" />
          <p className="text-base text-text-dim font-bold mb-6 italic uppercase tracking-normal">El torneo aún no tiene fases competitivas.</p>
          {!isVault && (
            <Button onClick={onNewFase} className="font-black italic uppercase tracking-wide h-12 px-8">
              <Plus className="w-5 h-5 mr-2" /> Definir Primera Fase
            </Button>
          )}
        </div>
      )}

      {fases?.length > 0 && !isVault && (
        <button 
          onClick={onNewFase}
          className="w-full py-6 rounded-2xl border-2 border-dashed border-white/5 hover:border-secondary/20 hover:bg-secondary/5 transition-all text-text-dim hover:text-secondary group"
        >
          <Plus className="w-8 h-8 mx-auto mb-2 opacity-20 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Agregar Fase Adicional</span>
        </button>
      )}
    </>
  )
}
