async function request(path, options = {}) {
  const BASE = import.meta.env.VITE_API_URL

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include', // Importante para enviar cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  // 1. Sliding Session: El servidor ya refresca la cookie automáticamente.
  // Mantenemos esto si queremos detectar el cambio explícitamente en el cliente.
  const newToken = res.headers.get('X-New-Token')
  if (newToken) {
    localStorage.setItem('token', newToken) // Opcional si el server maneja la cookie
  }

  // 2. Parse response
  const contentType = res.headers.get('content-type')
  let json = {}
  if (contentType && contentType.includes('application/json')) {
    json = await res.json()
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('user')
      const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register')
      const isAdminArea = window.location.pathname.startsWith('/admin')
      
      if (isAdminArea && !isAuthPage) {
        window.location.href = '/admin/login'
      }
    }

    const err = new Error(json.message || json.error || `Error ${res.status}: ${res.statusText}`)
    err.status = res.status
    err.data = json
    err.response = { data: json }
    throw err
  }

  return json.data !== undefined ? json.data : json
}

export const api = {
  get:    (path) => request(path),
  post:   (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' })
}
