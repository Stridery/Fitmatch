// src/components/Dashboard.tsx
import { useEffect, useState } from "react"
import { useNavigate, Outlet } from "react-router-dom"

import { Sidebar } from "./Sidebar"
import { UserHeader } from "./UserHeader"  
import { parseJwt, isTokenExpired } from "../../../utils/Jwt"

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
      <Sidebar/>
      
      <main className="flex-1 p-6 overflow-auto">
        {/* 顶部欢迎栏 */}
        <UserHeader username={nickname} />
        <Outlet />
      </main>
    </div>
  )
}

export default Dashboard