import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StandingsTab } from '../pages/public/LeagueArena'

const filaBase = {
  equipo_id: '1', equipo_nombre: 'Atlético', escudo_url: null,
  pj: 5, pg: 4, pe: 0, pp: 1, gf: 10, gc: 4, dg: 6, pts: 12
}
const fila2 = {
  equipo_id: '2', equipo_nombre: 'Deportivo', escudo_url: null,
  pj: 5, pg: 1, pe: 1, pp: 3, gf: 5, gc: 9, dg: -4, pts: 4
}

describe('StandingsTab', () => {
  const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

  it('muestra mensaje cuando no hay datos', () => {
    renderWithRouter(<StandingsTab data={[]} />)
    expect(screen.getByText(/sin datos aún/i)).toBeInTheDocument()
  })

  it('renderiza la tabla con datos', () => {
    renderWithRouter(<StandingsTab data={[filaBase, fila2]} />)
    expect(screen.getByText('Atlético')).toBeInTheDocument()
    expect(screen.getByText('Deportivo')).toBeInTheDocument()
  })

  it('muestra diferencia positiva con signo +', () => {
    renderWithRouter(<StandingsTab data={[filaBase]} />)
    expect(screen.getByText('+6')).toBeInTheDocument()
  })

  it('muestra diferencia negativa sin signo +', () => {
    renderWithRouter(<StandingsTab data={[fila2]} />)
    expect(screen.getByText('-4')).toBeInTheDocument()
  })

  it('muestra los puntos en bold', () => {
    renderWithRouter(<StandingsTab data={[filaBase]} />)
    const pts = screen.getByText('12')
    // Depending on markup, might be TD with font-bold instead of STRONG
    // In the new StandingsTab, it's a <td> with font-bold
    expect(pts.tagName).toBe('TD')
    expect(pts).toHaveClass('font-bold')
  })
})
