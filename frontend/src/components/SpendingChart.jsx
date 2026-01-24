import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'

export default function SpendingChart() {
  const categoryData = [
    { name: 'Food & Dining', value: 3500, color: '#FF6B6B' },
    { name: 'Shopping', value: 2800, color: '#4ECDC4' },
    { name: 'Travel', value: 2000, color: '#45B7D1' },
    { name: 'Entertainment', value: 1500, color: '#FFA07A' },
    { name: 'Utilities', value: 1200, color: '#98D8C8' },
    { name: 'Other', value: 1340, color: '#C7CEEA' },
  ]

  const weeklyData = [
    { day: 'Mon', amount: 1200 },
    { day: 'Tue', amount: 1500 },
    { day: 'Wed', amount: 1100 },
    { day: 'Thu', amount: 1800 },
    { day: 'Fri', amount: 2100 },
    { day: 'Sat', amount: 2300 },
    { day: 'Sun', amount: 1340 },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-800">Spending Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Bar dataKey="amount" fill="#45B7D1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {categoryData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
            <span className="text-sm text-gray-700">{item.name}: ₹{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
