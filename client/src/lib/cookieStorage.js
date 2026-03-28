import Cookies from 'js-cookie'

/**
 * Custom Storage implementation for Supabase Auth using Cookies
 * instead of localStorage for enhanced security and SSR compatibility.
 */
class CookieStorage {
  getItem(key) {
    return Cookies.get(key) || null
  }

  setItem(key, value) {
    Cookies.set(key, value, {
      expires: 365,
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax',
      path: '/'
    })
  }

  removeItem(key) {
    Cookies.remove(key, { path: '/' })
  }
}

export const cookieStorage = new CookieStorage()
