import { useState } from 'react'
import { useAdminLiga, useAdminTemporada, useAdminPartidos, useCargarResultado } from '../../hooks/useAdminData'

export default function GestionResultados() {
  const { data: adminLiga } = useAdminLiga()
  const ligaId = adminLiga?.liga_id
  const { data: temporada } = useAdminTemporada(ligaId)
  const { data: programados = [], isLoading: loadProg } = useAdminPartidos(temporada?.id, 'programado')
  const { data: parciales = [], isLoading: loadParc } = useAdminPartidos(temporada?.id, 'finalizado_parcial')

  if (!temporada) return <p className="empty-msg">No hay temporada activa.</p>
  if (loadProg || loadParc) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="gestion-section" data-testid="gestion-resultados">
      {parciales.length > 0 && (
        <>
          <h2>⚠️ Resultados parciales (faltan goleadores)</h2>
          <p className="hint">Estos partidos tienen resultado pero no se registraron los goleadores.</p>
          {parciales.map(p => (
            <FormResultado key={p.id} partido={p} isParcial />
          ))}
        </>
      )}

      <h2>Cargar resultados</h2>
      {programados.length === 0
        ? <p className="empty-msg">No hay partidos pendientes de resultado.</p>
        : programados.map(partido => (
            <FormResultado key={partido.id} partido={partido} />
          ))
      }
    </div>
  )
}

function FormResultado({ partido, isParcial = false }) {
  const [gl, setGl] = useState(isParcial ? String(partido.goles_local ?? '') : '')
  const [gv, setGv] = useState(isParcial ? String(partido.goles_visitante ?? '') : '')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const cargar = useCargarResultado()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    cargar.mutate({
      id: partido.id,
      goles_local: parseInt(gl),
      goles_visitante: parseInt(gv),
    }, {
      onSuccess: () => setSuccess(true),
      onError: (err) => setError(err.message)
    })
  }

  return (
    <div className={`resultado-form-wrap ${isParcial ? 'parcial' : ''}`} data-testid="form-resultado">
      <p className="match-title">
        <strong>{partido.equipo_local?.nombre}</strong>
        {' vs '}
        <strong>{partido.equipo_visitante?.nombre}</strong>
        {partido.jornada && ` — Fecha ${partido.jornada}`}
        {partido.fecha && ` — ${new Date(partido.fecha).toLocaleDateString('es-AR')}`}
      </p>
      {isParcial && (
        <span className="badge-parcial">⚠ Goleadores pendientes</span>
      )}
      <form onSubmit={handleSubmit} className="resultado-form">
        <input
          type="number" min="0" max="30"
          value={gl}
          onChange={(e) => setGl(e.target.value)}
          placeholder="Local"
          required
          disabled={isParcial}
          data-testid={`gl-${partido.id}`}
        />
        <span className="separator">-</span>
        <input
          type="number" min="0" max="30"
          value={gv}
          onChange={(e) => setGv(e.target.value)}
          placeholder="Visitante"
          required
          disabled={isParcial}
          data-testid={`gv-${partido.id}`}
        />
        {!isParcial && (
          <button type="submit" disabled={cargar.isPending}>
            {cargar.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </form>
      {success && <p className="success-msg">✅ Resultado guardado</p>}
      {error && <p role="alert" className="error-msg">{error}</p>}
    </div>
  )
}
