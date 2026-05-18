import { useState, useEffect } from 'react'
import { useGenerateFixture, useGenerateKnockout } from '../../../hooks/useAdmin'
import { useToast } from '../../../components/ui/Toast'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { Shield, Zap, Check } from 'lucide-react'

function TeamInscriptionsBadge({ activos, required }) {
  return (
    <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-normal uppercase ${
      activos >= required ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning animate-pulse'
    }`}>
      {activos}/{required} JUG.
    </div>
  )
}

export default function FixtureAutoSelector({ open, onClose, fase, equipos, ligaId, currentTemporada }) {
  const [selectedTeams, setSelectedTeams] = useState([])
  const [confirming, setConfirming] = useState(false)
  const [resultData, setResultData] = useState(null)
  const generateFixture = useGenerateFixture()
  const generateKnockout = useGenerateKnockout()
  const toast = useToast()

  const faseId = fase?.id
  const idaYVuelta = fase?.ida_y_vuelta || false
  const isKnockout = fase?.tipo === 'eliminacion_directa'

  useEffect(() => {
    if (open) {
      setSelectedTeams(equipos?.map(e => e.id) || [])
      setConfirming(false)
      setResultData(null)
    }
  }, [open, equipos])

  function toggleTeam(id) {
    setSelectedTeams(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  function handleGenerate() {
    if (selectedTeams.length < 2) return toast.error('Seleccioná al menos 2 equipos')
    setConfirming(true)
  }

  function confirmGenerate() {
    const mutation = isKnockout ? generateKnockout : generateFixture
    mutation.mutate({ faseId, equipoIds: selectedTeams }, {
      onSuccess: (data) => {
        toast.success(data.message || 'Fixture generado exitosamente')
        if (data.warnings?.length > 0 || data.bracket) {
          setResultData(data)
        } else {
          onClose()
        }
      },
      onError: (err) => {
        toast.error(err.message || 'Error al generar fixture')
        setConfirming(false)
      }
    })
  }

  const n = selectedTeams.length

  // Knockout stats
  const nextPow2 = (v) => { let p = 1; while (p < v) p *= 2; return p }
  const bracketSize = isKnockout ? nextPow2(n) : 0
  const byeCount = isKnockout ? bracketSize - n : 0
  const knockoutRounds = isKnockout ? Math.log2(bracketSize) : 0
  const ROUND_MAP = { 32:'16avos', 16:'8vos', 8:'4tos', 4:'Semis', 2:'Final' }
  const knockoutRoundNames = (() => {
    if (!isKnockout) return []
    const names = []; let c = bracketSize
    while (c >= 2) { names.push(ROUND_MAP[c] || `Ronda de ${c}`); c /= 2 }
    return names
  })()

  // Round-robin stats
  const roundsPerLeg = n % 2 === 0 ? n - 1 : n
  const totalRoundsRR = idaYVuelta ? roundsPerLeg * 2 : roundsPerLeg
  const matchesPerRound = Math.floor(n / 2)
  const totalMatchesRR = totalRoundsRR * matchesPerRound

  const totalRounds = isKnockout ? (idaYVuelta ? knockoutRounds * 2 : knockoutRounds) : totalRoundsRR
  const existingJornadas = fase?.jornadas?.length || 0
  const jornadasAutoCreate = Math.max(0, totalRounds - existingJornadas)

  const modalidadReq = currentTemporada?.modalidad || (currentTemporada?.liga?.tipo_futbol 
    ? parseInt(currentTemporada.liga.tipo_futbol.replace(/\D/g, '')) : 11)

  // Post-generation result view
  if (resultData) {
    return (
      <Modal open={open} onClose={onClose} title={isKnockout ? "Bracket Generado" : "Fixture Generado"} size="md">
        <div className="space-y-5 animate-fade-in text-center">
          <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-success" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-success mb-1">{isKnockout ? '¡Bracket Generado!' : '¡Fixture Generado!'}</h3>
            <p className="text-sm text-text-dim">{resultData.message}</p>
            {resultData.rondas_nombres && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {resultData.rondas_nombres.map((name, i) => (
                  <span key={i} className="text-[9px] font-black bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 uppercase tracking-widest">
                    {name}
                  </span>
                ))}
              </div>
            )}
            {resultData.jornadas_autocreadas > 0 && (
              <p className="mt-2 text-xs text-secondary bg-secondary/5 p-2 rounded-lg border border-secondary/10">
                Se crearon automáticamente <span className="font-bold">{resultData.jornadas_autocreadas}</span> jornadas adicionales.
              </p>
            )}
          </div>
          {resultData.warnings?.length > 0 && (
            <div className="text-left space-y-1.5 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <p className="text-[10px] font-black text-warning uppercase tracking-widest">Advertencias del Motor</p>
              {resultData.warnings.map((w, i) => (
                <p key={i} className="text-xs text-text-dim pl-3 border-l-2 border-warning/30">{w}</p>
              ))}
            </div>
          )}
          <Button onClick={onClose} className="w-full bg-success hover:bg-success/90 text-bg-deep font-bold">Cerrar</Button>
        </div>
      </Modal>
    )
  }

  const isPending = isKnockout ? generateKnockout.isPending : generateFixture.isPending

  return (
    <Modal open={open} onClose={onClose} title={isKnockout ? "Generar Bracket de Eliminación" : "Generar Fixture Automático"} size="md">
      {!confirming ? (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <p className="text-xs font-black text-primary uppercase tracking-widest">{isKnockout ? 'Motor Eliminación Directa' : 'Motor de Fixture'}</p>
            </div>
            {isKnockout ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-bg-deep/50 border border-white/5">
                    <p className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-0.5">Equipos</p>
                    <p className="text-lg font-black text-text-primary leading-none">{n}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-bg-deep/50 border border-white/5">
                    <p className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-0.5">Cuadro</p>
                    <p className="text-lg font-black text-text-primary leading-none">{bracketSize}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-bg-deep/50 border border-white/5">
                    <p className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-0.5">Rondas</p>
                    <p className="text-lg font-black text-text-primary leading-none">{knockoutRounds}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {knockoutRoundNames.map((name, i) => (
                    <span key={i} className="text-[9px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 uppercase tracking-widest">{name}</span>
                  ))}
                </div>
                {byeCount > 0 && (
                  <span className="inline-block text-[9px] font-black text-warning bg-warning/10 px-2 py-1 rounded-md border border-warning/20 uppercase tracking-widest">
                    {byeCount} BYEs — los mejor rankeados avanzan directo
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {[{l:'Equipos',v:n},{l:'Jornadas',v:totalRoundsRR},{l:'Part/Jornada',v:matchesPerRound},{l:'Total',v:totalMatchesRR}].map(s=>(
                    <div key={s.l} className="p-2.5 rounded-xl bg-bg-deep/50 border border-white/5">
                      <p className="text-[9px] text-text-dim uppercase font-bold tracking-wider mb-0.5">{s.l}</p>
                      <p className="text-lg font-black text-text-primary leading-none">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {idaYVuelta && <span className="text-[9px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 uppercase tracking-widest">Ida y Vuelta</span>}
                  {n % 2 !== 0 && <span className="text-[9px] font-black text-warning bg-warning/10 px-2 py-1 rounded-md border border-warning/20 uppercase tracking-widest">{n} impares — rotación descanso</span>}
                </div>
              </>
            )}
            {jornadasAutoCreate > 0 && (
              <span className="inline-block text-[9px] font-black text-secondary bg-secondary/10 px-2 py-1 rounded-md border border-secondary/20 uppercase tracking-widest">+{jornadasAutoCreate} jornadas automáticas</span>
            )}
          </div>

          {/* Team Selector */}
          <div>
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">Equipos que participan ({selectedTeams?.length || 0}/{equipos?.length || 0})</p>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 flex flex-col">
              {!equipos ? (
                <div className="py-10 text-[10px] text-text-dim italic">Cargando equipos...</div>
              ) : equipos.length === 0 ? (
                <div className="py-10 text-[10px] text-text-dim italic text-center">No hay equipos inscritos en esta temporada.<br/>Inscribe equipos en la sección de Roster antes de generar el fixture.</div>
              ) : (
                equipos.map(eq => {
                  const isSelected = selectedTeams.includes(eq.id)
                  return (
                    <button key={eq.id} onClick={() => toggleTeam(eq.id)} type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${isSelected ? 'bg-primary/5 border-primary/30 text-text-primary' : 'bg-bg-surface border-border-subtle text-text-dim opacity-60'}`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-primary border-primary' : 'border-border-default'}`}>
                        {isSelected && <Check className="w-3 h-3 text-bg-deep" />}
                      </div>
                      <Shield className="w-4 h-4 shrink-0" style={{ color: eq.color_principal || 'var(--color-primary)' }} />
                      <span className="text-sm font-medium">{eq.nombre}</span>
                      <TeamInscriptionsBadge 
                        activos={eq.jugadores_activos || 0} 
                        required={modalidadReq} 
                      />
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full gap-2 h-14 bg-primary text-bg-deep font-black uppercase italic tracking-wide shadow-2xl shadow-primary/20" disabled={selectedTeams.length < 2}>
            <Zap className="w-5 h-5" /> {isKnockout ? 'Generar Bracket' : 'Generar Fixture'} ({selectedTeams.length} equipos)
          </Button>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-warning" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-warning mb-1">Confirmar Generación</h3>
            <p className="text-sm text-text-dim">
              {isKnockout
                ? <>Se generará un <span className="font-bold text-text-primary">bracket de eliminación directa</span> para <span className="font-bold text-text-primary">{n} equipos</span> con <span className="font-bold text-text-primary">{knockoutRounds} rondas</span> ({knockoutRoundNames.join(' → ')}).{byeCount > 0 && <><br/><span className="text-warning font-bold">{byeCount} equipos pasarán con BYE</span> en la primera ronda.</>}</>
                : <>Se generará un fixture de <span className="font-bold text-text-primary">{totalMatchesRR} partidos</span> en <span className="font-bold text-text-primary">{totalRoundsRR} jornadas</span> para <span className="font-bold text-text-primary">{n} equipos</span>.{idaYVuelta && <><br/><span className="text-secondary font-bold">Formato ida y vuelta</span> — la segunda rueda invierte la localía.</>}</>
              }
            </p>
            <p className="mt-2 text-xs text-warning/80 bg-warning/5 p-2 rounded-lg border border-warning/10 italic">⚠ Si ya existían partidos en las jornadas de esta fase, serán eliminados y reemplazados.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setConfirming(false)} className="flex-1 h-12 font-bold">Cancelar</Button>
            <Button onClick={confirmGenerate} loading={isPending} className="flex-1 h-12 bg-warning hover:bg-warning/90 text-bg-deep font-black uppercase italic tracking-wide">
              Sí, Generar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
