import { useEffect, useState } from 'react'
import { CreditCard, TrendingUp, Target, Wallet, PieChartIcon, TrendingDown } from 'lucide-react'
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

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#C7CEEA', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B']

export default function Dashboard() {
  const today = new Date()
  const [month] = useState(today.getMonth() + 1)
  const [year] = useState(today.getFullYear())
  
  const [categoryData, setCategoryData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [incomeExpenseData, setIncomeExpenseData] = useState({ income: 0, expense: 0 })
  const [savingsData, setSavingsData] = useState({ savings: 0, savings_rate: 0 })
  const [loading, setLoading] = useState(true)

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <QuickStats key={index} stat={stat} />
        ))}
      </div>

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
