export default function QuickStats({ stat }) {
  const Icon = stat.icon

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${stat.color} p-3 rounded-lg`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
      
      <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
      <p className="text-2xl font-bold text-gray-800 mb-2">{stat.value}</p>
      <p className="text-xs text-gray-500">{stat.change}</p>
    </div>
  )
}
