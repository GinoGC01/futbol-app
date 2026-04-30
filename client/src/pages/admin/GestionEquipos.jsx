import { useState } from 'react'
import { useAdminLiga, useAdminEquipos, useCrearEquipo } from '../../hooks/useAdminData'
import Loader from '../../components/ui/Loader'

export default function GestionEquipos() {
  const [nombre, setNombre] = useState('')
  const { data: adminLiga } = useAdminLiga()
  const ligaId = adminLiga?.liga_id

  const { data: equipos = [], isLoading } = useAdminEquipos(ligaId)
  const crearEquipo = useCrearEquipo()

  const handleSubmit = (e) => {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) return
    crearEquipo.mutate(n, { onSuccess: () => setNombre('') })
  }

  return (
    <div className="gestion-section" data-testid="gestion-equipos">
      <h2>Equipos</h2>

      <form onSubmit={handleSubmit} className="inline-form" data-testid="form-equipo">
        <input
          type="text"
          placeholder="Nombre del equipo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          minLength={2}
          maxLength={80}
          required
          data-testid="input-equipo"
        />
        <button type="submit" disabled={crearEquipo.isPending}>
          {crearEquipo.isPending ? 'Creando...' : '+ Agregar'}
        </button>
      </form>

      {crearEquipo.isError && (
        <p role="alert" className="error-msg">{crearEquipo.error.message}</p>
      )}

      {isLoading ? (
        <Loader className="py-10" />
      ) : (
        <ul className="items-list" data-testid="lista-equipos">
          {equipos.map(eq => (
            <li key={eq.id} className="item-row">
              <div className="item-avatar" style={{ backgroundColor: eq.color_principal || '#2a3a4a' }}>
                {eq.escudo_url
                  ? <img src={eq.escudo_url} alt={eq.nombre} width={24} height={24} />
                  : <span>{eq.nombre[0]}</span>
                }
              </div>
              <span className="item-name">{eq.nombre}</span>
            </li>
          ))}
          {equipos.length === 0 && (
            <li className="empty-msg">No hay equipos. Agregá el primero.</li>
          )}
        </ul>
      )}
    </div>
  )
}
