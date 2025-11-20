import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Pages
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import { AuthProvider, useAuth } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

function AppRoutes() {
  const auth = useAuth()

  return (
    <Routes>
      <Route
        path="/signup"
        element={
          <PublicRoute redirectTo="/dashboard">
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute redirectTo="/dashboard">
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <Landing
            user={auth.user}
            isManager={auth.isManager}
            isSupabaseConfigured={auth.supabaseReady}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function PublicRoute({ children, redirectTo }) {
  const { loading, user, supabaseReady } = useAuth()
  if (loading) return <LoadingScreen />
  if (!supabaseReady) return <SupabaseMissing />
  if (user) return <Navigate to={redirectTo} replace />
  return children
}

function ProtectedRoute({ children }) {
  const { loading, user, supabaseReady } = useAuth()
  if (loading) return <LoadingScreen />
  if (!supabaseReady) return <SupabaseMissing />
  if (!user) return <Navigate to="/login" replace />
  return children
}

const SupabaseMissing = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p style={{ marginTop: '1rem', color: '#ffffff', textAlign: 'center', maxWidth: 320 }}>
      Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.
    </p>
  </div>
)

const LoadingScreen = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
)

export default App
