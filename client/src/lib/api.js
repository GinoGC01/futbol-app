import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL

export async function apiFetch(path, options = {}) {
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
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`)
  return json
}
