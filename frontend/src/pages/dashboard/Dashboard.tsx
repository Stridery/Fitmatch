// src/components/Dashboard.tsx
import { Sidebar } from "./Sidebar"
import { UserHeader } from "./UserHeader"  
import { StatsGrid } from "./StatsGrid"

function Dashboard() {
  return (
    <div className="flex h-screen">
      <Sidebar currentPage="Dashboard" />
      
      <main className="flex-1 p-6 overflow-auto">
        {/* 顶部欢迎栏 */}
        <UserHeader username="Alex" />

        <StatsGrid />
        <div className="mt-6">
          {/* Placeholder for StatsGrid, Chart, etc */}
          <p className="text-gray-500">Dashboard content goes here...</p>
        </div>
      </main>
    </div>
  )
}

export default Dashboard