import { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import Header from '../components/Header'

export default function BudgetPlanner() {
  const [budgets, setBudgets] = useState([
    { id: 1, category: 'Food & Dining', budget: 5000, spent: 3500, icon: '🍔' },
    { id: 2, category: 'Travel', budget: 4000, spent: 2250, icon: '🚗' },
    { id: 3, category: 'Shopping', budget: 6000, spent: 4200, icon: '🛍️' },
    { id: 4, category: 'Entertainment', budget: 3000, spent: 1800, icon: '🎬' },
    { id: 5, category: 'Utilities', budget: 2000, spent: 1850, icon: '⚡' },
  ])

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent

  const getProgressColor = (percentage) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    if (percentage < 100) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getPercentage = (spent, budget) => {
    return Math.round((spent / budget) * 100)
  }

  return (
    <div className="p-6 lg:p-8">
      <Header title="Budget Planner" subtitle="Set and manage your monthly budgets" />

      {/* Overall Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm mb-2">Total Budget</p>
          <p className="text-3xl font-bold text-blue-600">₹{totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm mb-2">Total Spent</p>
          <p className="text-3xl font-bold text-red-600">₹{totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm mb-2">Remaining</p>
          <p className="text-3xl font-bold text-green-600">₹{totalRemaining.toLocaleString()}</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Overall Progress</h3>
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full ${getProgressColor((totalSpent / totalBudget) * 100)} transition-all duration-300`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{getPercentage(totalSpent, totalBudget)}% spent</span>
            <span>₹{totalRemaining} remaining</span>
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Category Budgets</h3>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={18} /> Add Budget
          </button>
        </div>

        {budgets.map(budget => {
          const percentage = getPercentage(budget.spent, budget.budget)
          const remaining = budget.budget - budget.spent
          
          return (
            <div key={budget.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{budget.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">{budget.category}</h4>
                    <p className="text-sm text-gray-500">
                      ₹{budget.spent.toLocaleString()} / ₹{budget.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600">
                    <Edit2 size={18} />
                  </button>
                  <button className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(percentage)} transition-all duration-300`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`font-semibold ${percentage > 100 ? 'text-red-600' : 'text-gray-700'}`}>
                    {percentage}% spent
                  </span>
                  <span className={percentage > 100 ? 'text-red-600' : 'text-green-600'}>
                    {percentage > 100 
                      ? `₹${Math.abs(remaining)} over budget`
                      : `₹${remaining} remaining`
                    }
                  </span>
                </div>
              </div>

              {/* Alert if overspent */}
              {percentage > 100 && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  ⚠️ You've exceeded your budget for this category!
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
