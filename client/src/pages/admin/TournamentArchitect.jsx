import { useState, useEffect } from 'react'
import { useLigas, useEquipos, useTemporadas, useTemporadaTree, useCreateTemporada, useCreateFase, useCreateJornadas, useFormatos, useUpdateTemporada, useUpdateFase, useUpdateJornada, useFixtureAdmin, useCreatePartido, useGenerateFixture } from '../../hooks/useAdmin'
import { useToast } from '../../components/ui/Toast'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Trophy, Plus, ChevronRight, ChevronDown, Layers, Calendar, Lock, Pencil, Swords, Zap, Check, X, Shield } from 'lucide-react'

export default function TournamentArchitect() {
  const { data: ligas } = useLigas()
  const liga = ligas?.[0]
  const { data: temporadas, isLoading } = useTemporadas(liga?.id)
  const { data: formatos } = useFormatos()
  const { data: equipos } = useEquipos(liga?.id)
  const [selectedTemp, setSelectedTemp] = useState(null)
  const { data: tree } = useTemporadaTree(selectedTemp)

  const [showNewTemp, setShowNewTemp] = useState(false)
  const [showEditTemp, setShowEditTemp] = useState(false)
  const [showNewFase, setShowNewFase] = useState(false)
  const [showNewJornadas, setShowNewJornadas] = useState(false)
  const [editingFase, setEditingFase] = useState(null)
  const [expandedJornada, setExpandedJornada] = useState(null)
  const [showGenerateFixture, setShowGenerateFixture] = useState(null) // faseId
  const [selectedFase, setSelectedFase] = useState(null)

  const isVault = tree?.estado === 'finalizada'

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Arquitecto de Torneo</h1>
        <Button variant="outline" size="sm" onClick={() => setShowNewTemp(true)}>
          <Plus className="w-4 h-4" /> Nueva Temporada
        </Button>
      </div>

      {/* Temporada selector */}
      {temporadas?.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {temporadas.map(t => (
            <button key={t.id} onClick={() => setSelectedTemp(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition-all ${
                selectedTemp === t.id ? 'bg-primary/10 text-primary border-primary/20' : 'text-text-dim border-border-subtle hover:border-border-default'
              }`}>
              <Trophy className="w-4 h-4" /> {t.nombre} <Badge status={t.estado} />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon={Trophy} title="Sin temporadas" description="Creá tu primera temporada para empezar a organizar." action={<Button size="sm" onClick={() => setShowNewTemp(true)}>Crear Temporada</Button>} />
      )}

      {/* Tree display */}
      {tree && (
        <GlassCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="font-heading font-semibold text-lg">{tree.nombre}</h2>
                <div className="flex items-center gap-2 text-xs text-text-dim">
                  <span>Estado: <Badge status={tree.estado} /></span>
                  {tree.fecha_inicio && <span>• {new Date(tree.fecha_inicio).toLocaleDateString()}</span>}
                  {tree.fecha_fin && <span>al {new Date(tree.fecha_fin).toLocaleDateString()}</span>}
                </div>
              </div>
              
            </div>
            <div className="flex items-center gap-2">
              {!isVault && (
                <Button variant="ghost" size="xs" onClick={() => setShowEditTemp(true)} className="text-text-dim hover:text-primary">
                  Editar
                </Button>
              )}
              {tree.estado === 'borrador' && (
                <Button variant="primary" size="xs" onClick={() => setShowEditTemp(true)} className="bg-primary hover:bg-primary/90 text-secondary font-bold px-4">
                  Abrir Temporada
                </Button>
              )}
              {isVault && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-dim text-danger text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" /> MODO BÓVEDA
                </div>
              )}
            </div>
          </div>

          {/* Fases */}
          {tree.fases?.length > 0 ? tree.fases.map(fase => (
            <div key={fase.id} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-deep/50 mb-3">
                <Layers className="w-4 h-4 text-secondary" />
                <span className="font-medium text-sm">{fase.nombre}</span>
                <span className="text-xs text-text-dim">({fase.tipo?.replace(/_/g, ' ')})</span>
                <span className="text-[10px] text-text-dim ml-1">V:{fase.puntos_victoria} E:{fase.puntos_empate}</span>
                
                <div className="ml-auto flex items-center gap-1">
                  {!isVault && (
                    <>
                      <Button variant="ghost" size="xs" onClick={() => setEditingFase(fase)} className="text-text-dim hover:text-primary">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => setShowGenerateFixture(fase.id)} className="text-primary hover:bg-primary/10 gap-1">
                        <Zap className="w-3 h-3" /> Fixture Auto
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => { setSelectedFase(fase.id); setShowNewJornadas(true) }} className="text-text-dim hover:text-primary gap-1">
                        <Plus className="w-3 h-3" /> Jornadas
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Jornadas */}
              {fase.jornadas?.length > 0 && (
                <div className="ml-4 space-y-2">
                  {fase.jornadas.map(j => (
                    <JornadaRow 
                      key={j.id} 
                      jornada={j} 
                      faseId={fase.id}
                      isExpanded={expandedJornada === j.id}
                      onToggle={() => setExpandedJornada(expandedJornada === j.id ? null : j.id)}
                      isVault={isVault}
                      equipos={equipos}
                      ligaId={liga?.id}
                      currentTemporada={tree}
                    />
                  ))}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-6">
              <p className="text-sm text-text-dim mb-3">Sin fases aún</p>
              {!isVault && <Button variant="outline" size="sm" onClick={() => setShowNewFase(true)}><Plus className="w-3 h-3" /> Crear Fase</Button>}
            </div>
          )}

          {tree.fases?.length > 0 && !isVault && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowNewFase(true)}>
              <Plus className="w-3 h-3" /> Agregar Fase
            </Button>
          )}
        </GlassCard>
      )}

      {/* Modals */}
      <FixtureAutoSelector 
        open={!!showGenerateFixture} 
        onClose={() => setShowGenerateFixture(null)} 
        faseId={showGenerateFixture}
        equipos={equipos}
        ligaId={liga?.id}
        currentTemporada={tree}
      />
      <NewTemporadaModal 
        open={showNewTemp} 
        onClose={() => setShowNewTemp(false)} 
        ligaId={liga?.id} 
        formatos={formatos} 
        defaultTipoFutbol={liga?.tipo_futbol}
      />
      {tree && <EditTemporadaModal open={showEditTemp} onClose={() => setShowEditTemp(false)} temporada={tree} />}
      <NewFaseModal open={showNewFase} onClose={() => setShowNewFase(false)} temporadaId={selectedTemp} />
      {editingFase && <EditFaseModal open={!!editingFase} onClose={() => setEditingFase(null)} fase={editingFase} />}
      <NewJornadasModal open={showNewJornadas} onClose={() => setShowNewJornadas(false)} faseId={selectedFase} />
    </div>
  )
}

// ====================================================
// JORNADA ROW — Expandable with match list + creator
// ====================================================
function JornadaRow({ jornada, faseId, isExpanded, onToggle, isVault, equipos, ligaId, currentTemporada }) {
  const updateJornada = useUpdateJornada()
  const { data: fixtureData } = useFixtureAdmin(isExpanded ? jornada.id : null)
  const partidos = fixtureData?.partidos || []
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(jornada.fecha_tentativa?.split('T')[0] || '')
  const toast = useToast()

  function saveDate() {
    if (!dateValue) return
    updateJornada.mutate({ id: jornada.id, fecha_tentativa: dateValue }, {
      onSuccess: () => { setEditingDate(false); toast.success('Fecha actualizada') },
      onError: () => toast.error('Error al actualizar fecha')
    })
  }

  return (
    <div className={`rounded-xl border transition-all ${isExpanded ? 'border-primary/30 bg-bg-deep/30' : 'border-border-subtle hover:border-border-default'}`}>
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-primary shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-text-dim shrink-0" />}
        <Calendar className="w-3.5 h-3.5 text-text-dim shrink-0" />
        <span className="text-sm font-medium">Fecha {jornada.numero}</span>
        <Badge status={jornada.estado} />
        
        {jornada.fecha_tentativa && !editingDate && (
          <span className="text-[11px] text-text-dim ml-auto">
            {new Date(jornada.fecha_tentativa).toLocaleDateString('es-AR')}
          </span>
        )}
        {!jornada.fecha_tentativa && !editingDate && (
          <span className="text-[10px] text-text-dim/50 ml-auto italic">Sin fecha</span>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Date editor */}
          {!isVault && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              {editingDate ? (
                <div className="flex items-center gap-2 flex-1">
                  <input 
                    type="date" 
                    value={dateValue} 
                    onChange={e => setDateValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-primary"
                  />
                  <Button size="xs" onClick={saveDate} loading={updateJornada.isPending}><Check className="w-3 h-3" /></Button>
                  <Button size="xs" variant="ghost" onClick={() => setEditingDate(false)}><X className="w-3 h-3" /></Button>
                </div>
              ) : (
                <button onClick={() => setEditingDate(true)} className="text-xs text-primary hover:underline">
                  {jornada.fecha_tentativa ? 'Cambiar fecha' : 'Asignar fecha'}
                </button>
              )}
            </div>
          )}

          {/* Match list */}
          {partidos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Partidos ({partidos.length})</p>
              {partidos.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border-subtle">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.equipo_local?.color_principal || 'var(--color-primary)' }} />
                    <span className="text-sm font-medium">{p.equipo_local?.nombre}</span>
                    <span className="text-xs text-text-dim font-bold">vs</span>
                    <span className="text-sm font-medium">{p.equipo_visitante?.nombre}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.equipo_visitante?.color_principal || 'var(--color-secondary)' }} />
                  </div>
                  <Badge status={p.estado} />
                  {p.cancha && <span className="text-[10px] text-text-dim">📍 {p.cancha}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-dim text-center py-2 italic">Sin partidos en esta jornada.</p>
          )}

          {/* Manual match creator */}
          {!isVault && <MatchCreator jornadaId={jornada.id} equipos={equipos || []} />}
        </div>
      )}
    </div>
  )
}

// ====================================================
// MATCH CREATOR — Inline manual match creation
// ====================================================
function MatchCreator({ jornadaId, equipos }) {
  const [localId, setLocalId] = useState('')
  const [visitanteId, setVisitanteId] = useState('')
  const [cancha, setCancha] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const createPartido = useCreatePartido()
  const toast = useToast()

  function handleCreate(e) {
    e.preventDefault()
    if (!localId || !visitanteId) return toast.error('Seleccioná ambos equipos')
    if (localId === visitanteId) return toast.error('Los equipos deben ser distintos')

    createPartido.mutate({
      jornada_id: jornadaId,
      equipo_local_id: localId,
      equipo_visitante_id: visitanteId,
      ...(cancha && { cancha }),
      ...(fechaHora && { fecha_hora: fechaHora })
    }, {
      onSuccess: () => {
        toast.success('Partido creado')
        setLocalId(''); setVisitanteId(''); setCancha(''); setFechaHora('')
      },
      onError: (err) => toast.error(err.message || 'Error al crear partido')
    })
  }

  return (
    <form onSubmit={handleCreate} className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
      <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
        <Swords className="w-3 h-3" /> Crear Partido Manual
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-text-dim font-medium block mb-1">Equipo Local</label>
          <select value={localId} onChange={e => setLocalId(e.target.value)}
            className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-primary appearance-none">
            <option value="">Seleccionar...</option>
            {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-text-dim font-medium block mb-1">Equipo Visitante</label>
          <select value={visitanteId} onChange={e => setVisitanteId(e.target.value)}
            className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-primary appearance-none">
            <option value="">Seleccionar...</option>
            {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-text-dim font-medium block mb-1">Cancha (opcional)</label>
          <input type="text" value={cancha} onChange={e => setCancha(e.target.value)} placeholder="Ej: Cancha 1"
            className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-[10px] text-text-dim font-medium block mb-1">Fecha y hora (opcional)</label>
          <input type="datetime-local" value={fechaHora} onChange={e => setFechaHora(e.target.value)}
            className="w-full px-3 py-2 bg-bg-input border border-border-default rounded-lg text-sm outline-none focus:border-primary" />
        </div>
      </div>
      <Button type="submit" size="sm" loading={createPartido.isPending} className="w-full">
        <Plus className="w-3.5 h-3.5" /> Agregar Partido
      </Button>
    </form>
  )
}

// ====================================================
// GENERATE FIXTURE MODAL — Team checklist + confirmation
// ====================================================
function TeamInscriptionsBadge({ teamId, temporadaId, required }) {
  const { data: seasons } = useInscripcionesEquipo(null, teamId)
  const plantel = seasons?.find(s => s.temporada_id === temporadaId)
  const activos = plantel?.plantel?.inscripciones?.filter(i => i.estado === 'activo')?.length || 0

  return (
    <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight uppercase ${
      activos >= required ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning animate-pulse'
    }`}>
      {activos}/{required} JUG.
    </div>
  )
}

function FixtureAutoSelector({ open, onClose, faseId, equipos, ligaId, currentTemporada }) {
  const [selectedTeams, setSelectedTeams] = useState([])
  const [confirming, setConfirming] = useState(false)
  const generateFixture = useGenerateFixture()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setSelectedTeams(equipos?.map(e => e.id) || [])
      setConfirming(false)
    }
  }, [open, equipos])

  function toggleTeam(id) {
    setSelectedTeams(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function handleGenerate() {
    if (selectedTeams.length < 2) return toast.error('Seleccioná al menos 2 equipos')
    setConfirming(true)
  }

  function confirmGenerate() {
    generateFixture.mutate({ faseId, equipoIds: selectedTeams }, {
      onSuccess: (data) => {
        toast.success(data.message || 'Fixture generado exitosamente')
        onClose()
      },
      onError: (err) => {
        toast.error(err.message || 'Error al generar fixture')
        setConfirming(false)
      }
    })
  }

  const n = selectedTeams.length
  const roundsNeeded = n % 2 === 0 ? n - 1 : n
  const matchesPerRound = Math.floor(n / 2)

  const modalidadReq = currentTemporada?.liga?.tipo_futbol 
    ? parseInt(currentTemporada.liga.tipo_futbol.replace(/\D/g, '')) 
    : 11;

  return (
    <Modal open={open} onClose={onClose} title="Generar Fixture Automático" size="md">
      {!confirming ? (
        <div className="space-y-5 animate-fade-in">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-text-dim mb-1">Algoritmo: <span className="text-primary font-bold">Round Robin</span></p>
            <p className="text-xs text-text-dim">
              {n} equipos → {roundsNeeded} jornadas, {matchesPerRound} partidos por jornada, {roundsNeeded * matchesPerRound} partidos totales.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">Equipos que participan ({selectedTeams?.length || 0}/{equipos?.length || 0})</p>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 flex flex-col items-center justify-center">
              {!equipos ? (
                 <div className="py-10 text-[10px] text-text-dim italic">Cargando equipos...</div>
              ) : equipos.length === 0 ? (
                 <div className="py-10 text-[10px] text-text-dim italic text-center">No hay equipos creados.<br/>Crea equipos en la sección de gestión antes de generar el fixture.</div>
              ) : (
                equipos.map(eq => {
                  const isSelected = selectedTeams.includes(eq.id)
                  return (
                    <button key={eq.id} onClick={() => toggleTeam(eq.id)} type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-primary/5 border-primary/30 text-text-primary' 
                          : 'bg-bg-surface border-border-subtle text-text-dim opacity-60'
                      }`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? 'bg-primary border-primary' : 'border-border-default'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-bg-deep" />}
                      </div>
                      <Shield className="w-4 h-4 shrink-0" style={{ color: eq.color_principal || 'var(--color-primary)' }} />
                      <span className="text-sm font-medium">{eq.nombre}</span>
                      <TeamInscriptionsBadge teamId={eq.id} temporadaId={currentTemporada?.id} required={modalidadReq} />
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full gap-2" disabled={selectedTeams.length < 2}>
            <Zap className="w-4 h-4" /> Generar Fixture ({selectedTeams.length} equipos)
          </Button>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-text-primary mb-1 text-warning">¡Atención! Advertencia de Planteles</h3>
            <p className="text-sm text-text-dim">
              Estás por generar un fixture para <span className="font-bold">{n} equipos</span>. 
              Asegúrate de que todos tengan sus <span className="text-primary font-bold">jugadores activos</span> inscritos para que puedan registrar goles y tarjetas durante los partidos.
            </p>
            <p className="mt-2 text-xs text-warning/80 bg-warning/5 p-2 rounded-lg border border-warning/10 italic">
              * Nota: Se recomienda un mínimo de {currentTemporada?.modalidad || 5} jugadores por equipo para {currentTemporada?.modalidad === 5 ? 'Fútbol 5' : `Fútbol ${currentTemporada?.modalidad}`}.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setConfirming(false)} className="flex-1">Cancelar</Button>
            <Button onClick={confirmGenerate} loading={generateFixture.isPending} className="flex-1 bg-warning hover:bg-warning/90 text-bg-deep font-bold">
              Sí, Regenerar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ====================================================
// EXISTING MODALS (preserved, minor updates)
// ====================================================
function NewTemporadaModal({ open, onClose, ligaId, formatos, defaultTipoFutbol }) {
  const [form, setForm] = useState({ nombre: '', formato_tipo: '', fecha_inicio: '', fecha_fin: '' })
  
  const mutation = useCreateTemporada()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    let payload = { ...form, liga_id: ligaId }
    if (!payload.formato_tipo && formatos?.length > 0) {
      payload.formato_tipo = formatos[0].tipo
    }
    await mutation.mutateAsync(payload)
    onClose()
    setForm({ nombre: '', formato_tipo: '', fecha_inicio: '', fecha_fin: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Temporada">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Nombre de Temporada
          <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Apertura 2025" required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Formato de Competencia
            <select value={form.formato_tipo} onChange={set('formato_tipo')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
              <option value="" disabled>Seleccionar...</option>
              {formatos?.map(f => (
                <option key={f.id} value={f.tipo}>{f.nombre}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-dim">Modalidad (Fija)</span>
            <div className="mt-1.5 px-3 py-2.5 bg-bg-surface/50 border border-border-subtle rounded-xl text-sm text-text-dim flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Fútbol {defaultTipoFutbol?.replace(/\D/g, '') || '—'}
            </div>
            <p className="text-[10px] text-text-dim mt-1 px-1">Definida por la Liga</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Fecha Inicio
            <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Fecha Fin (Est.)
            <input type="date" value={form.fecha_fin} onChange={set('fecha_fin')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
        </div>
        <Button type="submit" loading={mutation.isPending} className="w-full mt-2">Crear Temporada</Button>
      </form>
    </Modal>
  )
}

function EditTemporadaModal({ open, onClose, temporada }) {
  const [form, setForm] = useState({ 
    nombre: '', fecha_inicio: '', fecha_fin: '', estado: 'borrador'
  })
  
  useEffect(() => {
    if (open && temporada) {
      setForm({
        nombre: temporada.nombre,
        fecha_inicio: temporada.fecha_inicio?.split('T')[0] || '',
        fecha_fin: temporada.fecha_fin?.split('T')[0] || '',
        estado: temporada.estado || 'borrador'
      })
    }
  }, [open, temporada])

  const mutation = useUpdateTemporada()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ id: temporada.id, ...form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Temporada">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Nombre de Temporada
          <input type="text" value={form.nombre} onChange={set('nombre')} required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Fecha Inicio
            <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Estado de Temporada
            <select value={form.estado} onChange={set('estado')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none font-bold">
              <option value="borrador">Borrador</option>
              <option value="activa">Activa / En Curso</option>
              <option value="finalizada">Finalizada</option>
            </select>
          </label>
          <label className="text-xs font-medium text-text-dim">
            Modalidad
            <select value={form.modalidad} onChange={set('modalidad')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none font-bold">
              <option value={5}>Fútbol 5</option>
              <option value={7}>Fútbol 7</option>
              <option value={8}>Fútbol 8</option>
              <option value={9}>Fútbol 9</option>
              <option value={11}>Fútbol 11</option>
            </select>
          </label>
        </div>
        <p className="text-[10px] text-text-dim italic">* La fecha de finalización puede modificarse en cualquier momento antes de finalizar la temporada.</p>
        <Button type="submit" loading={mutation.isPending} className="w-full mt-2">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}

function NewFaseModal({ open, onClose, temporadaId }) {
  const [form, setForm] = useState({ nombre: '', tipo: 'todos_contra_todos', puntos_victoria: 3, puntos_empate: 1, ida_y_vuelta: false })
  const mutation = useCreateFase()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ temporada_id: temporadaId, ...form })
    onClose()
    setForm({ nombre: '', tipo: 'todos_contra_todos', puntos_victoria: 3, puntos_empate: 1, ida_y_vuelta: false })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Fase">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Fase Regular" required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <select value={form.tipo} onChange={set('tipo')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
          <option value="todos_contra_todos">Todos contra todos</option>
          <option value="eliminacion_directa">Eliminación directa</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Pts. Victoria
            <input type="number" value={form.puntos_victoria} onChange={set('puntos_victoria')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Pts. Empate
            <input type="number" value={form.puntos_empate} onChange={set('puntos_empate')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-text-dim cursor-pointer">
          <input type="checkbox" checked={form.ida_y_vuelta} onChange={e => setForm(f => ({ ...f, ida_y_vuelta: e.target.checked }))}
            className="rounded border-border-default accent-primary" />
          Ida y vuelta (doble rueda)
        </label>
        <Button type="submit" loading={mutation.isPending} className="w-full">Crear Fase</Button>
      </form>
    </Modal>
  )
}

function EditFaseModal({ open, onClose, fase }) {
  const [form, setForm] = useState({
    nombre: fase.nombre,
    tipo: fase.tipo,
    puntos_victoria: fase.puntos_victoria,
    puntos_empate: fase.puntos_empate,
    ida_y_vuelta: fase.ida_y_vuelta
  })
  const mutation = useUpdateFase()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ id: fase.id, ...form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Fase">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <select value={form.tipo} onChange={set('tipo')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none">
          <option value="todos_contra_todos">Todos contra todos</option>
          <option value="eliminacion_directa">Eliminación directa</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Pts. Victoria
            <input type="number" value={form.puntos_victoria} onChange={set('puntos_victoria')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Pts. Empate
            <input type="number" value={form.puntos_empate} onChange={set('puntos_empate')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-text-dim cursor-pointer">
          <input type="checkbox" checked={form.ida_y_vuelta} onChange={e => setForm(f => ({ ...f, ida_y_vuelta: e.target.checked }))}
            className="rounded border-border-default accent-primary" />
          Ida y vuelta (doble rueda)
        </label>
        <Button type="submit" loading={mutation.isPending} className="w-full">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}

function NewJornadasModal({ open, onClose, faseId }) {
  const [cantidad, setCantidad] = useState(5)
  const mutation = useCreateJornadas()

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ fase_id: faseId, cantidad: Number(cantidad) })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Generar Jornadas">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min={1} max={50} required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <p className="text-xs text-text-dim">Se crearán {cantidad} jornadas automáticamente.</p>
        <Button type="submit" loading={mutation.isPending} className="w-full">Generar</Button>
      </form>
    </Modal>
  )
}
