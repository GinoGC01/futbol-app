import { useState, useMemo } from 'react'
import { 
  Users, 
  Shield, 
  Calendar, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lock as LockIcon
} from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { 
  useInscripcionesEquipo, 
  useUpdateEquipo, 
  useAddJugador,
  useTemporadas,
  useInscribirEquipo,
  useDeleteEquipo
} from '../../hooks/useAdmin'
import { adminService } from '../../services/adminService'
import { useToast } from '../../components/ui/Toast'

export default function TeamDetailView({ equipo, onBack, ligaId }) {
  const [activeTab, setActiveTab] = useState('plantel')
  const { data: inscripciones, isLoading } = useInscripcionesEquipo(ligaId, equipo.id)
  const [selectedInscripcionId, setSelectedInscripcionId] = useState(null)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showEditTeam, setShowEditTeam] = useState(false)
  const [showInscribeTeam, setShowInscribeTeam] = useState(false)
  const deleteEquipo = useDeleteEquipo()
  const toast = useToast()

  const viewedInscripcion = useMemo(() => {
    if (!inscripciones?.length) return null
    if (selectedInscripcionId) return inscripciones.find(i => i.id === selectedInscripcionId)
    return inscripciones[0] 
  }, [inscripciones, selectedInscripcionId])

  const latestInscripcion = inscripciones?.[0]
  const plantel = viewedInscripcion?.plantel?.inscripciones || []

  if (isLoading) return <div className="py-20 flex justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden group shadow-lg"
              style={{ backgroundColor: equipo.color_principal ? `${equipo.color_principal}20` : 'rgba(0,237,100,0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <Shield className="w-8 h-8 relative z-10" style={{ color: equipo.color_principal || 'var(--color-primary)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-heading font-extrabold tracking-tight">{equipo.nombre}</h1>
                <Button variant="ghost" size="icon" onClick={() => setShowEditTeam(true)} className="h-8 w-8 text-text-dim hover:text-primary">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-text-dim text-sm font-medium">
                <Badge 
                  status={viewedInscripcion ? (viewedInscripcion.temporada.estado === 'activa' ? 'activa' : 'finalizada') : 'cerrada'} 
                  label={viewedInscripcion ? `Temporada: ${viewedInscripcion.temporada.nombre}` : 'Sin participación activa'} 
                />
                <span>•</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {plantel.length} Jugadores</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!latestInscripcion && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-danger hover:bg-danger/10 border-danger/20 h-10"
              onClick={() => {
                if (confirm(`¿Estás seguro de eliminar definitivamente el equipo "${equipo.nombre}"?`)) {
                  deleteEquipo.mutate(equipo.id, {
                    onSuccess: () => {
                      toast.success('Equipo eliminado')
                      onBack()
                    },
                    onError: (err) => toast.error(err.message)
                  })
                }
              }}
              loading={deleteEquipo.isPending}
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </Button>
          )}
          {!latestInscripcion ? (
            <Button variant="primary" size="sm" onClick={() => setShowInscribeTeam(true)} className="h-10 bg-purple-600 hover:bg-purple-700">
              <Calendar className="w-4 h-4" /> Inscribir en Temporada
            </Button>
          ) : (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => setShowAddPlayer(true)} 
              className="h-10"
              disabled={viewedInscripcion?.temporada?.estado === 'finalizada'}
            >
              <UserPlus className="w-4 h-4" /> {viewedInscripcion?.temporada?.estado === 'finalizada' ? 'Temporada Cerrada' : 'Inscribir Jugador'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatItem label="Jugadores Inscritos" value={plantel.length} subValue={`Límite: ${latestInscripcion?.plantel?.limite_jugadores || '--'}`} icon={Users} color="var(--color-primary)" />
        <StatItem label="Estado Financiero" value={latestInscripcion?.estado_pago?.toUpperCase() || 'N/A'} subValue={`Abonado: $${latestInscripcion?.monto_abonado || 0}`} icon={Shield} color={latestInscripcion?.estado_pago === 'pagado' ? '#00ED64' : '#EAB308'} />
        <StatItem label="Participaciones" value={inscripciones?.length || 0} subValue="Temporadas totales" icon={Calendar} color="#8B5CF6" />
      </div>

      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit border border-white/5">
        <TabButton active={activeTab === 'plantel'} onClick={() => setActiveTab('plantel')} label={viewedInscripcion?.id !== latestInscripcion?.id ? `Plantel (${viewedInscripcion?.temporada.nombre})` : 'Plantel Actual'} />
        <TabButton active={activeTab === 'historia'} onClick={() => setActiveTab('historia')} label="Historia" />
      </div>

      {activeTab === 'plantel' ? (
        <GlassCard className="overflow-hidden border-none p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[11px] font-heading font-bold text-text-dim uppercase tracking-wider">Jugador</th>
                <th className="px-6 py-4 text-[11px] font-heading font-bold text-text-dim uppercase tracking-wider">Dorsal</th>
                <th className="px-6 py-4 text-[11px] font-heading font-bold text-text-dim uppercase tracking-wider">Posición</th>
                <th className="px-6 py-4 text-[11px] font-heading font-bold text-text-dim uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {plantel.length > 0 ? plantel.map(p => (
                <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {p.jugador.nombre[0]}{p.jugador.apellido[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{p.jugador.nombre} {p.jugador.apellido}</p>
                        <p className="text-[10px] text-text-dim">ID: {p.jugador.id.split('-')[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs px-2 py-0.5 bg-black/30 rounded border border-white/10 text-primary">#{p.dorsal || '--'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge label={p.posicion || 'N/A'} variant="secondary" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> ACTIVO
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-dim hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-dim text-sm italic">
                    No hay jugadores inscritos en el plantel actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </GlassCard>
      ) : (
        <div className="grid gap-3">
          {inscripciones?.map(ins => (
            <GlassCard 
              key={ins.id} 
              onClick={() => {
                setSelectedInscripcionId(ins.id)
                setActiveTab('plantel')
              }}
              className={`flex items-center justify-between group hover:border-primary/30 transition-all p-4 cursor-pointer ${
                viewedInscripcion?.id === ins.id ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  viewedInscripcion?.id === ins.id ? 'bg-primary text-secondary' : 'bg-white/5 text-text-dim'
                }`}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{ins.temporada.nombre}</p>
                  <p className="text-[11px] text-text-dim uppercase font-bold tracking-widest mt-0.5">{ins.temporada.estado}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold">{ins.plantel.inscripciones.length} Jugadores</p>
                  <p className={`text-[11px] font-bold uppercase tracking-tighter ${ins.estado_pago === 'pagado' ? 'text-success' : 'text-warning'}`}>
                    {ins.estado_pago}
                  </p>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${
                  viewedInscripcion?.id === ins.id ? 'text-primary translate-x-1' : 'text-text-dim group-hover:translate-x-1'
                }`} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <EditTeamModal open={showEditTeam} onClose={() => setShowEditTeam(false)} equipo={equipo} />
      <AddPlayerModal 
        open={showAddPlayer} 
        onClose={() => setShowAddPlayer(false)} 
        plantelId={viewedInscripcion?.plantel?.id} 
        ligaId={ligaId}
      />
      <InscribeTeamModal open={showInscribeTeam} onClose={() => setShowInscribeTeam(false)} equipoId={equipo.id} ligaId={ligaId} />
    </div>
  )
}

function StatItem({ label, value, subValue, icon: Icon, color }) {
  return (
    <GlassCard className="group relative overflow-hidden">
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold tracking-tighter">{value}</p>
            <p className="text-[10px] font-bold text-text-dim uppercase">{subValue}</p>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/5 shadow-inner" style={{ color }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 blur-[60px] opacity-10 rounded-full" style={{ backgroundColor: color }} />
    </GlassCard>
  )
}

function TabButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${active ? 'bg-primary text-[#0D0D0D] shadow-lg shadow-primary/20 scale-105' : 'text-text-dim hover:text-text-primary hover:bg-white/5'}`}>
      {label}
    </button>
  )
}

function EditTeamModal({ open, onClose, equipo }) {
  const [form, setForm] = useState({ nombre: equipo.nombre, color_principal: equipo.color_principal || '#00ED64' })
  const updateMutation = useUpdateEquipo()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({ id: equipo.id, ...form })
      toast.success('Equipo actualizado exitosamente')
      onClose()
    } catch (error) {
      toast.error('Error al actualizar el equipo')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Equipo">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Nombre</label>
          <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary transition-all text-sm font-medium" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Identidad Visual</label>
          <div className="flex gap-3">
             <input type="color" value={form.color_principal} onChange={e => setForm({...form, color_principal: e.target.value})} className="w-14 h-14 bg-black/20 border border-white/5 rounded-2xl cursor-pointer p-1.5" />
             <input type="text" value={form.color_principal} onChange={e => setForm({...form, color_principal: e.target.value})} className="flex-1 px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary transition-all text-sm font-mono" />
          </div>
        </div>
        <Button type="submit" loading={updateMutation.isPending} className="w-full h-12 text-sm font-bold">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}

function AddPlayerModal({ open, onClose, plantelId, ligaId }) {
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
      const data = await adminService.searchJugadores(query, ligaId)
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
      const { jugador } = await adminService.createJugador(newPlayerForm)
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
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="DNI, Nombre o Apellido..." className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-medium" />
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
                  <input type="text" required value={newPlayerForm.nombre} onChange={e => setNewPlayerForm({...newPlayerForm, nombre: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-dim uppercase">Apellido</label>
                  <input type="text" required value={newPlayerForm.apellido} onChange={e => setNewPlayerForm({...newPlayerForm, apellido: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm outline-none focus:border-primary" />
                </div>
             </div>
             <div className="space-y-1 mt-3">
                <label className="text-[10px] font-bold text-text-dim uppercase">DNI / ID (Opcional)</label>
                <input type="text" value={newPlayerForm.dni} onChange={e => setNewPlayerForm({...newPlayerForm, dni: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm outline-none focus:border-primary font-mono" />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Número (Dorsal)</label>
              <input type="number" required value={enrollForm.dorsal} onChange={e => setEnrollForm({...enrollForm, dorsal: e.target.value})} placeholder="Ej: 10" className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Posición</label>
              <select value={enrollForm.posicion} onChange={e => setEnrollForm({...enrollForm, posicion: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-medium appearance-none">
                <option value="arquero">Arquero</option>
                <option value="defensor">Defensor</option>
                <option value="mediocampista">Mediocampista</option>
                <option value="delantero">Delantero</option>
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
              <input type="number" required value={enrollForm.dorsal} onChange={e => setEnrollForm({...enrollForm, dorsal: e.target.value})} placeholder="Ej: 10" className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Posición en Campo</label>
              <select value={enrollForm.posicion} onChange={e => setEnrollForm({...enrollForm, posicion: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-medium appearance-none cursor-pointer">
                <option value="arquero">Arquero</option>
                <option value="defensor">Defensor</option>
                <option value="mediocampista">Mediocampista</option>
                <option value="delantero">Delantero</option>
              </select>
            </div>
          </div>

          <Button type="submit" loading={addMutation.isPending} className="w-full h-14 text-sm font-extrabold shadow-xl shadow-primary/20">Finalizar Inscripción</Button>
        </form>
      )}
    </Modal>
  )
}

function InscribeTeamModal({ open, onClose, equipoId, ligaId }) {
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
          <select value={form.temporada_id} onChange={e => setForm({...form, temporada_id: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-medium appearance-none cursor-pointer">
            <option value="">Seleccionar temporada...</option>
            {activeTemporadas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre} ({t.estado})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">Límite Jugadores</label>
          <input type="number" value={form.limite_jugadores} onChange={e => setForm({...form, limite_jugadores: e.target.value})} className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl outline-none focus:border-primary text-sm font-mono" />
        </div>
        <Button type="submit" loading={inscribeMutation.isPending} className="w-full h-12 text-sm font-bold bg-purple-600 hover:bg-purple-700">Confirmar Inscripción</Button>
      </form>
    </Modal>
  )
}
