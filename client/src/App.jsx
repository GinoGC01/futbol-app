import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'

// Public Pages
import Home from './pages/public/Home'
import LeagueArena from './pages/public/LeagueArena'

// Admin Pages
import Login from './pages/admin/Login'
import Register from './pages/admin/Register'
import AdminLayout from './layouts/AdminLayout'
import DashboardHome from './pages/admin/DashboardHome'
import TournamentArchitect from './pages/admin/TournamentArchitect'
import RosterManager from './pages/admin/RosterManager'
import MatchEdgeBox from './pages/admin/MatchEdgeBox'
import AwardScrutinyTool from './pages/admin/AwardScrutinyTool'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  }
})

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/liga/:slug" element={<LeagueArena />} />

          {/* Auth Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/register" element={<Register />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardHome />} />
            <Route path="torneo" element={<TournamentArchitect />} />
            <Route path="roster" element={<RosterManager />} />
            <Route path="partidos" element={<MatchEdgeBox />} />
            <Route path="premios" element={<AwardScrutinyTool />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
