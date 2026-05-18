import { useState, useEffect } from 'react'
import { useEquipos, useTemporadas, useInscripcionesEquipo, useAddJugadoresBatch } from '../../../hooks/useAdmin'
import { useToast } from '../../../components/ui/Toast'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { Shield, Trophy, ChevronRight, UserCheck, Users, Layers, X, Plus } from 'lucide-react'

export default function BatchFichajeModal({ open, onClose, selectedPlayers, setSelectedPlayers, ligaId, onSuccess }) {
  const [step, setStep] = useState(1)
  const { data: equipos } = useEquipos(ligaId)
  const { data: temporadas } = useTemporadas(ligaId)
  const [selectedEquipoId, setSelectedEquipoId] = useState('')
  const [selectedTemporadaId, setSelectedTemporadaId] = useState('')
  const { data: teamInscripciones } = useInscripcionesEquipo(ligaId, selectedEquipoId)
  
  const [playerData, setPlayerData] = useState({})
  const addBatchMutation = useAddJugadoresBatch()
  const toast = useToast()

  // Find active inscription for the selected team/season to check limits
  const activeInsc = teamInscripciones?.find(i => i.temporada_id === selectedTemporadaId)
  const currentRosterSize = activeInsc?.plantel?.inscripciones?.length || 0
  const maxCapacity = activeInsc?.limite_jugadores || 25
  const availableSpots = maxCapacity - currentRosterSize
  const isOverCapacity = selectedPlayers.length > availableSpots

  // Initialize player data when reaching Step 2
  useEffect(() => {
    if (step === 2 && Object.keys(playerData).length === 0) {
      const initial = {}
      selectedPlayers.forEach(p => {
        initial[p.id] = { dorsal: '', posicion: 'mediocampista' }
      })
      setPlayerData(initial)
    }
  }, [step, selectedPlayers])

  const validateDorsals = () => {
    const dorsals = Object.values(playerData).map(d => d.dorsal).filter(d => d !== '')
    const unique = new Set(dorsals)
    if (unique.size !== dorsals.length) {
      toast.error('Hay dorsales duplicados en tu selección')
      return false
    }
    // Also check against current roster
    const existingDorsals = activeInsc?.plantel?.inscripciones?.map(i => i.dorsal) || []
    const collision = dorsals.find(d => existingDorsals.includes(Number(d)))
    if (collision) {
      toast.error(`El dorsal ${collision} ya está ocupado en el equipo`)
      return false
    }
    return true
  }

  const handleAutocomplete = () => {
    const existingDorsals = activeInsc?.plantel?.inscripciones?.map(i => i.dorsal) || []
    let current = 1
    const newData = { ...playerData }
    selectedPlayers.forEach(p => {
      while (existingDorsals.includes(current) || Object.values(newData).some(d => Number(d.dorsal) === current)) {
        current++
      }
      newData[p.id] = { ...newData[p.id], dorsal: current.toString() }
      current++
    })
    setPlayerData(newData)
    toast.success('Dorsales autocompletados')
  }

  const handleFinish = async () => {
    if (!activeInsc) return toast.error('Error de configuración de equipo')
    
    const payload = {
      plantel_id: activeInsc.plantel.id,
      jugadores: selectedPlayers.map(p => ({
        jugador_id: p.id,
        dorsal: playerData[p.id]?.dorsal ? Number(playerData[p.id].dorsal) : undefined,
        posicion: playerData[p.id]?.posicion || 'mediocampista'
      }))
    }

    try {
      await addBatchMutation.mutateAsync(payload)
      toast.success(`${selectedPlayers.length} jugadores fichados correctamente`)
      onSuccess?.()
      onClose()
      setStep(1)
      setPlayerData({})
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al procesar el fichaje en bloque')
    }
  }

  if (!open) return null

  return (
    <Modal 
      open={open} 
      onClose={() => { onClose(); setStep(1); }} 
      title="Proceso de Fichaje en Bloque" 
      size={step === 2 ? 'lg' : 'md'}
    >
      <div className="space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic transition-all ${
                step === i ? 'bg-primary text-bg-deep scale-110 shadow-lg shadow-primary/20' : 
                step > i ? 'bg-success text-white' : 'bg-white/5 text-text-dim'
              }`}>
                {step > i ? <UserCheck className="w-4 h-4" /> : i}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${step === i ? 'text-primary' : 'text-text-dim'}`}>
                {i === 1 ? 'Destino' : i === 2 ? 'Atributos' : 'Confirmar'}
              </span>
              {i < 3 && <div className="w-12 h-px bg-white/10 mx-2" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] mb-1">Total a Fichar</p>
                <p className="text-4xl font-heading font-black text-primary italic leading-none">{selectedPlayers.length} <span className="text-sm">JUGADORES</span></p>
              </div>
              <Layers className="w-12 h-12 text-primary opacity-20" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Seleccionar Equipo</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                  <select 
                    value={selectedEquipoId} 
                    onChange={e => setSelectedEquipoId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-bold uppercase italic tracking-wide cursor-pointer text-text-primary bg-bg-surface"
                  >
                    <option value="">SELECCIONA EQUIPO...</option>
                    {equipos?.map(e => <option key={e.id} value={e.id} className="text-text-primary bg-bg-surface">{e.nombre.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Seleccionar Temporada</label>
                <div className="relative group">
                  <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warning" />
                  <select 
                    disabled={!selectedEquipoId}
                    value={selectedTemporadaId} 
                    onChange={e => setSelectedTemporadaId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-bg-input border border-white/5 rounded-2xl outline-none focus:border-primary text-sm font-bold uppercase italic tracking-wide cursor-pointer disabled:opacity-20 text-text-primary bg-bg-surface"
                  >
                    <option value="">SELECCIONA TEMPORADA...</option>
                    {temporadas?.filter(t => t.estado !== 'finalizada').map(t => <option key={t.id} value={t.id} className="text-text-primary bg-bg-surface">{t.nombre.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {selectedEquipoId && selectedTemporadaId && (
              <div className={`p-6 rounded-3xl border animate-slide-up transition-all ${isOverCapacity ? 'bg-danger/10 border-danger/30' : 'bg-success/10 border-success/30'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isOverCapacity ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase italic tracking-normal">Capacidad del Plantel</p>
                    <p className="text-xl font-heading font-black italic">
                      {currentRosterSize} / {maxCapacity} <span className="text-xs opacity-60">Fichados</span>
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isOverCapacity ? 'text-danger' : 'text-success'}`}>
                      {isOverCapacity 
                        ? `ERROR: No hay espacio suficiente (Quedan ${availableSpots} lugares)` 
                        : `Disponible: ${availableSpots} lugares`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              disabled={!selectedEquipoId || !selectedTemporadaId || isOverCapacity}
              onClick={() => setStep(2)}
              className="w-full h-16 bg-primary text-bg-deep font-black uppercase italic tracking-wide"
            >
              Cargar Datos <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Configuración de Dorsales</p>
              <Button variant="ghost" size="xs" onClick={handleAutocomplete} className="text-primary hover:bg-primary/10 border border-primary/20">
                <Layers className="w-3 h-3 mr-2" /> Autocompletar Dorsales
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedPlayers.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-bg-surface/50 border border-white/5 flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic border border-primary/20 shrink-0">
                      {p.nombre[0]}{p.apellido[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase italic tracking-normal truncate">{p.nombre} {p.apellido}</p>
                      <p className="text-[9px] text-text-dim font-bold tracking-widest uppercase">ID: {p.dni || p.id.split('-')[0]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <input 
                        type="number" 
                        placeholder="Nº"
                        value={playerData[p.id]?.dorsal || ''}
                        onChange={e => setPlayerData({ ...playerData, [p.id]: { ...playerData[p.id], dorsal: e.target.value } })}
                        className="w-full px-3 py-2 bg-bg-input border border-white/10 rounded-xl text-center font-mono font-black text-sm outline-none focus:border-primary text-text-primary"
                      />
                    </div>
                    <select 
                      value={playerData[p.id]?.posicion || 'mediocampista'}
                      onChange={e => setPlayerData({ ...playerData, [p.id]: { ...playerData[p.id], posicion: e.target.value } })}
                      className="flex-1 min-w-[120px] px-3 py-2 bg-bg-input border border-white/10 rounded-xl text-xs font-black uppercase italic outline-none focus:border-primary cursor-pointer text-text-primary bg-bg-surface"
                    >
                      <option value="arquero" className="text-text-primary bg-bg-surface">Arquero</option>
                      <option value="defensor" className="text-text-primary bg-bg-surface">Defensor</option>
                      <option value="mediocampista" className="text-text-primary bg-bg-surface">Mediocampista</option>
                      <option value="delantero" className="text-text-primary bg-bg-surface">Delantero</option>
                    </select>
                    <button 
                      onClick={() => {
                        const newSelection = selectedPlayers.filter(sp => sp.id !== p.id)
                        setSelectedPlayers(newSelection)
                        if (newSelection.length === 0) { onClose(); setStep(1); }
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/10 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-14 border border-white/10 font-black uppercase italic tracking-wide">
                Volver
              </Button>
              <Button 
                onClick={() => { if (validateDorsals()) setStep(3); }}
                className="flex-[2] h-14 bg-primary text-bg-deep font-black uppercase italic tracking-wide shadow-lg shadow-primary/20"
              >
                Revisar Resumen <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 relative overflow-hidden">
               <Shield className="absolute -right-10 -bottom-10 w-40 h-40 opacity-5 pointer-events-none" />
               <div className="relative z-10 text-center space-y-4">
                  <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3">
                    <UserCheck className="w-10 h-10 text-bg-deep" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-1">Confirmación Final</p>
                    <h3 className="text-3xl font-heading font-black italic uppercase tracking-wide leading-none">
                      Fichar {selectedPlayers.length} Talentos
                    </h3>
                    <p className="text-sm font-bold text-text-dim mt-2 uppercase italic tracking-normal">
                      EN <span className="text-white">{equipos.find(e => e.id === selectedEquipoId)?.nombre}</span>
                    </p>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] ml-1">Vista Previa del Roster</p>
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {selectedPlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-mono font-black text-[10px]">
                        {playerData[p.id]?.dorsal || '--'}
                      </span>
                      <p className="text-xs font-black uppercase italic tracking-normal">{p.nombre} {p.apellido}</p>
                    </div>
                    <Badge label={playerData[p.id]?.posicion} status="borrador" className="text-[8px] px-2 py-0.5" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 h-16 border border-white/10 font-black uppercase italic tracking-wide">
                Editar Datos
              </Button>
              <Button 
                loading={addBatchMutation.isPending}
                onClick={handleFinish}
                className="flex-[2] h-16 bg-primary text-bg-deep font-black uppercase italic tracking-wide text-lg shadow-2xl shadow-primary/20"
              >
                Confirmar Fichaje <Plus className="w-6 h-6 ml-2 stroke-[3]" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
