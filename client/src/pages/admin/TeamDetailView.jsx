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
  useDeleteEquipo,
  useUpdatePago
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
  const [showUpdatePayment, setShowUpdatePayment] = useState(false)
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
    <div className="space-y-10 animate-fade-in pb-32">
      {/* Header Sección */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-dim hover:text-primary hover:border-primary/30 transition-all active:scale-90 group"
          >
            <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
          </button>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          <div className="px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] italic">
            Team Intelligence
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] flex items-center justify-center relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/5 transition-transform hover:rotate-3 duration-500"
                style={{ backgroundColor: equipo.color_principal ? `${equipo.color_principal}20` : 'rgba(206, 222, 11, 0.1)' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                <Shield className="w-12 h-12 md:w-16 md:h-16 relative z-10" style={{ color: equipo.color_principal || 'var(--color-primary)' }} />
                <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/5 blur-2xl rounded-full" />
              </div>
              <button 
                onClick={() => setShowEditTeam(true)}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-bg-surface border border-white/10 flex items-center justify-center text-text-dim hover:text-primary shadow-2xl transition-all hover:scale-110 active:scale-95 group/edit"
              >
                <Edit3 className="w-5 h-5 transition-transform group-hover/edit:rotate-12" />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div className="relative inline-block">
                <h1 className="text-4xl md:text-7xl font-heading font-black tracking-tighter uppercase italic leading-[0.9] group">
                  {equipo.nombre.split(' ').map((word, i) => (
                    <span key={i} className={i === 0 ? "text-text-primary" : "text-primary"}>{word} </span>
                  ))}
                </h1>
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-full bg-primary/30 skew-x-[-15deg] hidden md:block" />
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(206,222,11,0.1)]">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                    {viewedInscripcion ? viewedInscripcion.temporada.nombre : 'TEMPORADA NO ASIGNADA'}
                  </span>
                </div>
                <div className="text-xs font-black text-text-dim uppercase tracking-[0.3em] flex items-center gap-2 italic">
                  <Users className="w-4 h-4 text-primary" /> {plantel.length} <span className="text-[10px] opacity-60">Efectivos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            {!latestInscripcion && (
              <Button 
                variant="ghost" 
                className="flex-1 lg:flex-none h-16 px-8 text-danger hover:bg-danger/10 border border-white/5 font-black uppercase italic tracking-tighter"
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
                <Trash2 className="w-5 h-5 mr-3" /> Eliminar Club
              </Button>
            )}
            {!latestInscripcion ? (
              <Button 
                variant="outline" 
                onClick={() => setShowInscribeTeam(true)} 
                className="flex-1 lg:flex-none h-16 px-10 border-secondary text-secondary hover:bg-secondary hover:text-bg-deep font-black uppercase italic tracking-tighter shadow-xl shadow-secondary/10"
              >
                <Calendar className="w-5 h-5 mr-3 stroke-[3]" /> Inscribir en Liga
              </Button>
            ) : (
              <Button 
                variant="primary" 
                onClick={() => setShowAddPlayer(true)} 
                className="flex-1 lg:flex-none h-16 px-12 font-black uppercase italic tracking-tighter shadow-2xl shadow-primary/20 text-lg"
                disabled={viewedInscripcion?.temporada?.estado === 'finalizada'}
              >
                <UserPlus className="w-6 h-6 mr-3 stroke-[4]" /> 
                {viewedInscripcion?.temporada?.estado === 'finalizada' ? 'Registro Cerrado' : 'Fichar Talento'}
              </Button>
            )}
          </div>
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatItem label="Roster" value={plantel.length} subValue={`MAX: ${latestInscripcion?.plantel?.limite_jugadores || '--'}`} icon={Users} color="var(--color-primary)" />
        <StatItem 
          label="Finanzas" 
          value={latestInscripcion?.estado_pago?.toUpperCase() || 'N/A'} 
          subValue={latestInscripcion ? `Debe: $${latestInscripcion.monto_total - latestInscripcion.monto_abonado}` : `Pagado: $${latestInscripcion?.monto_abonado || 0}`} 
          icon={Shield} 
          color={latestInscripcion?.estado_pago === 'pagado' ? 'var(--color-primary)' : '#EF4444'}
          isAlert={latestInscripcion?.estado_pago !== 'pagado' && latestInscripcion}
          action={latestInscripcion && (
            <button 
              onClick={() => setShowUpdatePayment(true)}
              className="mt-2 text-[10px] font-black text-primary hover:text-white uppercase tracking-widest border-b-2 border-primary/30 pb-0.5 transition-colors"
            >
              Actualizar Pago
            </button>
          )}
        />
        <StatItem label="Historia" value={inscripciones?.length || 0} subValue="Temporadas" icon={Calendar} color="var(--color-secondary)" />
      </div>

      {/* Tabs & Content */}
      <div className="space-y-6">
        <div className="flex items-center gap-1 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5 backdrop-blur-sm">
          <TabButton active={activeTab === 'plantel'} onClick={() => setActiveTab('plantel')} label={viewedInscripcion?.id !== latestInscripcion?.id ? `Plantel (${viewedInscripcion?.temporada.nombre})` : 'Plantel Actual'} />
          <TabButton active={activeTab === 'historia'} onClick={() => setActiveTab('historia')} label="Historia" />
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'plantel' ? (
            <div className="space-y-6">
              {/* Desktop View Table */}
              <div className="hidden md:block">
                <GlassCard className="overflow-hidden border-none p-0 ring-1 ring-white/5 shadow-2xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="px-8 py-6 text-[10px] font-black text-text-dim uppercase tracking-[0.3em] italic">Atleta / Identidad</th>
                        <th className="px-8 py-6 text-[10px] font-black text-text-dim uppercase tracking-[0.3em] italic text-center">Nro</th>
                        <th className="px-8 py-6 text-[10px] font-black text-text-dim uppercase tracking-[0.3em] italic">Posición Técnica</th>
                        <th className="px-8 py-6 text-[10px] font-black text-text-dim uppercase tracking-[0.3em] italic">Estado</th>
                        <th className="px-8 py-6 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {plantel.length > 0 ? plantel.map(p => (
                        <tr key={p.id} className="group hover:bg-primary/[0.02] transition-colors relative">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 flex items-center justify-center text-primary font-black text-lg italic shadow-lg group-hover:scale-110 transition-transform">
                                {p.jugador.nombre[0]}{p.jugador.apellido[0]}
                              </div>
                              <div>
                                <p className="text-lg font-black uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">{p.jugador.nombre} {p.jugador.apellido}</p>
                                <p className="text-[10px] text-text-dim font-bold tracking-[0.2em] uppercase mt-1.5 opacity-60">ID: {p.jugador.id.split('-')[0]}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-center">
                              <div className="w-12 h-12 rounded-xl bg-bg-deep border border-white/10 flex items-center justify-center text-primary font-black text-xl italic tracking-tighter shadow-inner group-hover:border-primary/30 transition-colors">
                                {p.dorsal || '--'}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] italic px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-text-secondary group-hover:border-primary/20 transition-colors">
                              {p.posicion || 'NO ASIGNADA'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase italic tracking-widest">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(206,222,11,0.6)]" /> 
                              En Plantilla
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="w-10 h-10 flex items-center justify-center text-text-dim hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-xl transition-all active:scale-90 group/btn">
                              <Trash2 className="w-5 h-5 transition-transform group-hover/btn:rotate-6" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-8 py-32 text-center">
                            <div className="flex flex-col items-center gap-6 animate-pulse">
                              <div className="w-24 h-24 rounded-[2rem] bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center">
                                <Users className="w-10 h-10 text-text-dim opacity-20" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xl font-heading font-black uppercase italic tracking-tighter">Sin Rosters Registrados</p>
                                <p className="text-[10px] text-text-dim font-black uppercase tracking-widest">Comienza a fichar atletas para este club</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </GlassCard>
              </div>


              {/* Mobile View Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {plantel.length > 0 ? plantel.map(p => (
                  <GlassCard key={p.id} className="p-6 border-none ring-1 ring-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-bl-[40px] pointer-events-none" />
                    <div className="flex items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-xl italic shadow-lg">
                          {p.jugador.nombre[0]}{p.jugador.apellido[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xl font-black uppercase italic leading-tight tracking-tighter truncate">
                            {p.jugador.nombre} {p.jugador.apellido}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                             <div className="flex items-center justify-center h-6 px-2 bg-primary text-bg-deep text-[10px] font-black rounded-md italic">
                               #{p.dorsal || '--'}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-text-dim italic">
                               {p.posicion}
                             </span>
                          </div>
                        </div>
                      </div>
                      <button className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-text-dim hover:text-danger hover:border-danger/30 rounded-xl transition-all active:scale-90">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </GlassCard>
                )) : (
                  <div className="py-24 text-center space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-dashed border-white/10 flex items-center justify-center mx-auto opacity-20">
                      <Users className="w-10 h-10" />
                    </div>
                    <p className="text-xs font-black uppercase italic tracking-widest text-text-dim">Sin Jugadores en el Roster</p>
                  </div>
                )}
              </div>
            </div>

          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inscripciones?.map(ins => (
                <GlassCard 
                  key={ins.id} 
                  onClick={() => {
                    setSelectedInscripcionId(ins.id)
                    setActiveTab('plantel')
                  }}
                  className={`flex items-center justify-between group hover:border-primary/30 transition-all p-6 cursor-pointer relative overflow-hidden ${
                    viewedInscripcion?.id === ins.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-white/5'
                  }`}
                >
                  {viewedInscripcion?.id === ins.id && (
                    <div className="absolute top-0 right-0 p-1 bg-primary text-bg-deep rounded-bl-lg">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  )}
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                      viewedInscripcion?.id === ins.id ? 'bg-primary text-bg-deep shadow-lg shadow-primary/20' : 'bg-white/5 text-text-dim'
                    }`}>
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="font-black text-2xl uppercase italic tracking-tighter leading-[1.1]">{ins.temporada.nombre}</p>
                      <p className="text-[10px] text-text-dim uppercase font-black tracking-[0.2em] mt-1.5 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${ins.temporada.estado === 'activa' ? 'bg-success' : 'bg-text-dim'}`} />
                        {ins.temporada.estado}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right pt-1">
                      <p className="text-lg font-black uppercase italic tracking-tighter leading-[1.1]">{ins.plantel.inscripciones.length} JUG.</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${ins.estado_pago === 'pagado' ? 'text-primary' : 'text-danger'}`}>
                        {ins.estado_pago}
                      </p>
                    </div>
                    <ChevronRight className={`w-6 h-6 transition-transform ${
                      viewedInscripcion?.id === ins.id ? 'text-primary translate-x-1' : 'text-text-dim group-hover:translate-x-1'
                    }`} />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditTeamModal open={showEditTeam} onClose={() => setShowEditTeam(false)} equipo={equipo} />
      <AddPlayerModal 
        open={showAddPlayer} 
        onClose={() => setShowAddPlayer(false)} 
        plantelId={viewedInscripcion?.plantel?.id} 
        ligaId={ligaId}
      />
      <InscribeTeamModal open={showInscribeTeam} onClose={() => setShowInscribeTeam(false)} equipoId={equipo.id} ligaId={ligaId} />
      {latestInscripcion && (
        <UpdatePaymentModal 
          open={showUpdatePayment} 
          onClose={() => setShowUpdatePayment(false)} 
          inscripcion={latestInscripcion} 
        />
      )}
    </div>
  )
}

function StatItem({ label, value, subValue, icon: Icon, color, action, isAlert }) {
  return (
    <GlassCard className={`group relative overflow-hidden border-none p-6 ring-1 transition-all hover:ring-2 ${
      isAlert ? 'ring-danger/30 bg-danger/5' : 'ring-white/5 hover:ring-primary/30'
    }`}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.03] to-transparent rounded-bl-[100px]" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-dim flex items-center gap-2">
            <span className="w-1 h-3 bg-primary/50 skew-x-[-15deg]" />
            {label}
          </p>
          <div className="space-y-1 pt-1">
            <p className={`text-4xl font-heading font-black tracking-tighter uppercase italic leading-[1.1] ${isAlert ? 'text-danger' : 'text-text-primary'}`}>
              {value}
            </p>
            {subValue && (
              <p className={`text-[10px] font-black uppercase tracking-widest ${isAlert ? 'text-danger/70' : 'text-text-dim'}`}>
                {subValue}
              </p>
            )}
          </div>
          {action}
        </div>
        
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${
          isAlert ? 'bg-danger/10 border-danger/20' : 'bg-white/5 border-white/10'
        }`}>
          <Icon className="w-7 h-7" style={{ color: isAlert ? '#EF4444' : color }} />
        </div>
      </div>
      
      {/* Watermark Icon */}
      <Icon className="absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.02] group-hover:opacity-[0.04] transition-all duration-700 pointer-events-none group-hover:scale-125" style={{ color }} />
    </GlassCard>
  )
}

