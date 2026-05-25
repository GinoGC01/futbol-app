import { Trophy, Plus } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { useState } from 'react'
import { useToast } from '../../../components/ui/Toast'
import NewLigaModal from '../../../components/admin/NewLigaModal'

export default function NoLeagueScreen() {
  const [showNewLiga, setShowNewLiga] = useState(false)
  const [limitReached, setLimitReached] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse-live" />
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-bg-surface border-2 border-dashed border-white/10 rounded-[3rem] flex items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-500 shadow-2xl">
          <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-primary opacity-40" />
        </div>
      </div>

      <div className="max-w-md space-y-6">
        <h2 className="text-4xl sm:text-5xl font-heading font-black tracking-tight uppercase italic leading-none">
          CREAR LIGA PARA <span className="text-primary">CONTINUAR</span>
        </h2>
        <p className="text-sm sm:text-base text-text-dim font-medium uppercase tracking-normal italic leading-relaxed">
          Para acceder a la gestión de equipos, jugadores y torneos, primero debes establecer los cimientos de tu organización.
        </p>
        
        <div className="pt-6">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => setShowNewLiga(true)}
            className="h-16 sm:h-20 px-10 sm:px-12 text-lg sm:text-xl font-black uppercase italic tracking-widest shadow-[0_20px_50px_rgba(206,222,11,0.2)] hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 mr-3 stroke-[4]" /> 
            Crear mi Primera Liga
          </Button>
        </div>
      </div>

      <NewLigaModal 
        open={showNewLiga} 
        onClose={() => { setShowNewLiga(false); setLimitReached(false); }} 
        limitReached={limitReached}
        setLimitReached={setLimitReached}
      />
    </div>
  )
}
