export default function TablaPosc({ data = [] }) {
  if (!data.length) return <p className="empty-msg">Sin posiciones registradas aún.</p>

  return (
    <div className="tabla-wrap">
      <table className="tabla-posiciones" data-testid="tabla-posiciones">
        <thead>
          <tr>
            <th>#</th><th>Equipo</th>
            <th title="Partidos jugados">PJ</th>
            <th title="Ganados">PG</th>
            <th title="Empatados">PE</th>
            <th title="Perdidos">PP</th>
            <th title="Goles a favor">GF</th>
            <th title="Goles en contra">GC</th>
            <th title="Diferencia">DG</th>
            <th title="Puntos">PTS</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.equipo_id} className={i === 0 ? 'lider' : ''}>
              <td className="pos">{i + 1}</td>
              <td className="equipo-nombre">
                {row.escudo_url && (
                  <img src={row.escudo_url} alt={row.equipo_nombre} width={20} height={20} />
                )}
                {row.equipo_nombre}
              </td>
              <td>{row.pj}</td>
              <td>{row.pg}</td>
              <td>{row.pe}</td>
              <td>{row.pp}</td>
              <td>{row.gf}</td>
              <td>{row.gc}</td>
              <td className={row.dg > 0 ? 'positive' : row.dg < 0 ? 'negative' : ''}>{row.dg > 0 ? `+${row.dg}` : row.dg}</td>
              <td className="pts"><strong>{row.pts}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
