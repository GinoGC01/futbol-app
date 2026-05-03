import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'

export default function GoogleAuthButton({ onError, onLoadingChange, text = "continue_with" }) {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleGoogleSuccess = async (response) => {
    const { credential } = response
    if (onLoadingChange) onLoadingChange(true)
    
    try {
      const { token, user } = await api.post('/identity/google', { credential })
      signIn(token, user)
      navigate('/admin')
    } catch (err) {
      if (onError) onError(err.message || 'Error en la autenticación con Google')
      if (onLoadingChange) onLoadingChange(false)
    }
  }

  return (
    <div className="flex justify-center scale-105 sm:scale-100 w-full">
      <GoogleLogin 
        onSuccess={handleGoogleSuccess} 
        onError={() => onError && onError('Error en la comunicación con Google')}
        theme="filled_black"
        shape="rectangular"
        size="large"
        width="100%"
        text={text}
      />
    </div>
  )
}
