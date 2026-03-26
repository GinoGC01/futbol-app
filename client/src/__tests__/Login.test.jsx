import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    }
  }
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

import LoginPage from '../pages/admin/Login'
import { supabase } from '../lib/supabase'

describe('LoginPage', () => {
  it('renderiza el formulario', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-btn')).toBeInTheDocument()
  })

  it('muestra error con credenciales incorrectas', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' }
    })

    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByTestId('login-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('error-msg')).toBeInTheDocument()
    })
  })

  it('el botón queda deshabilitado mientras carga', async () => {
    supabase.auth.signInWithPassword.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    )

    render(<MemoryRouter><LoginPage /></MemoryRouter>)
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: '123456' } })
    fireEvent.click(screen.getByTestId('login-btn'))

    expect(screen.getByTestId('login-btn')).toBeDisabled()
  })
})
