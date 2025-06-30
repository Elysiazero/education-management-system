export default function UserManagementLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* 标题骨架 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-64"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-300 rounded w-24"></div>
              <div className="h-10 bg-gray-300 rounded w-24"></div>
              <div className="h-10 bg-gray-300 rounded w-24"></div>
            </div>
          </div>

          {/* 统计卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 表格骨架 */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-48"></div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
