import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ============================================================
// MOCKS — hoisted por Vitest, deben ir antes de los imports
// ============================================================

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    }
  }
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

const mockApiPost = vi.fn()
vi.mock('../lib/api', () => ({
  api: { post: (...args) => mockApiPost(...args) }
}))

// Imports del componente y del mock (después de vi.mock)
import RegisterPage from '../pages/admin/Register'
import { supabase } from '../lib/supabase'

// ============================================================
// Helper
// ============================================================
const renderRegister = () =>
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )

// ============================================================
// 1. SUPABASE CLIENT — Estado del mock en tests
// ============================================================
describe('🗄️  Supabase Client — Estado del mock en tests', () => {
  it('el mock está disponible y expone auth.getSession', () => {
    expect(supabase).toBeDefined()
    expect(typeof supabase.auth.getSession).toBe('function')
  })

  it('getSession devuelve sesión nula (sin usuario logueado)', async () => {
    const result = await supabase.auth.getSession()
    expect(result.data.session).toBeNull()
  })

  it('onAuthStateChange devuelve suscripción con unsubscribe', () => {
    const { data } = supabase.auth.onAuthStateChange(vi.fn())
    expect(typeof data.subscription.unsubscribe).toBe('function')
  })
})

// ============================================================
// 2. STEP 1 — Formulario de cuenta
// ============================================================
describe('📋 Register — Step 1: Formulario de cuenta', () => {
  it('renderiza el step 1 por defecto', () => {
    renderRegister()
    expect(screen.getByTestId('step1-form')).toBeInTheDocument()
  })

  it('muestra todos los campos del step 1', () => {
    renderRegister()
    expect(screen.getByTestId('register-nombre')).toBeInTheDocument()
    expect(screen.getByTestId('register-email')).toBeInTheDocument()
    expect(screen.getByTestId('register-password')).toBeInTheDocument()
    expect(screen.getByTestId('register-telefono')).toBeInTheDocument()
  })

  it('muestra el botón "Continuar"', () => {
    renderRegister()
    expect(screen.getByTestId('register-continuar')).toBeInTheDocument()
  })

  it('muestra el link "Iniciar sesión" en el step 1', () => {
    renderRegister()
    expect(screen.getByText(/Iniciar sesión/i)).toBeInTheDocument()
  })

  it('muestra el step indicator con "Cuenta", "Liga" y "Listo"', () => {
    renderRegister()
    expect(screen.getByText('Cuenta')).toBeInTheDocument()
    expect(screen.getByText('Liga')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
  })
})

// ============================================================
// 3. NAVEGACIÓN — Step 1 → Step 2 → Step 1 (botón Volver)
// ============================================================
describe('🔄 Register — Navegación entre pasos', () => {
  const fillStep1 = () => {
    fireEvent.change(screen.getByTestId('register-nombre'),   { target: { value: 'Juan Pérez' } })
    fireEvent.change(screen.getByTestId('register-email'),    { target: { value: 'juan@test.com' } })
    fireEvent.change(screen.getByTestId('register-password'), { target: { value: 'segura123' } })
    fireEvent.change(screen.getByTestId('register-telefono'), { target: { value: '+54 9 11 1234-5678' } })
  }

  it('avanza al step 2 al enviar el formulario de cuenta', async () => {
    renderRegister()
    fillStep1()
    fireEvent.click(screen.getByTestId('register-continuar'))
    await waitFor(() => expect(screen.getByTestId('step2-form')).toBeInTheDocument())
  })

  it('el step 2 muestra los campos de la liga', async () => {
    renderRegister()
    fillStep1()
    fireEvent.click(screen.getByTestId('register-continuar'))
    await waitFor(() => {
      expect(screen.getByTestId('register-liga-nombre')).toBeInTheDocument()
      expect(screen.getByTestId('register-tipo-futbol')).toBeInTheDocument()
      expect(screen.getByTestId('register-zona')).toBeInTheDocument()
    })
  })

  it('el step 2 muestra el botón "Volver"', async () => {
    renderRegister()
    fillStep1()
    fireEvent.click(screen.getByTestId('register-continuar'))
    await waitFor(() => expect(screen.getByTestId('register-volver')).toBeInTheDocument())
  })

  it('el botón "Volver" regresa al step 1 conservando los datos ingresados', async () => {
    renderRegister()
    fillStep1()
    fireEvent.click(screen.getByTestId('register-continuar'))
    await waitFor(() => screen.getByTestId('register-volver'))
    fireEvent.click(screen.getByTestId('register-volver'))
    await waitFor(() => {
      expect(screen.getByTestId('step1-form')).toBeInTheDocument()
      expect(screen.getByTestId('register-email')).toHaveValue('juan@test.com')
      expect(screen.getByTestId('register-nombre')).toHaveValue('Juan Pérez')
    })
  })

  it('el botón "Volver" limpia los errores del step 2', async () => {
    renderRegister()
    fillStep1()
    fireEvent.click(screen.getByTestId('register-continuar'))
    await waitFor(() => screen.getByTestId('step2-form'))
    fireEvent.click(screen.getByTestId('register-volver'))
    await waitFor(() => {
      expect(screen.queryByTestId('register-error')).not.toBeInTheDocument()
    })
  })
})

// ============================================================
// 4. STEP 2 — Selector de tipo de fútbol
// ============================================================
describe('⚽ Register — Step 2: Selector de tipo de fútbol', () => {
  const goToStep2 = async () => {
    fireEvent.change(screen.getByTestId('register-nombre'),   { target: { value: 'Organizador' } })
    fireEvent.change(screen.getByTestId('register-email'),    { target: { value: 'org@test.com' } })
    fireEvent.change(screen.getByTestId('register-password'), { target: { value: 'pass123' } })
    fireEvent.change(screen.getByTestId('register-telefono'), { target: { value: '+54 9 11 0000-0000' } })
    fireEvent.click(screen.getByTestId('register-continuar'))
    await waitFor(() => screen.getByTestId('step2-form'))
  }

  it('el select de tipo de fútbol tiene f7 por defecto', async () => {
    renderRegister()
    await goToStep2()
    expect(screen.getByTestId('register-tipo-futbol')).toHaveValue('f7')
  })

  it('permite cambiar el tipo de fútbol a f11', async () => {
    renderRegister()
    await goToStep2()
    fireEvent.change(screen.getByTestId('register-tipo-futbol'), { target: { value: 'f11' } })
    expect(screen.getByTestId('register-tipo-futbol')).toHaveValue('f11')
  })

  it('el select tiene las 4 opciones válidas (f5, f7, f9, f11)', async () => {
    renderRegister()
    await goToStep2()
    const options = Array.from(screen.getByTestId('register-tipo-futbol').options).map(o => o.value)
    expect(options).toEqual(expect.arrayContaining(['f5', 'f7', 'f9', 'f11']))
  })
})

// ============================================================
// 5. ENVÍO FINAL — Integración con la API del backend
// ============================================================
describe('🚀 Register — Envío al backend (mock de api.post)', () => {
  beforeEach(() => mockApiPost.mockReset())

  const completeRegistration = async () => {
    fireEvent.change(screen.getByTestId('register-nombre'),   { target: { value: 'Test Org' } })
    fireEvent.change(screen.getByTestId('register-email'),    { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByTestId('register-password'), { target: { value: 'segura123' } })
    fireEvent.change(screen.getByTestId('register-telefono'), { target: { value: '+54 9 11 1234-5678' } })
    fireEvent.click(screen.getByTestId('register-continuar'))
    await waitFor(() => screen.getByTestId('step2-form'))
    fireEvent.change(screen.getByTestId('register-liga-nombre'), { target: { value: 'Liga Palermo' } })
    fireEvent.change(screen.getByTestId('register-tipo-futbol'), { target: { value: 'f7' } })
    fireEvent.change(screen.getByTestId('register-zona'),        { target: { value: 'Palermo, CABA' } })
  }

  it('llama a api.post con /identity/register al enviar el step 2', async () => {
    mockApiPost.mockResolvedValueOnce({ data: { id: '123' } })
    renderRegister()
    await completeRegistration()
    fireEvent.click(screen.getByTestId('register-submit'))
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/identity/register',
        expect.objectContaining({
          email: 'test@test.com',
          nombre_organizador: 'Test Org',
          nombre_liga: 'Liga Palermo',
          tipo_futbol: 'f7',
          zona: 'Palermo, CABA'
        })
      )
    })
  })

  it('muestra el step 3 de éxito cuando la API responde OK', async () => {
    mockApiPost.mockResolvedValueOnce({ data: { id: '123' } })
    renderRegister()
    await completeRegistration()
    fireEvent.click(screen.getByTestId('register-submit'))
    await waitFor(() => expect(screen.getByText('¡Todo listo!')).toBeInTheDocument())
  })

  it('muestra mensaje de error cuando la API falla', async () => {
    mockApiPost.mockRejectedValueOnce({
      response: { data: { error: 'Email ya registrado' } }
    })
    renderRegister()
    await completeRegistration()
    fireEvent.click(screen.getByTestId('register-submit'))
    await waitFor(() => expect(screen.getByTestId('register-error')).toBeInTheDocument())
  })
})
