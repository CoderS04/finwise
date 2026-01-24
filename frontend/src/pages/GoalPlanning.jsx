import { useState } from 'react'
import { Plus, Target, Trash2 } from 'lucide-react'
import Header from '../components/Header'

export default function GoalPlanning() {
  const [goals, setGoals] = useState([
    { id: 1, name: 'Goa Vacation', target: 50000, saved: 30000, deadline: '2024-12-20', icon: '✈️', priority: 'High' },
    { id: 2, name: 'New Laptop', target: 100000, saved: 45000, deadline: '2024-06-30', icon: '💻', priority: 'Medium' },
    { id: 3, name: 'Emergency Fund', target: 200000, saved: 85000, deadline: '2025-12-31', icon: '🛡️', priority: 'High' },
    { id: 4, name: 'Bike Purchase', target: 300000, saved: 120000, deadline: '2025-06-15', icon: '🏍️', priority: 'Low' },
  ])

  const getProgressPercentage = (saved, target) => {
    return Math.round((saved / target) * 100)
  }

  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'bg-red-500'
    if (percentage < 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const calculateDaysLeft = (deadline) => {
    const today = new Date()
    const targetDate = new Date(deadline)
    const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const calculateMonthlySaving = (target, saved, deadline) => {
    const remaining = target - saved
    const daysLeft = calculateDaysLeft(deadline)
    const monthsLeft = Math.ceil(daysLeft / 30)
    return Math.round(remaining / monthsLeft)
  }

  const totalGoals = goals.length
  const completedGoals = goals.filter(g => getProgressPercentage(g.saved, g.target) >= 100).length
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0)

  return (
    <div className="p-6 lg:p-8">
      <Header title="Goal Planning" subtitle="Set and track your financial goals" />

      {/* Goals Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">Total Goals</p>
          <p className="text-3xl font-bold text-blue-600">{totalGoals}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">Achieved</p>
          <p className="text-3xl font-bold text-green-600">{completedGoals}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">Total Target</p>
          <p className="text-3xl font-bold text-purple-600">₹{totalTarget.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">Total Saved</p>
          <p className="text-3xl font-bold text-green-600">₹{totalSaved.toLocaleString()}</p>
        </div>
      </div>

      {/* Add Goal Button */}
      <div className="mb-6">
        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
          <Plus size={20} /> Create New Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        {goals.map(goal => {
          const percentage = getProgressPercentage(goal.saved, goal.target)
          const remaining = goal.target - goal.saved
          const daysLeft = calculateDaysLeft(goal.deadline)
          const monthlySaving = calculateMonthlySaving(goal.target, goal.saved, goal.deadline)

          return (
            <div key={goal.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{goal.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-800">{goal.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        goal.priority === 'High' ? 'bg-red-100 text-red-800' :
                        goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {goal.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Due: {goal.deadline}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Progress Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-gray-600 text-sm">Target</p>
                  <p className="text-lg font-bold text-gray-800">₹{goal.target.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Saved</p>
                  <p className="text-lg font-bold text-green-600">₹{goal.saved.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Remaining</p>
                  <p className="text-lg font-bold text-orange-600">₹{remaining.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Monthly Saving</p>
                  <p className="text-lg font-bold text-blue-600">₹{monthlySaving.toLocaleString()}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">{percentage}% Complete</span>
                  <span className="text-sm text-gray-500">{daysLeft} days left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(percentage)} transition-all duration-300`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Recommendation */}
              {percentage < 100 ? (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                  <Target size={16} />
                  Save ₹{monthlySaving}/month to reach your goal on time
                </div>
              ) : (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-semibold">
                  ✨ Goal Achieved! {remaining < 0 ? `₹${Math.abs(remaining)} extra saved!` : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
