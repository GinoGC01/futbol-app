import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useLigaActiva } from './LigaContext'
import { useTemporadas } from '../hooks/useAdmin'
import { adminService } from '../services/adminService'
import { useAuth } from '../hooks/useAuth'

const LiveMatchContext = createContext()

/**
 * Tracks all live/halftime matches for the active temporada using a single optimized endpoint.
 * Provides:
 *  - liveMatches: array of partido objects currently en_juego/entre_tiempo
 *  - timers: { [partidoId]: elapsed seconds } derived from localStorage
 *  - refreshLive(): manual refetch
 */
export function LiveMatchProvider({ children }) {
  const { user } = useAuth()
  const { liga } = useLigaActiva()
  const { data: temporadas } = useTemporadas(liga?.id)
  const temporadaActiva = temporadas?.find(t => t.estado === 'activa')

  const [liveMatches, setLiveMatches] = useState([])
  const [timers, setTimers] = useState({})
  
  const intervalRef = useRef(null)
  const scanIntervalRef = useRef(null)
  const isTabVisible = useRef(document.visibilityState === 'visible')

  // Scan for live matches (Optimized: single endpoint)
  const scanForLive = useCallback(async () => {
    // CRITICAL: Stop all requests if user is not authenticated or tab is hidden
    if (!user || !temporadaActiva?.id || !isTabVisible.current) {
      if (!user || !temporadaActiva?.id) setLiveMatches([])
      return
    }

    try {
      const response = await adminService.getLiveMatches(temporadaActiva.id)
      const matches = Array.isArray(response) ? response : (response?.data || [])
      setLiveMatches(matches)
    } catch {
      // Silently fail — non-critical
    }
  }, [user, temporadaActiva?.id])

  // Manage SCAN cycle (Variable interval: 15s if live, 60s if none)
  useEffect(() => {
    if (!user) {
      setLiveMatches([])
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
      return
    }

    scanForLive() // Initial scan
    
    // Determine interval speed based on current matches
    // Note: To make it truly dynamic, we would need to recreate the interval when liveMatches change.
    // However, a 60s check for "discovery" is reasonable.
    const intervalTime = liveMatches.length > 0 ? 15_000 : 60_000
    
    scanIntervalRef.current = setInterval(scanForLive, intervalTime)

    const handleVisibilityChange = () => {
      isTabVisible.current = document.visibilityState === 'visible'
      
      if (isTabVisible.current && user) {
        // Tab became visible -> immediate scan & resume interval
        scanForLive()
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = setInterval(scanForLive, intervalTime)
      } else {
        // Tab hidden -> pause interval to save resources
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current)
          scanIntervalRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [scanForLive, user, liveMatches.length]) // Added liveMatches.length to re-adjust interval speed

  const formatTime = (seconds) => {
    const m = String(Math.floor((seconds || 0) / 60)).padStart(2, '0')
    const s = String((seconds || 0) % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  // TICKER (1s) & Live Title
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (!user || liveMatches.length === 0) {
      setTimers({})
      document.title = "Cancha Libre | Torneos de Fútbol" // Restore original title
      return
    }

    let titleIndex = 0

    const tick = () => {
      const now = Date.now()
      const next = {}

      liveMatches.forEach(p => {
        const saved = localStorage.getItem(`match_timer_${p.id}`)
        if (!saved) { next[p.id] = 0; return }

        const data = JSON.parse(saved)

        if (p.estado === 'en_juego' && data.startTime) {
          next[p.id] = Math.floor((now - data.startTime) / 1000)
        } else if (p.estado === 'entre_tiempo' && data.pausedAt !== undefined) {
          next[p.id] = data.pausedAt
        } else {
          next[p.id] = 0
        }
      })

      setTimers(next)

      // Live Title logic
      // Every 5 seconds (ticks), rotate the displayed match if there are multiple
      if (now % 5000 < 1000) {
        titleIndex = (titleIndex + 1) % liveMatches.length
      }
      
      const p = liveMatches[titleIndex] || liveMatches[0]
      const time = formatTime(next[p.id])
      const local = p.equipo_local?.nombre?.substring(0, 3).toUpperCase() || 'LOC'
      const vis = p.equipo_visitante?.nombre?.substring(0, 3).toUpperCase() || 'VIS'
      const statusIcon = p.estado === 'entre_tiempo' ? '⏸' : '🔴'
      
      document.title = `${statusIcon} ${p.goles_local ?? 0}-${p.goles_visitante ?? 0} [${time}'] ${local}v${vis}`
    }

    tick() // Initial tick
    intervalRef.current = setInterval(tick, 1000)
    
    return () => {
      clearInterval(intervalRef.current)
      document.title = "Cancha Libre | Torneos de Fútbol"
    }
  }, [liveMatches, user])

  return (
    <LiveMatchContext.Provider value={{ liveMatches, timers, formatTime, refreshLive: scanForLive }}>
      {children}
    </LiveMatchContext.Provider>
  )
}

export function useLiveMatches() {
  const ctx = useContext(LiveMatchContext)
  if (!ctx) throw new Error('useLiveMatches must be used within LiveMatchProvider')
  return ctx
}
