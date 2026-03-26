export default function FixtureCard({ partido, showScore = false }) {
  const fecha = partido.fecha
    ? new Date(partido.fecha).toLocaleDateString('es-AR', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit'
      })
    : 'Fecha a confirmar'

  return (
    <div className={`fixture-card ${partido.estado === 'finalizado_parcial' ? 'parcial' : ''}`} data-testid="fixture-card">
      <div className="fixture-meta">
        <span className="fecha">{fecha}</span>
        {partido.jornada && <span className="jornada">Fecha {partido.jornada}</span>}
        {partido.estado === 'finalizado_parcial' && (
          <span className="badge-parcial" title="Faltan goleadores">⚠ Parcial</span>
        )}
      </div>
      <div className="equipos-row">
        <span className="equipo local">{partido.equipo_local?.nombre}</span>
        {showScore
          ? <span className="marcador">{partido.goles_local} - {partido.goles_visitante}</span>
          : <span className="vs">vs</span>
        }
        <span className="equipo visitante">{partido.equipo_visitante?.nombre}</span>
      </div>
      {partido.cancha && <span className="cancha">📍 {partido.cancha}</span>}
    </div>
  )
}
