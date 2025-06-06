// src/components/Dashboard.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Sidebar } from "./Sidebar"
import { UserHeader } from "./UserHeader"  
import { StatsGrid } from "./StatsGrid"
import { parseJwt, isTokenExpired } from "../../utils/jwt"

function Dashboard() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState("")


  useEffect(() => {
    const token = localStorage.getItem("token")

    // 没有 token 或者过期，跳转登录页
    
    // 解析 token 获取 nickname
    if(token){
      const payload = parseJwt(token)
      setNickname(payload.nickname)
    }
    else{
      navigate("/login")
    }
    
    
  }, [navigate])


  return (
    <div className="flex h-screen">
      <Sidebar currentPage="Dashboard" />
      
      <main className="flex-1 p-6 overflow-auto">
        {/* 顶部欢迎栏 */}
        <UserHeader username={nickname} />

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