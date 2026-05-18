import { useState, useEffect } from 'react'
import { useUpdateEquipo, useAddJugador, useTemporadas, useInscribirEquipo, useUpdatePago } from '../../../hooks/useAdmin'
import { rosterService } from '../../../services/rosterService'
import { useToast } from '../../../components/ui/Toast'
import ImageUploader from '../../../components/ui/ImageUploader'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { Search, UserPlus, AlertCircle, ChevronRight, Lock as LockIcon, Shield } from 'lucide-react'

export function EditTeamModal({ open, onClose, equipo }) {
  const [form, setForm] = useState({ 
    nombre: equipo.nombre, 
    color_principal: equipo.color_principal || '#CEDE0B',
    escudo_url: equipo.escudo_url
  })
  const updateMutation = useUpdateEquipo()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = {
        id: equipo.id,
        nombre: form.nombre,
        color_principal: form.color_principal,
        escudo_url: form.escudo_url || null
      }
      await updateMutation.mutateAsync(payload)
      toast.success('Equipo actualizado exitosamente')
      onClose()
    } catch (error) {
      toast.error('Error al actualizar el equipo')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Equipo">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center pb-4">
          <ImageUploader 
            defaultImage={form.escudo_url}
            onUploadSuccess={(url) => setForm(f => ({ ...f, escudo_url: url }))}
            bucket="STAGING_ASSETS"
            path={`equipos/${equipo.liga_id || 'general'}`}
            variant="circular"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Nombre</label>
          <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary transition-all text-sm font-medium bg-bg-surface" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Identidad Visual</label>
          <div className="flex gap-3">
             <input type="color" value={form.color_principal} onChange={e => setForm({...form, color_principal: e.target.value})} className="w-14 h-14 bg-black/20 border border-white/5 rounded-2xl cursor-pointer p-1.5" />
             <input type="text" value={form.color_principal} onChange={e => setForm({...form, color_principal: e.target.value})} className="flex-1 px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary transition-all text-sm font-mono bg-bg-surface" />
          </div>
        </div>
        <Button type="submit" loading={updateMutation.isPending} className="w-full h-12 text-sm font-bold">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}

