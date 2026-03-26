import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FixtureCard from '../components/FixtureCard'

const partido = {
  id: '1', fecha: '2025-08-15T18:00:00Z', cancha: 'Cancha Norte',
  estado: 'programado', goles_local: null, goles_visitante: null,
  jornada: 3,
  equipo_local: { id: 'a', nombre: 'Atlético' },
  equipo_visitante: { id: 'b', nombre: 'Deportivo' }
}

describe('FixtureCard', () => {
  it('muestra los nombres de ambos equipos', () => {
    render(<FixtureCard partido={partido} />)
    expect(screen.getByText('Atlético')).toBeInTheDocument()
    expect(screen.getByText('Deportivo')).toBeInTheDocument()
  })

  it('muestra "vs" cuando showScore es false', () => {
    render(<FixtureCard partido={partido} showScore={false} />)
    expect(screen.getByText('vs')).toBeInTheDocument()
  })

  it('muestra el marcador cuando showScore es true', () => {
    const p = { ...partido, goles_local: 3, goles_visitante: 1 }
    render(<FixtureCard partido={p} showScore={true} />)
    expect(screen.getByText('3 - 1')).toBeInTheDocument()
  })

  it('muestra la cancha', () => {
    render(<FixtureCard partido={partido} />)
    expect(screen.getByText(/Cancha Norte/)).toBeInTheDocument()
  })

  it('muestra "Fecha a confirmar" cuando fecha es null', () => {
    const p = { ...partido, fecha: null }
    render(<FixtureCard partido={p} />)
    expect(screen.getByText('Fecha a confirmar')).toBeInTheDocument()
  })

  it('muestra la jornada', () => {
    render(<FixtureCard partido={partido} />)
    expect(screen.getByText('Fecha 3')).toBeInTheDocument()
  })

  it('muestra badge parcial cuando estado es finalizado_parcial', () => {
    const p = { ...partido, estado: 'finalizado_parcial' }
    render(<FixtureCard partido={p} />)
    expect(screen.getByText(/Parcial/)).toBeInTheDocument()
  })
})
