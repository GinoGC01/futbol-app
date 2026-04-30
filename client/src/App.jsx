import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Loader from './components/ui/Loader'

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
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider> 
        <BrowserRouter>
        <Omnisearch />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/ligas" element={<LeagueExplorer />} />
          <Route path="/liga/:slug" element={<LeagueArena />} />
          <Route path="/equipo/:id" element={<TeamProfile />} />
          <Route path="/jugador/:id" element={<PlayerProfile />} />

          {/* Auth Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />
          <Route path="/admin/verify" element={<VerifyEmail />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="torneo" element={<TournamentArchitect />} />
            <Route path="roster" element={<RosterManager />} />
            <Route path="jugadores" element={<PlayerManager />} />
            <Route path="partidos" element={<MatchEdgeBox />} />
            <Route path="premios" element={<AwardScrutinyTool />} />
            <Route path="settings" element={<LeagueSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
