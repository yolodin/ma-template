import { ProtectedRoute } from '@/components/protected-route';

function DashboardContent() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600">127</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Active Classes</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Today's Attendance</h3>
          <p className="text-3xl font-bold text-green-600">89</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">New Messages</h3>
          <p className="text-3xl font-bold text-red-600">3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Alex Johnson checked in for Advanced Taekwondo</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New student Emma Smith registered</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Class schedule updated for next week</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              Add New Student
            </button>
            <button className="w-full text-left p-3 rounded-md bg-blue-100 text-blue-900 hover:bg-blue-200 transition-colors">
              Schedule Class
            </button>
            <button className="w-full text-left p-3 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">
              View Attendance Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
} 