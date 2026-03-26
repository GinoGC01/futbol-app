import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Goleadores from '../components/Goleadores'

const data = [
  { jugador_id: '1', temporada_id: 't1', jugador_nombre: 'Pérez', equipo_nombre: 'Atlético', goles: 5 },
  { jugador_id: '2', temporada_id: 't1', jugador_nombre: 'González', equipo_nombre: 'Deportivo', goles: 3 }
]

describe('Goleadores', () => {
  it('muestra mensaje cuando no hay datos', () => {
    render(<Goleadores data={[]} />)
    expect(screen.getByText(/sin goleadores/i)).toBeInTheDocument()
  })

  it('renderiza los jugadores en orden', () => {
    render(<Goleadores data={data} />)
    expect(screen.getByTestId('tabla-goleadores')).toBeInTheDocument()
    expect(screen.getByText('Pérez')).toBeInTheDocument()
    expect(screen.getByText('González')).toBeInTheDocument()
  })

  it('muestra la cantidad de goles', () => {
    render(<Goleadores data={data} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
