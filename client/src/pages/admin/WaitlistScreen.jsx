import React from 'react';
import { Clock, ExternalLink, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function WaitlistScreen() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative w-24 h-24 bg-bg-surface border border-white/10 flex items-center justify-center skew-x-[-12deg] mx-auto">
            <Clock className="w-12 h-12 text-primary skew-x-[12deg] animate-[spin_10s_linear_infinite]" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
            Estás en la <span className="text-primary">Lista</span>
          </h1>
          <p className="text-text-dim font-medium tracking-wide uppercase text-xs sm:text-sm">
            Tu registro para la beta de Cancha Libre fue recibido con éxito.
          </p>
        </div>

        <div className="bg-bg-surface border border-white/5 p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
          
          <div className="relative z-10 space-y-6">
            <p className="text-text-secondary text-sm leading-relaxed">
              Hola <span className="text-white font-bold">{user?.nombre || user?.email?.split('@')[0]}</span>, estamos habilitando el acceso de forma progresiva para asegurar que cada organizador reciba una experiencia de élite.
            </p>
            
            <div className="h-px bg-gradient-to-right from-transparent via-white/10 to-transparent"></div>
            
            <p className="text-[10px] text-text-dim font-black uppercase tracking-[0.2em]">
              Te avisaremos por email apenas tu cuenta sea activada.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a 
            href="https://canchalibre.pro" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-primary/50 transition-all skew-x-[-12deg] flex items-center justify-center gap-2 group"
          >
            <span className="skew-x-[12deg] flex items-center gap-2">
              Ver Landing <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </a>

          <button 
            onClick={signOut}
            className="w-full sm:w-auto px-8 py-4 bg-danger/10 border border-danger/20 text-danger text-[10px] font-black uppercase tracking-widest hover:bg-danger hover:text-white transition-all skew-x-[-12deg] flex items-center justify-center gap-2"
          >
            <span className="skew-x-[12deg] flex items-center gap-2">
              Cerrar Sesión <LogOut className="w-3 h-3" />
            </span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center opacity-20">
        <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">
          Cancha Libre &copy; {new Date().getFullYear()} - Rendimiento sin compromiso
        </span>
      </div>
    </div>
  );
}
