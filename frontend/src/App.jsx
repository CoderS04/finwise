import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AccountManager from './pages/AccountManager'
import Dashboard from './pages/Dashboard'
import ExpenseTracker from './pages/ExpenseTracker'
import BudgetPlanner from './pages/BudgetPlanner'
import GoalPlanning from './pages/GoalPlanning'
import AiChat from './pages/AiChat'
import Auth from './pages/Auth'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [firstLoginNoAccounts, setFirstLoginNoAccounts] = useState(localStorage.getItem('first_login_no_accounts') === 'true')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check initial auth state
    const hasToken = !!localStorage.getItem('token')
    const isFirstLogin = localStorage.getItem('first_login_no_accounts') === 'true'
    setIsAuthenticated(hasToken)
    setFirstLoginNoAccounts(isFirstLogin && hasToken)
    setLoading(false)
  }, [])

  // Listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = () => {
      const hasToken = !!localStorage.getItem('token')
      const isFirstLogin = localStorage.getItem('first_login_no_accounts') === 'true'
      setIsAuthenticated(hasToken)
      setFirstLoginNoAccounts(isFirstLogin && hasToken)
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">Loading...</div>
  }

  return (
    <Router>
      {isAuthenticated ? (
        <div className="flex h-screen bg-gray-100">
          {/* Sidebar */}
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} setIsAuthenticated={setIsAuthenticated} />
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <Routes>
              {/* First-time login: redirect to accounts */}
              {firstLoginNoAccounts && <Route path="*" element={<Navigate to="/accounts" />} />}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<AccountManager setFirstLoginNoAccounts={setFirstLoginNoAccounts} />} />
              <Route path="/expenses" element={<ExpenseTracker />} />
              <Route path="/budget" element={<BudgetPlanner />} />
              <Route path="/goals" element={<GoalPlanning />} />
              <Route path="/chat" element={<AiChat />} />
              <Route path="/" element={<Navigate to={firstLoginNoAccounts ? "/accounts" : "/dashboard"} />} />
              <Route path="*" element={<Navigate to={firstLoginNoAccounts ? "/accounts" : "/dashboard"} />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Auth setIsAuthenticated={setIsAuthenticated} />
      )}
    </Router>
  )
}

export default App