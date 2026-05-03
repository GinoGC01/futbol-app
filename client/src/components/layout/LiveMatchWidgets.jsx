import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLiveMatches } from '../../context/LiveMatchContext'
import { Swords, Clock, Pause, ChevronRight, X, Target, AlertTriangle } from 'lucide-react'

/**
 * E-01 — Header strip widget showing all live matches.
 * Renders inside the admin header when matches are in progress.
 */
export function LiveMatchHeaderWidget() {
  const { liveMatches, timers, formatTime } = useLiveMatches()
  const navigate = useNavigate()
  const location = useLocation()

  // Don't show on the MatchEdgeBox page itself
  if (location.pathname === '/admin/partidos' || liveMatches.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-[280px] sm:max-w-[400px]">
      {liveMatches.map(p => (
        <button
          key={p.id}
          onClick={() => navigate('/admin/partidos')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-95 shrink-0 ${
            p.estado === 'entre_tiempo'
              ? 'bg-warning/15 border border-warning/30 text-warning hover:bg-warning/25'
              : 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 live-ring'
          }`}
        >
          {p.estado === 'entre_tiempo'
            ? <Pause className="w-3 h-3" />
            : <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          }
          <span className="truncate max-w-[40px]">{p.equipo_local?.nombre?.slice(0, 4)}</span>
          <span className="font-mono font-black text-[10px]">
            {p.goles_local ?? 0}-{p.goles_visitante ?? 0}
          </span>
          <span className="truncate max-w-[40px]">{p.equipo_visitante?.nombre?.slice(0, 4)}</span>
          <span className="font-mono text-[10px] opacity-70">{formatTime(timers[p.id])}'</span>
        </button>
      ))}
    </div>
  )
}


/**
 * E-02 — Floating bubble overlay.
 * Appears on all admin pages (except MatchEdgeBox) when live matches exist.
 * Shows a compact scoreboard + timer with one-tap navigation back to Match Edge.
 */
export function LiveMatchBubble() {
  const { liveMatches, timers, formatTime } = useLiveMatches()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)

  // Reset expanded state when navigating between pages
  useEffect(() => {
    setExpanded(false)
  }, [location.pathname])

  // Don't show on the MatchEdgeBox page or if no live matches
  if (location.pathname === '/admin/partidos' || liveMatches.length === 0) return null

  // Collapsed bubble — single FAB
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 
          w-14 h-14 rounded-2xl 
          bg-primary text-bg-deep 
          flex items-center justify-center 
          shadow-[0_4px_30px_rgba(206,222,11,0.3)] 
          hover:scale-110 active:scale-95 
          transition-all live-ring
          group"
        title="Partidos en vivo"
      >
        <Swords className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        {/* Badge count */}
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-bg-deep animate-pulse">
          {liveMatches.length}
        </span>
      </button>
    )
  }

  // Expanded panel
  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-72 sm:w-80 animate-fade-in">
      {/* Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 rounded-[22px] blur-sm opacity-60" />

      <div className="relative bg-bg-surface/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
              En Vivo — {liveMatches.length}
            </span>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="w-6 h-6 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-text-dim" />
          </button>
        </div>

        {/* Match cards */}
        <div className="max-h-60 overflow-y-auto p-2 space-y-2 scrollbar-thin">
          {liveMatches.map(p => {
            const isHalftime = p.estado === 'entre_tiempo'
            return (
              <button
                key={p.id}
                onClick={() => {
                  setExpanded(false)
                  navigate('/admin/partidos')
                }}
                className={`w-full text-left p-3 rounded-xl transition-all active:scale-[0.97] group ${
                  isHalftime 
                    ? 'bg-warning/5 border border-warning/20 hover:border-warning/40 halftime-stripes' 
                    : 'bg-bg-deep/50 border border-white/5 hover:border-primary/30'
                }`}
              >
                {/* Status + Timer row */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${
                    isHalftime ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
                  }`}>
                    {isHalftime ? <><Pause className="w-2.5 h-2.5" /> ET</> : <><Clock className="w-2.5 h-2.5" /> Live</>}
                  </div>
                  <span className={`stopwatch-display text-lg font-black ${isHalftime ? 'text-warning' : 'text-primary'}`}>
                    {formatTime(timers[p.id])}<span className="text-xs opacity-50">'</span>
                  </span>
                </div>

                {/* Scoreboard */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wide truncate flex-1">{p.equipo_local?.nombre}</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-deep/50 rounded-md border border-white/5">
                    <span className={`text-sm font-black font-mono ${(p.goles_local ?? 0) > 0 ? 'text-primary' : 'text-text-dim'}`}>
                      {p.goles_local ?? 0}
                    </span>
                    <span className="text-[8px] text-text-dim/30">—</span>
                    <span className={`text-sm font-black font-mono ${(p.goles_visitante ?? 0) > 0 ? 'text-primary' : 'text-text-dim'}`}>
                      {p.goles_visitante ?? 0}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wide truncate flex-1 text-right">{p.equipo_visitante?.nombre}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer CTA */}
        <button
          onClick={() => {
            setExpanded(false)
            navigate('/admin/partidos')
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors"
        >
          Ir a Match Edge <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
