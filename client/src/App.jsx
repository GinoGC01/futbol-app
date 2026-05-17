import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'

import { Suspense, lazy } from 'react'

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
const TournamentArchitect = lazy(() => import('./pages/admin/TournamentArchitect'))
const RosterManager = lazy(() => import('./pages/admin/RosterManager'))
const MatchEdgeBox = lazy(() => import('./pages/admin/MatchEdgeBox'))
const AwardScrutinyTool = lazy(() => import('./pages/admin/AwardScrutinyTool'))
const PlayerManager = lazy(() => import('./pages/admin/PlayerManager'))
const LeagueSettings = lazy(() => import('./pages/admin/LeagueSettings'))
const ForgotPassword = lazy(() => import('./pages/admin/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/admin/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/admin/VerifyEmail'))

const Loadable = (Component) => (props) => (
  <Suspense fallback={<Loader fullScreen text="Cargando módulo..." />}>
    <Component {...props} />
  </Suspense>
)

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider> 
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
