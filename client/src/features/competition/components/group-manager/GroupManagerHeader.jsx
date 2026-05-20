import React from 'react'
import { X, Users } from 'lucide-react'

export default function GroupManagerHeader({ faseNombre, onClose }) {
  return (
    <div className="p-6 sm:p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-bg-deep/40">
      <div className="space-y-1">
        <h3 className="text-2xl font-heading font-black tracking-wide text-text-primary uppercase italic">
          Gestionar Grupos - <span className="text-primary">{faseNombre}</span>
        </h3>
        <p className="text-[10px] text-text-dim font-black uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-secondary" /> Mínimo 4 equipos por grupo.
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-3 rounded-xl bg-white/5 border border-white/5 text-text-dim hover:text-text-primary hover:bg-white/10 hover:border-white/10 transition-all"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
