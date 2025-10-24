import React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "My Schedule", icon: "📋", path: "/dashboard/my-schedule" },
  { label: "Messages", icon: "💬", path: "/dashboard/messages" },
  { label: "Posts", icon: "📝", path: "/dashboard/posts" },
  { label: "Coach Center", icon: "🎓", path: "/coach" },
  { label: "Settings", icon: "⚙️", path: "/dashboard/settings" },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 bg-gray-900 text-white h-full flex flex-col p-6 space-y-8">
      <div className="text-2xl font-bold tracking-tight">SportaX</div>
      <div className="px-6 pt-2 pb-4">
        <h2 className="text-xl font-semibold text-gray-300">Dashboard</h2>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              "flex items-center px-4 py-2 rounded-md hover:bg-gray-800 transition-colors",
              location.pathname === item.path && "bg-gray-800 font-semibold"
            )}
          >
            <span className="mr-2 text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}