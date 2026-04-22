import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function boot() {
      try {
        // Al usar cookies, no podemos "ver" el token en JS (si es httpOnly).
        // La mejor forma de saber si estamos logueados es pedirle al backend 
        // nuestro perfil. Si responde 200, estamos dentro.
        const data = await api.get('/identity/me')
        setUser(data)
      } catch (err) {
        // Si falla el /me (401), simplemente no hay usuario
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    boot()
  }, [])

  const signIn = (token, userData) => {
    // Si la cookie ya se seteó en la respuesta del login, 
    // solo necesitamos actualizar el estado local del usuario.
    setUser(userData)
    // Guardamos metadata del user (opcional) para carga rápida inicial
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const signOut = async () => {
    try {
      await api.post('/identity/logout')
    } catch (e) {
      console.error('Error al cerrar sesión en el servidor')
    }
    localStorage.removeItem('user')
    localStorage.removeItem('token') // Limpieza por si quedó de la versión anterior
    setUser(null)
    window.location.href = '/admin/login'
  }

  return { user, loading, signOut, signIn }
}
