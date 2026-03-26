import { useParams } from 'react-router-dom'
import { useLiga, useTemporadaActiva, useTablaPosc, usePartidos, useGoleadores } from '../../hooks/useLiga'
import TablaPosc from '../../components/TablaPosc'
import FixtureCard from '../../components/FixtureCard'
import Goleadores from '../../components/Goleadores'

export default function LigaPage() {
  const { slug } = useParams()
  const { data: liga, isLoading, isError } = useLiga(slug)
  const { data: temporada } = useTemporadaActiva(liga?.id)

  if (isLoading) return <div className="loading"><div className="spinner" /><p>Cargando liga...</p></div>
  if (isError || !liga) return <div className="error-page"><h2>Liga no encontrada</h2><a href="/">← Volver al inicio</a></div>

  const copiarLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Link copiado al portapapeles')
  }

  return (
    <div className="liga-page">
      <header className="liga-header">
        <a href="/" className="back-link">← Volver</a>
        <div className="liga-info-header">
          {liga.logo_url && <img src={liga.logo_url} alt={liga.nombre} className="liga-logo" />}
          <div>
            <h1>{liga.nombre}</h1>
            {liga.zona && <p className="zona">📍 {liga.zona}</p>}
            {temporada && <p className="temporada">🏆 {temporada.nombre}</p>}
          </div>
        </div>
        <button onClick={copiarLink} className="btn-compartir">
          Compartir liga
        </button>
      </header>

      {!temporada ? (
        <div className="empty-state">
          <p className="empty-msg">Esta liga no tiene temporada activa.</p>
        </div>
      ) : (
        <LigaSecciones temporadaId={temporada.id} />
      )}
    </div>
  )
}

function LigaSecciones({ temporadaId }) {
  const { data: tabla = [] } = useTablaPosc(temporadaId)
  const { data: proximos = [] } = usePartidos(temporadaId, 'programado')
  const { data: jugados = [] } = usePartidos(temporadaId, 'finalizado')
  const { data: parciales = [] } = usePartidos(temporadaId, 'finalizado_parcial')
  const { data: goleadores = [] } = useGoleadores(temporadaId)

  const todosResultados = [...jugados, ...parciales].sort((a, b) =>
    new Date(b.fecha) - new Date(a.fecha)
  )

  // Agrupar próximos por jornada
  const jornadasProximas = proximos.reduce((acc, p) => {
    const j = p.jornada || 'Sin jornada'
    if (!acc[j]) acc[j] = []
    acc[j].push(p)
    return acc
  }, {})

  return (
    <div className="liga-secciones">
      <section className="seccion">
        <h2>📊 Tabla de posiciones</h2>
        <TablaPosc data={tabla} />
      </section>

      <section className="seccion">
        <h2>📅 Próximos partidos</h2>
        {proximos.length === 0
          ? <p className="empty-msg">No hay partidos programados.</p>
          : Object.entries(jornadasProximas).map(([jornada, partidos]) => (
              <div key={jornada} className="jornada-group">
                <h3 className="jornada-title">Fecha {jornada}</h3>
                {partidos.map(p => <FixtureCard key={p.id} partido={p} />)}
              </div>
            ))
        }
      </section>

      <section className="seccion">
        <h2>✅ Últimos resultados</h2>
        {todosResultados.length === 0
          ? <p className="empty-msg">No hay partidos jugados aún.</p>
          : todosResultados.slice(0, 10).map(p =>
              <FixtureCard key={p.id} partido={p} showScore />
            )
        }
      </section>

      <section className="seccion">
        <h2>⚽ Goleadores</h2>
        <Goleadores data={goleadores} />
      </section>
    </div>
  )
}
