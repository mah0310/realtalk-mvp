import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import GroupSelect from './pages/GroupSelect'
import Dashboard from './pages/Dashboard'

function AppContent() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            RealTalk
          </h1>
          <p className="text-gray-400 mt-2">読み込み中...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <AuthPage />
  }

  // Logged in but no group selected
  if (!profile?.group_id) {
    return <GroupSelect />
  }

  // Logged in and has group
  return <Dashboard />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
