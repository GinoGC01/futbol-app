import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScorersTab } from '../pages/public/LeagueArena'

const data = [
  { jugador_id: '1', temporada_id: 't1', jugador_nombre: 'Juan', jugador_apellido: 'Pérez', equipo_nombre: 'Atlético', goles: 5 },
  { jugador_id: '2', temporada_id: 't1', jugador_nombre: 'Carlos', jugador_apellido: 'González', equipo_nombre: 'Deportivo', goles: 3 }
]

describe('ScorersTab', () => {
  it('muestra mensaje cuando no hay datos', () => {
    render(<ScorersTab data={[]} />)
    expect(screen.getByText(/sin goleadores/i)).toBeInTheDocument()
  })

  it('renderiza los jugadores en orden', () => {
    render(<ScorersTab data={data} />)
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('Carlos González')).toBeInTheDocument()
  })

  it('muestra la cantidad de goles', () => {
    render(<ScorersTab data={data} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