export function AddPlayerModal({ open, onClose, plantelId, ligaId }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  
  const [enrollForm, setEnrollForm] = useState({ dorsal: '', posicion: 'mediocampista' })
  const [isCreating, setIsCreating] = useState(false)
  const [newPlayerForm, setNewPlayerForm] = useState({ nombre: '', apellido: '', dni: '' })
  const addMutation = useAddJugador()
  const toast = useToast()

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const data = await rosterService.searchJugadores(query, ligaId)
      setResults(data || [])
    } catch { toast.error('Error al buscar jugadores') }
    setSearching(false)
  }

  async function handleCreateAndEnroll(e) {
    e.preventDefault()
    if (!plantelId) {
      toast.error('No hay un plantel activo para este equipo. Primero inscríbelo en una temporada.')
      return
    }
    setIsCreating(true)
    try {
      const { jugador } = await rosterService.createJugador(newPlayerForm)
      const payload = {
        plantel_id: plantelId,
        jugador_id: jugador.id,
        posicion: enrollForm.posicion,
        ...(enrollForm.dorsal ? { dorsal: parseInt(enrollForm.dorsal) } : {})
      }
      await addMutation.mutateAsync(payload)
      toast.success('Jugador creado e inscrito')
      onClose()
      resetStates()
    } catch (error) {
      toast.error(error.message || 'Error al crear/inscribir jugador')
    }
    setIsCreating(false)
  }

  function resetStates() {
    setSelectedPlayer(null)
    setIsCreating(false)
    setQuery('')
    setResults([])
    setNewPlayerForm({ nombre: '', apellido: '', dni: '' })
  }

  async function handleEnroll(e) {
    e.preventDefault()
    if (!selectedPlayer) return
    if (!plantelId) {
      toast.error('No hay un plantel activo. Inscribí el equipo en una temporada primero.')
      return
    }

    try {
      const payload = {
        plantel_id: plantelId,
        jugador_id: selectedPlayer.id,
        posicion: enrollForm.posicion,
        ...(enrollForm.dorsal ? { dorsal: parseInt(enrollForm.dorsal) } : {})
      }
      await addMutation.mutateAsync(payload)
      toast.success('Inscripción exitosa')
      onClose()
      resetStates()
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error en la inscripción')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Inscribir Jugador">
      {!selectedPlayer ? (
        <div className="space-y-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="DNI, Nombre o Apellido..." className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-medium bg-bg-surface" />
            </div>
            <Button onClick={handleSearch} loading={searching} className="h-11">Buscar</Button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 px-1 custom-scrollbar">
            {results.map(j => (
              <button 
                key={j.id} 
                onClick={() => !j.inscripcion_activa && setSelectedPlayer(j)} 
                disabled={!!j.inscripcion_activa}
                className={`w-full flex items-center justify-between p-4 rounded-xl border border-transparent transition-all text-left group ${
                  j.inscripcion_activa ? 'opacity-60 cursor-not-allowed bg-white/2' : 'hover:bg-white/5 hover:border-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary group-hover:scale-110 transition-transform">{j.nombre[0]}{j.apellido[0]}</div>
                  <div>
                    <p className="text-sm font-bold">{j.nombre} {j.apellido}</p>
                    {j.inscripcion_activa ? (
                      <p className="text-[10px] text-warning font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Inscrito en: {j.inscripcion_activa.equipo_nombre}
                      </p>
                    ) : (
                      <p className="text-[10px] text-text-dim font-bold tracking-widest uppercase">ID: {j.id.split('-')[0]}</p>
                    )}
                  </div>
                </div>
                {!j.inscripcion_activa && <ChevronRight className="w-5 h-5 text-text-dim group-hover:text-primary transition-colors" />}
                {j.inscripcion_activa && <LockIcon className="w-4 h-4 text-text-dim" />}
              </button>
            ))}
            {query && results.length === 0 && !searching && (
              <div className="py-10 text-center space-y-3">
                 <AlertCircle className="w-10 h-10 text-text-dim mx-auto opacity-50" />
                 <p className="text-sm text-text-dim font-medium">No encontramos al jugador en la liga.</p>
                 <Button variant="outline" size="sm" onClick={() => {
                   setNewPlayerForm({ ...newPlayerForm, nombre: query.split(' ')[0] || '', apellido: query.split(' ')[1] || '' })
                   setIsCreating(true)
                 }}>Registrar Nuevo Jugador</Button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-text-dim text-center px-6 italic">Tip: El jugador es un recurso global. Si ya jugó en otra liga, búscalo por su nombre completo o DNI.</p>
        </div>
      ) : isCreating ? (
        <form onSubmit={handleCreateAndEnroll} className="space-y-6 animate-fade-in">
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
             <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
               <UserPlus className="w-4 h-4" /> Nuevo Jugador Global
             </h3>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-dim uppercase">Nombre</label>
                  <input type="text" required value={newPlayerForm.nombre} onChange={e => setNewPlayerForm({...newPlayerForm, nombre: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm outline-none focus:border-primary bg-bg-surface" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-dim uppercase">Apellido</label>
                  <input type="text" required value={newPlayerForm.apellido} onChange={e => setNewPlayerForm({...newPlayerForm, apellido: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm outline-none focus:border-primary bg-bg-surface" />
                </div>
             </div>
             <div className="space-y-1 mt-3">
                <label className="text-[10px] font-bold text-text-dim uppercase">DNI / ID (Opcional)</label>
                <input type="text" value={newPlayerForm.dni} onChange={e => setNewPlayerForm({...newPlayerForm, dni: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm outline-none focus:border-primary font-mono bg-bg-surface" />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Número (Dorsal)</label>
              <input type="number" required value={enrollForm.dorsal} onChange={e => setEnrollForm({...enrollForm, dorsal: e.target.value})} placeholder="Ej: 10" className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-mono bg-bg-surface" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Posición</label>
              <select value={enrollForm.posicion} onChange={e => setEnrollForm({...enrollForm, posicion: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-medium appearance-none bg-bg-surface">
                <option value="arquero" className="bg-bg-surface text-text-primary">Arquero</option>
                <option value="defensor" className="bg-bg-surface text-text-primary">Defensor</option>
                <option value="mediocampista" className="bg-bg-surface text-text-primary">Mediocampista</option>
                <option value="delantero" className="bg-bg-surface text-text-primary">Delantero</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button type="submit" loading={addMutation.isPending || isCreating} className="flex-[2] h-12 text-sm font-extrabold shadow-xl shadow-primary/20">Crear e Inscribir</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleEnroll} className="space-y-6 animate-fade-in">
          <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">{selectedPlayer.nombre[0]}{selectedPlayer.apellido[0]}</div>
                <div className="flex-1">
                  <p className="font-extrabold text-xl">{selectedPlayer.nombre} {selectedPlayer.apellido}</p>
                  <Badge label="Jugador Global" status="activa" />
                </div>
             </div>
             <button type="button" onClick={() => setSelectedPlayer(null)} className="w-full py-2 bg-black/20 text-[10px] font-bold text-primary uppercase tracking-[0.2em] rounded-lg border border-primary/10 hover:bg-primary/10 transition-all">Cambiar Elección</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Número (Dorsal)</label>
              <input type="number" required value={enrollForm.dorsal} onChange={e => setEnrollForm({...enrollForm, dorsal: e.target.value})} placeholder="Ej: 10" className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-mono bg-bg-surface" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Posición en Campo</label>
              <select value={enrollForm.posicion} onChange={e => setEnrollForm({...enrollForm, posicion: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-medium appearance-none cursor-pointer bg-bg-surface">
                <option value="arquero" className="bg-bg-surface text-text-primary">Arquero</option>
                <option value="defensor" className="bg-bg-surface text-text-primary">Defensor</option>
                <option value="mediocampista" className="bg-bg-surface text-text-primary">Mediocampista</option>
                <option value="delantero" className="bg-bg-surface text-text-primary">Delantero</option>
              </select>
            </div>
          </div>

          <Button type="submit" loading={addMutation.isPending} className="w-full h-14 text-sm font-extrabold shadow-xl shadow-primary/20">Finalizar Inscripción</Button>
        </form>
      )}
    </Modal>
  )
}

export function InscribeTeamModal({ open, onClose, equipoId, ligaId }) {
  const { data: temporadas } = useTemporadas(ligaId)
  const activeTemporadas = (temporadas || []).filter(t => t.estado === 'activa' || t.estado === 'borrador')
  const [form, setForm] = useState({ temporada_id: '', limite_jugadores: 20 })
  const inscribeMutation = useInscribirEquipo()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.temporada_id) return toast.error('Selecciona una temporada')
    try {
      await inscribeMutation.mutateAsync({ equipo_id: equipoId, ...form })
      toast.success('Equipo inscrito exitosamente')
      onClose()
    } catch (error) {
      toast.error('Error al inscribir equipo')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Inscribir en Temporada">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Temporada Disponible</label>
          <select value={form.temporada_id} onChange={e => setForm({...form, temporada_id: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-medium appearance-none cursor-pointer bg-bg-surface text-text-primary">
            <option value="" className="bg-bg-surface text-text-primary">Seleccionar temporada...</option>
            {activeTemporadas.map(t => (
              <option key={t.id} value={t.id} className="bg-bg-surface text-text-primary">{t.nombre} ({t.estado})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Límite Jugadores</label>
          <input type="number" value={form.limite_jugadores} onChange={e => setForm({...form, limite_jugadores: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-mono bg-bg-surface" />
        </div>
        <Button type="submit" loading={inscribeMutation.isPending} className="w-full h-12 text-sm font-bold bg-secondary hover:bg-secondary-dim text-bg-deep font-black uppercase italic">Confirmar Inscripción</Button>
      </form>
    </Modal>
  )
}

export function UpdatePaymentModal({ open, onClose, inscripcion }) {
  const [monto, setMonto] = useState(inscripcion.monto_abonado || 0)
  const updatePago = useUpdatePago()
  const toast = useToast()

  const restante = inscripcion.monto_total - monto

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await updatePago.mutateAsync({ id: inscripcion.id, monto_abonado: Number(monto) })
      toast.success('Estado de pago actualizado')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el pago')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Actualizar Estado Financiero" size="sm">
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="p-4 bg-bg-surface border border-border-subtle rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-dim font-bold uppercase tracking-widest">Monto Total</span>
            <span className="text-sm font-black tracking-wide">${inscripcion.monto_total}</span>
          </div>
          
          <label className="block space-y-2">
            <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Monto Abonado</span>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</div>
              <input 
                type="number" 
                value={monto}
                onChange={e => setMonto(e.target.value)}
                max={inscripcion.monto_total}
                min={0}
                className="w-full pl-10 pr-4 py-3.5 bg-bg-elevated border border-border-subtle rounded-xl text-sm focus:border-primary transition-all outline-none font-bold shadow-sm text-text-primary bg-bg-surface"
              />
            </div>
          </label>

          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-text-dim font-bold uppercase tracking-widest">Restante</span>
            <span className={`text-lg font-black tracking-wide ${restante <= 0 ? 'text-success' : 'text-warning'}`}>
              ${restante}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={updatePago.isPending} className="flex-1 bg-primary text-secondary font-black uppercase italic tracking-wide">
            Actualizar Pago
          </Button>
        </div>
      </form>
    </Modal>
  )
}
