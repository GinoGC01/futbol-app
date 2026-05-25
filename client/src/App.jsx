import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'

import React, { Suspense, lazy } from 'react'

// ============================================
// MANTENIMIENTO: cambiar a true para activar el modo mantenimiento
// ============================================
const MAINTENANCE_MODE = true

// Layouts & Synchronous Components
import Omnisearch from './components/ui/Omnisearch'
import AdminLayout from './layouts/AdminLayout'
import PublicLayout from './layouts/PublicLayout'
import Loader from './components/ui/Loader'
import WaitlistScreen from './pages/admin/WaitlistScreen'
import SuspendedScreen from './pages/admin/SuspendedScreen'

// Lazy-loaded Public Pages
const Home = lazy(() => import('./pages/public/Home'))
const LeagueExplorer = lazy(() => import('./pages/public/LeagueExplorer'))
const LeagueArena = lazy(() => import('./pages/public/LeagueArena'))
const TeamProfile = lazy(() => import('./pages/public/TeamProfile'))
const PlayerProfile = lazy(() => import('./pages/public/PlayerProfile'))
const NotFound = lazy(() => import('./pages/public/NotFound'))
const Terms = lazy(() => import('./pages/public/Terms'))
const Privacy = lazy(() => import('./pages/public/Privacy'))
const Support = lazy(() => import('./pages/public/Support'))

// Lazy-loaded Admin Pages
const Login = lazy(() => import('./pages/admin/Login'))
const Register = lazy(() => import('./pages/admin/Register'))
const DashboardHome = lazy(() => import('./pages/admin/DashboardHome'))
const TournamentArchitect = lazy(() => import('./features/competition/components/TournamentArchitect'))
const RosterManager = lazy(() => import('./features/roster/components/RosterManager'))
const MatchEdgeBox = lazy(() => import('./features/match/components/MatchEdgeBox'))
const AwardScrutinyTool = lazy(() => import('./features/awards/components/AwardScrutinyTool'))
const PlayerManager = lazy(() => import('./features/roster/components/PlayerManager'))
const LeagueSettings = lazy(() => import('./features/competition/components/LeagueSettings'))
const ForgotPassword = lazy(() => import('./pages/admin/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/admin/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/admin/VerifyEmail'))

const Loadable = (WrappedComponent) => (props) => {
  return (
    <Suspense fallback={<Loader fullScreen text="Cargando módulo..." />}>
      {React.createElement(WrappedComponent, props)}
    </Suspense>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    }
  }
})

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader fullScreen text="Verificando sesión..." />
  if (!user) return <Navigate to="/admin/login" replace />

  // Control de acceso Beta
  if (user.status === 'pending') return <WaitlistScreen />
  if (user.status === 'suspended') return <SuspendedScreen />

  return children
}

const LoadableLogin = Loadable(Login)
const LoadableRegister = Loadable(Register)
const LoadableForgotPassword = Loadable(ForgotPassword)
const LoadableResetPassword = Loadable(ResetPassword)
const LoadableVerifyEmail = Loadable(VerifyEmail)
const LoadableNotFound = Loadable(NotFound)

// ============================================
// ROUTER CONFIGURATION (v7 Data Router)
// ============================================
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Omnisearch />
        <Outlet />
      </>
    ),
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "ligas", element: <LeagueExplorer /> },
          { path: "liga/:slug", element: <LeagueArena /> },
          { path: "equipo/:id", element: <TeamProfile /> },
          { path: "jugador/:id", element: <PlayerProfile /> },
          { path: "terminos", element: <Terms /> },
          { path: "privacidad", element: <Privacy /> },
          { path: "soporte", element: <Support /> },
        ]
      },
      { path: "admin/login", element: <LoadableLogin /> },
      { path: "admin/register", element: <LoadableRegister /> },
      { path: "admin/forgot-password", element: <LoadableForgotPassword /> },
      { path: "admin/reset-password", element: <LoadableResetPassword /> },
      { path: "admin/verify", element: <LoadableVerifyEmail /> },
      {
        path: "admin",
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardHome /> },
          { path: "torneo", element: <TournamentArchitect /> },
          { path: "roster", element: <RosterManager /> },
          { path: "jugadores", element: <PlayerManager /> },
          { path: "partidos", element: <MatchEdgeBox /> },
          { path: "premios", element: <AwardScrutinyTool /> },
          { path: "settings", element: <LeagueSettings /> },
        ]
      },
      { path: "*", element: <LoadableNotFound /> }
    ]
  }
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  }
})

function MaintenanceMode() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D0D0D',
      color: '#EDEDED',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '50%',
        height: '50%',
        background: 'rgba(206,222,11,0.04)',
        filter: 'blur(120px)',
        borderRadius: '9999px',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '50%',
        height: '50%',
        background: 'rgba(131,153,14,0.04)',
        filter: 'blur(120px)',
        borderRadius: '9999px',
        pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 32px',
          position: 'relative',
          opacity: 0.15
        }}>
          <img
            src="/images/isotipo.webp"
            alt="Cancha Libre"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          marginBottom: '24px',
          border: '1px solid rgba(206,222,11,0.2)',
          background: 'rgba(206,222,11,0.08)',
          transform: 'skewX(-12deg)'
        }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#CEDE0B',
            transform: 'skewX(12deg)',
            animation: 'maintenancePulse 2s ease-in-out infinite'
          }} />
          <span style={{
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#CEDE0B',
            transform: 'skewX(12deg)'
          }}>
            Mantenimiento Programado
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(48px, 10vw, 96px)',
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          margin: '0 0 8px'
        }}>
          Cancha <span style={{ color: '#CEDE0B' }}>Libre</span>
        </h1>
        <p style={{
          fontSize: 'clamp(14px, 2.5vw, 18px)',
          maxWidth: '480px',
          lineHeight: 1.6,
          color: '#A3A3A3',
          margin: '0 auto 32px'
        }}>
          Estamos realizando tareas de mantenimiento programadas para mejorar la plataforma.
          El servicio estará disponible nuevamente a partir del{' '}
          <span style={{ color: '#EDEDED', fontWeight: 600 }}>1 de junio de 2026</span>.
        </p>
        <a
          href="https://www.canchalibre.pro/blog/features-25-5"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 36px',
            background: '#CEDE0B',
            color: '#0D0D0D',
            fontWeight: 700,
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textDecoration: 'none',
            transition: 'all 0.2s',
            clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)'
          }}
          onMouseEnter={e => { e.target.style.background = '#83990E'; e.target.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { e.target.style.background = '#CEDE0B'; e.target.style.transform = 'scale(1)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Más información
        </a>
      </div>
      <style>{`
        @keyframes maintenancePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider> 
        {MAINTENANCE_MODE ? <MaintenanceMode /> : <RouterProvider router={router} />}
      </ToastProvider>
    </QueryClientProvider>
  )
}
