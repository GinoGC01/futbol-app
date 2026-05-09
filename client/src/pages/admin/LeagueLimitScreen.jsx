import React from 'react';
import { ShieldAlert, Trash2, ArrowUpRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LeagueLimitScreen({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
        <div className="relative w-20 h-20 bg-bg-surface border border-white/10 flex items-center justify-center skew-x-[-12deg] mx-auto">
          <ShieldAlert className="w-10 h-10 text-primary skew-x-[12deg]" />
        </div>
      </div>

      <div className="space-y-4 max-w-sm">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
          Límite <span className="text-primary">Alcanzado</span>
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          Tu plan actual (Beta) permite un máximo de <span className="text-white font-bold">1 liga activa</span> al mismo tiempo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-xs mt-10">
        <div className="p-4 bg-white/5 border border-white/5 space-y-3 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-dim text-left">Opción 01 — Liberar slot</p>
          <p className="text-xs text-text-secondary text-left">
            Eliminá una liga que ya no uses. Esto liberará el espacio de forma inmediata.
          </p>
          <Link 
            to="/admin/settings" 
            className="flex items-center justify-between w-full px-4 py-2 bg-white/5 text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
          >
            Ir a Configuración <Trash2 className="w-3 h-3 text-danger" />
          </Link>
        </div>

        <div className="p-4 bg-primary/10 border border-primary/20 space-y-3 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary text-left">Opción 02 — Upgrade</p>
          <p className="text-xs text-text-secondary text-left">
            Contactanos para ampliar tu límite operativo y gestionar múltiples ligas.
          </p>
          <a 
            href="https://wa.me/your-number" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-4 py-2 bg-primary text-bg-deep text-[9px] font-black uppercase tracking-widest hover:bg-white transition-colors"
          >
            Hablar con Soporte <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

        <button 
          onClick={onBack}
          className="mt-4 text-[9px] font-black uppercase tracking-widest text-text-dim hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-3 h-3" /> Volver atrás
        </button>
      </div>
    </div>
  );
}
