import { useState, useEffect } from 'react'
import { Plus, Target, Trash2 } from 'lucide-react'
import Header from '../components/Header'
import { getGoals, createGoal, deleteGoal } from '../api/goalsApi'

export default function GoalPlanning() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: '',
    goal_type: '',
    priority: '',
    target_amount: 0,
    target_date: ''
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const data = await getGoals()
      setGoals(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
      setError('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    try {
      if (!newGoal.name || !newGoal.target_amount || !newGoal.target_date) {
        alert('Please fill in all required fields')
        return
      }
      await createGoal(newGoal)
      setNewGoal({
        name: '',
        goal_type: '',
        priority: '',
        target_amount: 0,
        target_date: ''
      })
      setShowCreateModal(false)
      await fetchGoals()
    } catch (err) {
      console.error('Failed to create goal:', err)
      setError('Failed to create goal')
    }
  }

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goalId)
        await fetchGoals()
      } catch (err) {
        console.error('Failed to delete goal:', err)
        setError('Failed to delete goal')
      }
    }
  }

  const getProgressPercentage = (currentAmount, targetAmount) => {
    return Math.round((currentAmount / targetAmount) * 100)
  }

  const getProgressColor = (percentage) => {
    if (percentage < 30) return 'bg-red-500'
    if (percentage < 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const calculateDaysLeft = (targetDate) => {
    const today = new Date()
    const deadline = new Date(targetDate)
    const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const calculateMonthlySaving = (targetAmount, currentAmount, targetDate) => {
    const remaining = targetAmount - currentAmount
    const daysLeft = calculateDaysLeft(targetDate)
    const monthsLeft = Math.ceil(daysLeft / 30)
    return monthsLeft > 0 ? Math.round(remaining / monthsLeft) : 0
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Header title="Goal Planning" subtitle="Set and track your financial goals" />
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500 text-lg">Loading goals...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Header title="Goal Planning" subtitle="Set and track your financial goals" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  const totalGoals = goals.length
  const completedGoals = goals.filter(g => g.is_completed).length
  const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0)
  const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0)

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
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
          <Plus size={20} /> Create New Goal
        </button>
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Goal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Goal Name *</label>
                <input 
                  type="text" 
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Vacation"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Goal Type</label>
                <select 
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal({...newGoal, goal_type: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Type</option>
                  <option value="savings">Savings</option>
                  <option value="travel">Travel</option>
                  <option value="emergency">Emergency</option>
                  <option value="purchase">Purchase</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <select 
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Amount (₹) *</label>
                <input 
                  type="number" 
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({...newGoal, target_amount: parseFloat(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Date *</label>
                <input 
                  type="date" 
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleCreateGoal}
                  className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Create Goal
                </button>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No goals yet. Create your first goal to get started!</p>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-6">
        {goals.map(goal => {
          const percentage = getProgressPercentage(goal.current_amount || 0, goal.target_amount)
          const remaining = goal.target_amount - (goal.current_amount || 0)
          const daysLeft = calculateDaysLeft(goal.target_date)
          const monthlySaving = calculateMonthlySaving(goal.target_amount, goal.current_amount || 0, goal.target_date)

          return (
            <div key={goal.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-800">{goal.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                        goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {goal.priority?.charAt(0).toUpperCase() + goal.priority?.slice(1)} Priority
                      </span>
                      {goal.goal_type && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          {goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Due: {new Date(goal.target_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Progress Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-gray-600 text-sm">Target</p>
                  <p className="text-lg font-bold text-gray-800">₹{goal.target_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Saved</p>
                  <p className="text-lg font-bold text-green-600">₹{(goal.current_amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Remaining</p>
                  <p className="text-lg font-bold text-orange-600">₹{Math.max(remaining, 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Monthly Saving</p>
                  <p className="text-lg font-bold text-blue-600">₹{monthlySaving.toLocaleString()}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">{Math.min(percentage, 100)}% Complete</span>
                  <span className="text-sm text-gray-500">{Math.max(daysLeft, 0)} days left</span>
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
