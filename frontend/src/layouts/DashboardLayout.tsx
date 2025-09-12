import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/pages/user/dashboard/Sidebar'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Fixed left sidebar */}
      <aside className="w-64 shrink-0 border-r bg-white sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Scrollable right content */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

