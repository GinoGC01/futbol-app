import React from 'react'
import Button from '../../../../components/ui/Button'
import { Trophy, Plus } from 'lucide-react'

export default function TemporadaHeader({ onNewSeason }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/5 pb-8">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-black uppercase tracking-[0.2em]">
          <Trophy className="w-3.5 h-3.5" /> League Designer
        </div>
        <div className="relative pt-2">
          <h1 className="text-4xl sm:text-6xl font-heading font-black tracking-wide leading-[1.1] uppercase italic">
            Arquitecto de <span className="text-primary">Torneo</span>
          </h1>
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-full bg-secondary/30 skew-x-[-15deg] hidden lg:block" />
        </div>
        <p className="text-base text-text-dim max-w-md font-medium leading-tight italic uppercase tracking-normal">
          Diseña la estructura competitiva y gestiona el fixture oficial.
        </p>
      </div>
      
      <Button 
        onClick={onNewSeason} 
        className="w-full sm:w-auto h-14 px-8 bg-secondary text-bg-deep font-black uppercase italic tracking-wide shadow-2xl shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6 mr-2 stroke-[4]" /> Nueva Temporada
      </Button>
    </div>
  )
}
