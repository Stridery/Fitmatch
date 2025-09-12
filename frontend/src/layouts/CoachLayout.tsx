import { Outlet, NavLink } from 'react-router-dom'

export default function CoachLayout() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Coach Center</h1>
        <nav className="flex gap-3 text-sm">
          <NavLink to="/dashboard/coach" className={({ isActive }) => isActive ? 'font-medium' : 'text-muted-foreground'}>
            Overview
          </NavLink>
          <NavLink to="/dashboard/coach/sports/new" className={({ isActive }) => isActive ? 'font-medium' : 'text-muted-foreground'}>
            New Sport
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  )
}

