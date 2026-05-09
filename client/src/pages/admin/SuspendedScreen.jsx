import React from 'react';
import { AlertOctagon, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function SuspendedScreen() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-danger/20 blur-3xl rounded-full"></div>
          <div className="relative w-24 h-24 bg-bg-surface border border-danger/20 flex items-center justify-center skew-x-[-12deg] mx-auto">
            <AlertOctagon className="w-12 h-12 text-danger skew-x-[12deg]" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
            Cuenta <span className="text-danger">Suspendida</span>
          </h1>
          <p className="text-text-dim font-medium tracking-wide uppercase text-xs sm:text-sm">
            Tu acceso a la plataforma ha sido restringido temporalmente.
          </p>
        </div>

        <div className="bg-bg-surface border border-white/5 p-8 relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <p className="text-text-secondary text-sm leading-relaxed">
              Detectamos una actividad que requiere revisión o hay un problema con tu suscripción. Para resolver esto, por favor contactate con soporte.
            </p>
            
            <div className="h-px bg-gradient-to-right from-transparent via-white/10 to-transparent"></div>
            
            <a 
              href="mailto:soporte@canchalibre.pro" 
              className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest hover:underline"
            >
              <Mail className="w-4 h-4" /> soporte@canchalibre.pro
            </a>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={signOut}
            className="w-full px-8 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-danger hover:border-danger hover:text-white transition-all skew-x-[-12deg] flex items-center justify-center gap-2"
          >
            <span className="skew-x-[12deg] flex items-center gap-2">
              Cerrar Sesión <LogOut className="w-3 h-3" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
