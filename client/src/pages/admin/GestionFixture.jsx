import { useState } from 'react'
import { useAdminLiga, useAdminEquipos, useAdminTemporada, useAdminPartidos, useCrearPartido } from '../../hooks/useAdminData'

export default function GestionFixture() {
  const { data: adminLiga } = useAdminLiga()
  const ligaId = adminLiga?.liga_id

  const { data: temporada } = useAdminTemporada(ligaId)
  const { data: equipos = [] } = useAdminEquipos(ligaId)
  const { data: partidos = [] } = useAdminPartidos(temporada?.id, 'programado')
  const crearPartido = useCrearPartido()

  const [form, setForm] = useState({
    equipo_local: '', equipo_visitante: '', fecha: '', cancha: '', jornada: ''
  })
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    if (form.equipo_local === form.equipo_visitante) {
      setError('Los equipos deben ser distintos')
      return
    }
    crearPartido.mutate({
      ...form,
      temporada_id: temporada.id,
      fecha: form.fecha || null,
      jornada: form.jornada ? parseInt(form.jornada) : null
    }, {
      onSuccess: () => setForm({ equipo_local: '', equipo_visitante: '', fecha: '', cancha: '', jornada: '' }),
      onError: (err) => setError(err.message)
    })
  }

  if (!temporada) return <p className="empty-msg">No hay temporada activa.</p>

  // Agrupar por jornada
  const porJornada = partidos.reduce((acc, p) => {
    const j = p.jornada || 'Sin jornada'
    if (!acc[j]) acc[j] = []
    acc[j].push(p)
    return acc
  }, {})

  return (
    <div className="gestion-section" data-testid="gestion-fixture">
      <h2>Fixture — {temporada.nombre}</h2>

      <form onSubmit={handleSubmit} className="fixture-form" data-testid="form-fixture">
        <div className="form-row">
          <select
            value={form.equipo_local}
            onChange={(e) => setForm(f => ({ ...f, equipo_local: e.target.value }))}
            required
            data-testid="select-local"
          >
            <option value="">Equipo local</option>
            {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
          </select>

          <span className="vs-label">vs</span>

          <select
            value={form.equipo_visitante}
            onChange={(e) => setForm(f => ({ ...f, equipo_visitante: e.target.value }))}
            required
            data-testid="select-visitante"
          >
            <option value="">Equipo visitante</option>
            {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
          </select>
        </div>

        <div className="form-row">
          <input
            type="number"
            min="1"
            max="99"
            placeholder="Jornada (Fecha #)"
            value={form.jornada}
            onChange={(e) => setForm(f => ({ ...f, jornada: e.target.value }))}
            data-testid="input-jornada"
          />

          <input
            type="datetime-local"
            value={form.fecha}
            onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))}
            data-testid="input-fecha"
          />

          <input
            type="text"
            placeholder="Cancha (opcional)"
            value={form.cancha}
            onChange={(e) => setForm(f => ({ ...f, cancha: e.target.value }))}
            maxLength={100}
            data-testid="input-cancha"
          />
        </div>

        <button type="submit" disabled={crearPartido.isPending}>
          {crearPartido.isPending ? 'Guardando...' : '+ Agregar partido'}
        </button>
      </form>

      {error && <p role="alert" className="error-msg">{error}</p>}

      <div className="partidos-list">
        <h3>Programados</h3>
        {partidos.length === 0
          ? <p className="empty-msg">No hay partidos programados.</p>
          : Object.entries(porJornada).map(([jornada, ps]) => (
            <div key={jornada} className="jornada-group">
              <h4 className="jornada-title">Fecha {jornada}</h4>
              {ps.map(p => (
                <div key={p.id} className="partido-row">
                  <span className="match-teams">{p.equipo_local?.nombre} vs {p.equipo_visitante?.nombre}</span>
                  <div className="match-meta">
                    {p.fecha && <span>{new Date(p.fecha).toLocaleDateString('es-AR')}</span>}
                    {p.cancha && <span>📍 {p.cancha}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))
        }
      </div>
    </div>
  )
}
