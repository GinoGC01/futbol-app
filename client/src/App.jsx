import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'

// Public Pages
import Home from './pages/public/Home'
import LeagueExplorer from './pages/public/LeagueExplorer'
import LeagueArena from './pages/public/LeagueArena'
import TeamProfile from './pages/public/TeamProfile'
import PlayerProfile from './pages/public/PlayerProfile'
import Omnisearch from './components/ui/Omnisearch'
import NotFound from './pages/public/NotFound'
import Terms from './pages/public/Terms'
import Privacy from './pages/public/Privacy'
import Support from './pages/public/Support'

// Admin Pages
import Login from './pages/admin/Login'
import Register from './pages/admin/Register'
import AdminLayout from './layouts/AdminLayout'
import DashboardHome from './pages/admin/DashboardHome'
import TournamentArchitect from './pages/admin/TournamentArchitect'
import RosterManager from './pages/admin/RosterManager'
import MatchEdgeBox from './pages/admin/MatchEdgeBox'
import AwardScrutinyTool from './pages/admin/AwardScrutinyTool'
import PlayerManager from './pages/admin/PlayerManager'
import LeagueSettings from './pages/admin/LeagueSettings'
import ForgotPassword from './pages/admin/ForgotPassword'
import ResetPassword from './pages/admin/ResetPassword'
import VerifyEmail from './pages/admin/VerifyEmail'
import WaitlistScreen from './pages/admin/WaitlistScreen'
import SuspendedScreen from './pages/admin/SuspendedScreen'
import Loader from './components/ui/Loader'
import PublicLayout from './layouts/PublicLayout'

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
      { path: "admin/login", element: <Login /> },
      { path: "admin/register", element: <Register /> },
      { path: "admin/forgot-password", element: <ForgotPassword /> },
      { path: "admin/reset-password", element: <ResetPassword /> },
      { path: "admin/verify", element: <VerifyEmail /> },
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
      { path: "*", element: <NotFound /> }
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
