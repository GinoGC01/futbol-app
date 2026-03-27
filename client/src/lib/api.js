import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...options.headers
    }
  })

  const json = await res.json()
  if (!res.ok) {
    const err = new Error(json.message || json.error || `Error ${res.status}`)
    err.status = res.status
    err.data = json
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
