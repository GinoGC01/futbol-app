import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TablaPosc from '../components/TablaPosc'

const filaBase = {
  equipo_id: '1', equipo_nombre: 'Atlético', escudo_url: null,
  pj: 5, pg: 4, pe: 0, pp: 1, gf: 10, gc: 4, dg: 6, pts: 12
}
const fila2 = {
  equipo_id: '2', equipo_nombre: 'Deportivo', escudo_url: null,
  pj: 5, pg: 1, pe: 1, pp: 3, gf: 5, gc: 9, dg: -4, pts: 4
}

describe('TablaPosc', () => {
  it('muestra mensaje cuando no hay datos', () => {
    render(<TablaPosc data={[]} />)
    expect(screen.getByText(/sin posiciones/i)).toBeInTheDocument()
  })

  it('renderiza la tabla con datos', () => {
    render(<TablaPosc data={[filaBase, fila2]} />)
    expect(screen.getByTestId('tabla-posiciones')).toBeInTheDocument()
    expect(screen.getByText('Atlético')).toBeInTheDocument()
    expect(screen.getByText('Deportivo')).toBeInTheDocument()
  })

  it('muestra diferencia positiva con signo +', () => {
    render(<TablaPosc data={[filaBase]} />)
    expect(screen.getByText('+6')).toBeInTheDocument()
  })

  it('muestra diferencia negativa sin signo +', () => {
    render(<TablaPosc data={[fila2]} />)
    expect(screen.getByText('-4')).toBeInTheDocument()
  })

  it('muestra los puntos en bold', () => {
    render(<TablaPosc data={[filaBase]} />)
    const pts = screen.getByText('12')
    expect(pts.tagName).toBe('STRONG')
  })
})