function TabButton({ active, onClick, label }) {
  return (
    <button 
      onClick={onClick} 
      className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all relative overflow-hidden group ${
        active 
          ? 'bg-primary text-bg-deep shadow-[0_0_20px_rgba(206,222,11,0.2)] scale-[1.02]' 
          : 'text-text-dim hover:text-text-primary hover:bg-white/5'
      }`}
    >
      <span className="relative z-10 italic">{label}</span>
      {active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
      )}
    </button>
  )
}

function EditTeamModal({ open, onClose, equipo }) {
  const [form, setForm] = useState({ nombre: equipo.nombre, color_principal: equipo.color_principal || '#CEDE0B' })
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
        <Button type="submit" loading={inscribeMutation.isPending} className="w-full h-12 text-sm font-bold bg-secondary hover:bg-secondary-dim">Confirmar Inscripción</Button>
      </form>
    </Modal>
  )
}
function UpdatePaymentModal({ open, onClose, inscripcion }) {
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
            <span className="text-sm font-black tracking-tighter">${inscripcion.monto_total}</span>
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
                className="w-full pl-10 pr-4 py-3.5 bg-bg-elevated border border-border-subtle rounded-xl text-sm focus:border-primary transition-all outline-none font-bold shadow-sm"
              />
            </div>
          </label>

          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-text-dim font-bold uppercase tracking-widest">Restante</span>
            <span className={`text-lg font-black tracking-tighter ${restante <= 0 ? 'text-success' : 'text-warning'}`}>
              ${restante}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={updatePago.isPending} className="flex-1 bg-primary text-secondary font-black uppercase italic tracking-tighter">
            Actualizar Pago
          </Button>
        </div>
      </form>
    </Modal>
  )
}
