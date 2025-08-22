// src/components/Dashboard.tsx
import { useEffect, useState } from "react"
import { useNavigate, Outlet } from "react-router-dom"

import { Sidebar } from "./Sidebar"
import { UserHeader } from "./UserHeader"  
import { useUser } from "@/contexts/UserContext";

function Dashboard() {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) return <p>Loading…</p>;
  if (!user) return null;

  return (
    <div className="flex h-screen">
      <Sidebar/>
      
      <main className="flex-1 p-6 overflow-auto">
        {/* 顶部欢迎栏 */}
        <UserHeader username={user.profile?.nickname || ""} />
        <Outlet />
      </main>
    </div>
  )
}

export default Dashboard