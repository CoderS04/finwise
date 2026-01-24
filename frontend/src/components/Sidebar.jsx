import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Home, TrendingDown, PieChart, Target, MessageCircle, LogOut } from 'lucide-react'

export default function Sidebar({ open, setOpen, setIsAuthenticated }) {
  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Transactions', icon: TrendingDown, path: '/expenses' },
    { name: 'Budget', icon: PieChart, path: '/budget' },
    { name: 'Goals', icon: Target, path: '/goals' },
    { name: 'AI Chat', icon: MessageCircle, path: '/chat' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          open ? 'w-64' : 'w-0'
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden lg:w-64 flex flex-col`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-400">FinWise</h1>
          <p className="text-sm text-gray-400">Your Finance Assistant</p>
        </div>

        <nav className="mt-10 px-4 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 mb-2 text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200"
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 font-semibold"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  )
}
