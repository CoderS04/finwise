import { useEffect, useState } from 'react'
import { CreditCard, TrendingUp, Target, Wallet, PieChartIcon, TrendingDown, Sparkles, X } from 'lucide-react'
import Header from '../components/Header'
import QuickStats from '../components/QuickStats'
import RecentTransactions from '../components/RecentTransactions'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts'
import {
  getCategoryPie,
  getMonthlyTrend,
  getIncomeExpense,
  getSavingsRate
} from '../api/analyticsApi'
import { detectSavings } from '../api/savingsApi'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#C7CEEA', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B']

export default function Dashboard() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [incomeExpenseData, setIncomeExpenseData] = useState({ income: 0, expense: 0 })
  const [savingsData, setSavingsData] = useState({ savings: 0, savings_rate: 0 })
  const [loading, setLoading] = useState(true)
  const [showDetectModal, setShowDetectModal] = useState(false)
  const [detectMonth, setDetectMonth] = useState(today.getMonth() + 1)
  const [detectYear, setDetectYear] = useState(today.getFullYear())
  const [customSavings, setCustomSavings] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [detectMessage, setDetectMessage] = useState(null)

  useEffect(() => {
    loadAnalytics()
  }, [month, year])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [catPie, monthTrend, incExp, savings] = await Promise.all([
        getCategoryPie(month, year),
        getMonthlyTrend(year),
        getIncomeExpense(month, year),
        getSavingsRate(month, year)
      ])

      setCategoryData(catPie || [])
      setMonthlyData(monthTrend || [])
      setIncomeExpenseData(incExp || { income: 0, expense: 0 })
      setSavingsData(savings || { savings: 0, savings_rate: 0 })
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDetectSavings = async () => {
    if (!detectMonth || !detectYear) {
      setDetectMessage({ type: 'error', text: 'Please select a valid month and year.' })
      return
    }

    try {
      setDetecting(true)
      setDetectMessage(null)
      const result = await detectSavings(detectMonth, detectYear, customSavings)
      const saved = result?.savings?.amount_saved || 0
      const reason = result?.savings?.reason || 'inferred'
      setDetectMessage({
        type: 'success',
        text: `Detected savings: ₹${saved.toLocaleString('en-IN')} (${reason})`
      })
      await loadAnalytics()
    } catch (err) {
      console.error('Savings detection failed:', err)
      setDetectMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to detect savings. Please try again.'
      })
    } finally {
      setDetecting(false)
    }
  }

  const stats = [
    {
      label: 'Total Income',
      value: `₹${incomeExpenseData.income.toLocaleString('en-IN')}`,
      icon: CreditCard,
      color: 'bg-green-500',
      change: 'This month'
    },
    {
      label: 'Total Expense',
      value: `₹${incomeExpenseData.expense.toLocaleString('en-IN')}`,
      icon: TrendingDown,
      color: 'bg-red-500',
      change: 'This month'
    },
    {
      label: 'Savings',
      value: `₹${savingsData.savings.toLocaleString('en-IN')}`,
      icon: Wallet,
      color: 'bg-blue-500',
      change: `${savingsData.savings_rate.toFixed(1)}% rate`
    },
    {
      label: 'Categories',
      value: categoryData.length,
      icon: PieChartIcon,
      color: 'bg-purple-500',
      change: 'Active spending'
    }
  ]

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthOptions = monthNames.map((label, index) => ({
    value: index + 1,
    label
  }))
  const formattedMonthlyData = monthlyData.map(item => ({
    month: monthNames[item.month - 1],
    amount: item.amount
  }))

  const incomeExpenseChartData = [
    { name: 'Income', value: incomeExpenseData.income, color: '#10B981' },
    { name: 'Expense', value: incomeExpenseData.expense, color: '#EF4444' }
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Header title="Dashboard" subtitle="Welcome back! Here's your financial overview." />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">Viewing</div>
          <div className="text-lg font-semibold text-gray-800">
            {monthNames[month - 1]} {year}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowDetectModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles size={18} />
            Detect Savings
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <QuickStats key={index} stat={stat} />
        ))}
      </div>

      {showDetectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Detect Savings</h2>
              <button
                onClick={() => {
                  setShowDetectModal(false)
                  setDetectMessage(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                <select
                  value={detectMonth}
                  onChange={(e) => setDetectMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={detectYear}
                  onChange={(e) => setDetectYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Savings Amount (optional)</label>
              <input
                type="number"
                value={customSavings}
                onChange={(e) => setCustomSavings(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {detectMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                detectMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {detectMessage.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDetectSavings}
                disabled={detecting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                {detecting ? 'Detecting...' : 'Detect Savings'}
              </button>
              <button
                onClick={() => {
                  setShowDetectModal(false)
                  setDetectMessage(null)
                }}
                disabled={detecting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1: Category Pie & Income vs Expense */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No spending data for this month
            </div>
          )}
        </div>

        {/* Income vs Expense */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Income vs Expense</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeExpenseChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {incomeExpenseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Income</p>
              <p className="text-xl font-bold text-green-600">₹{incomeExpenseData.income.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">Expense</p>
              <p className="text-xl font-bold text-red-600">₹{incomeExpenseData.expense.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Monthly Trend & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Spending Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Spending Trend ({year})</h3>
          {formattedMonthlyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#45B7D1" 
                    strokeWidth={3}
                    dot={{ fill: '#45B7D1', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              No trend data available
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Transactions</h3>
          <RecentTransactions />
        </div>
      </div>
    </div>
  )
}
