import React from "react"
import { cn } from "@/lib/utils" // 用于 className 合并，如果你用到了 shadcn 的 cn 函数

const navItems = [
  { label: "Schedule", icon: "📅" },
  { label: "Messages", icon: "💬" },
  { label: "Posts", icon: "📝" },
  { label: "Settings", icon: "⚙️" },
]

interface SidebarProps {
  currentPage?: string
  onNavigate?: (page: string) => void
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-900 text-white h-full flex flex-col p-6 space-y-8">
      <div className="text-2xl font-bold tracking-tight">🏋️ FitMatch</div>
      <div className="px-6 pt-2 pb-4">
        <h2 className="text-xl font-semibold text-gray-300">Dashboard</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate?.(item.label)}
            className={cn(
              "flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition-colors",
              currentPage === item.label && "bg-gray-800 font-semibold"
            )}
          >
            <span className="mr-2 text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}