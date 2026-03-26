export default function Goleadores({ data = [] }) {
  if (!data.length) return <p className="empty-msg">Sin goleadores registrados.</p>

  return (
    <div className="tabla-wrap">
      <table data-testid="tabla-goleadores">
        <thead>
          <tr>
            <th>#</th>
            <th>Jugador</th>
            <th>Equipo</th>
            <th>Goles</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={`${row.jugador_id}-${row.temporada_id}`}>
              <td className="pos">{i + 1}</td>
              <td className="jugador">{row.jugador_nombre}</td>
              <td>{row.equipo_nombre}</td>
              <td className="goles"><strong>{row.goles}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
