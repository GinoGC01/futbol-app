import { useState } from 'react'
import { useEquipos, useTemporadas, useInscripcionesEquipo, useAddJugador } from '../../../hooks/useAdmin'
import { useToast } from '../../../components/ui/Toast'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { Shield, Trophy, ChevronDown, UserCheck } from 'lucide-react'

export default function EnrollPlayerModal({ open, onClose, jugador, ligaId }) {
  const { data: equipos } = useEquipos(ligaId)
  const [selectedEquipoId, setSelectedEquipoId] = useState('')
  const { data: temporadas } = useTemporadas(ligaId)
  
  const [form, setForm] = useState({ temporada_id: '', dorsal: '', posicion: 'mediocampista' })
  const addMutation = useAddJugador()
  const toast = useToast()

  const { data: inscripciones } = useInscripcionesEquipo(ligaId, selectedEquipoId)
  
  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedEquipoId || !form.temporada_id) return toast.error('Selecciona equipo y temporada')
    
    const insc = (inscripciones || []).find(i => i.temporada_id === form.temporada_id)
    if (!insc) return toast.error('El equipo no está inscrito en esa temporada')

    try {
      await addMutation.mutateAsync({
        plantel_id: insc.plantel.id,
        jugador_id: jugador.id,
        posicion: form.posicion,
        dorsal: form.dorsal ? Number(form.dorsal) : undefined
      })
      toast.success(`${jugador.nombre} inscrito exitosamente`)
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error en inscripción')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Asignar al Roster" size="sm">
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/10 rounded-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 skew-x-[-20deg] translate-x-12 pointer-events-none" />
             <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-xl bg-primary text-bg-deep flex items-center justify-center font-black text-2xl italic shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3 shrink-0">
                  {jugador?.nombre[0]}{jugador?.apellido[0]}
                </div>
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-1">Inscribir Jugador</p>
                   <p className="text-2xl font-heading font-black text-text-primary uppercase italic leading-none tracking-tight truncate">
                     {jugador?.nombre} {jugador?.apellido}
                   </p>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2.5">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] ml-1 italic">1. Equipo de Destino</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:text-white transition-colors z-10" />
                  <select 
                    value={selectedEquipoId} 
                    onChange={e => setSelectedEquipoId(e.target.value)}
                    className="w-full pl-12 pr-4 py-5 bg-bg-surface border border-white/5 rounded-none outline-none focus:border-primary text-sm font-black uppercase italic tracking-widest appearance-none cursor-pointer text-text-primary"
                  >
                    <option value="">SELECCIONA UN EQUIPO...</option>
                    {equipos?.map(e => <option key={e.id} value={e.id} className="text-text-primary bg-bg-surface">{e.nombre.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
                </div>
             </div>

             <div className="space-y-2.5">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] ml-1 italic">2. Temporada Activa</label>
                <div className="relative group">
                  <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warning group-focus-within:text-white transition-colors z-10" />
                  <select 
                    disabled={!selectedEquipoId}
                    value={form.temporada_id} 
                    onChange={e => setForm({...form, temporada_id: e.target.value})}
                    className="w-full pl-12 pr-4 py-5 bg-bg-surface border border-white/5 rounded-none outline-none focus:border-primary text-sm font-black uppercase italic tracking-widest appearance-none cursor-pointer disabled:opacity-30 disabled:grayscale transition-all text-text-primary"
                  >
                    <option value="">SELECCIONA TEMPORADA...</option>
                    {(temporadas || []).filter(t => t.estado !== 'finalizada').map(t => (
                      <option key={t.id} value={t.id} className="text-text-primary bg-bg-surface">{t.nombre.toUpperCase()} ({t.estado.toUpperCase()})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                   <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] ml-1 italic">Dorsal</label>
                   <input 
                     type="number" 
                     value={form.dorsal} 
                     onChange={e => setForm({...form, dorsal: e.target.value})} 
                     placeholder="10" 
                     className="w-full px-5 py-5 bg-bg-surface border border-white/5 rounded-none outline-none focus:border-primary text-sm font-mono font-black placeholder:text-text-dim/20 text-text-primary" 
                   />
                </div>
                <div className="space-y-2.5">
                   <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] ml-1 italic">Posición</label>
                   <div className="relative group">
                     <select 
                       value={form.posicion} 
                       onChange={e => setForm({...form, posicion: e.target.value})} 
                       className="w-full px-5 py-5 bg-bg-surface border border-white/5 rounded-none outline-none focus:border-primary text-sm font-black uppercase italic tracking-widest appearance-none cursor-pointer text-text-primary"
                     >
                       <option value="arquero" className="text-text-primary bg-bg-surface">ARQUERO</option>
                       <option value="defensor" className="text-text-primary bg-bg-surface">DEFENSOR</option>
                       <option value="mediocampista" className="text-text-primary bg-bg-surface">MEDIOCAMPISTA</option>
                       <option value="delantero" className="text-text-primary bg-bg-surface">DELANTERO</option>
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim pointer-events-none" />
                   </div>
                </div>
             </div>
          </div>

          <Button 
            noSkew
            type="submit" 
            loading={addMutation.isPending} 
            className="w-full h-20 bg-primary text-bg-deep font-black uppercase italic tracking-[0.2em] text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group"
          >
            <span className="flex items-center justify-center gap-3">
              CONFIRMAR FICHAJE <UserCheck className="w-7 h-7 stroke-[3]" />
            </span>
          </Button>
        </form>
    </Modal>
  )
}
