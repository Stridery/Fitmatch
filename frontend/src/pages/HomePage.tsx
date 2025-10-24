// src/pages/HomePage.tsx
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, Outlet } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { logout } from "@/api/auth";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const { user, loading, setUser } = useUser();     // ✅ 用全局 UserContext
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const username = user?.profile?.nickname || user?.email || "Guest";
  const avatarUrl = ""; // 如果将来 profile 里有头像字段，替换这里

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white w-full">
      {/* Dark Header */}
      <header className="w-full bg-black/95 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-50 shadow-lg">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <div
            className="text-lg sm:text-xl font-bold text-white tracking-wider cursor-pointer hover:text-gray-300 transition-colors duration-200"
            onClick={() => navigate("/")}
          >
            SportaX
          </div>
          
          {/* Center Navigation */}
          <nav className="flex gap-6 sm:gap-8 text-sm font-medium text-gray-300">
            <button onClick={() => navigate("/home/match")} className="hover:text-white transition-colors duration-200 hover:scale-105 transform">
              Match Coaches
            </button>
            <button onClick={() => navigate("/home/community")} className="hover:text-white transition-colors duration-200 hover:scale-105 transform">
              Community
            </button>
          </nav>
          
          {/* Right User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none bg-transparent hover:bg-transparent p-0">
                <Avatar className="w-8 h-8 border border-gray-600 bg-gray-700">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={username} />
                  ) : (
                    <AvatarFallback className="bg-gray-600 text-gray-300">
                      {username?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48 mt-2 bg-gray-800 border-gray-700" align="end">
              {loading ? (
                <DropdownMenuItem disabled className="text-gray-400">Loading…</DropdownMenuItem>
              ) : user ? (
                <>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    Personal Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/coach-application")} className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    Become a Coach
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/manage-venue")} className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    Manage a Venue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLogoutOpen(true)} className="text-gray-300 hover:bg-gray-700 hover:text-white">
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/login")} className="text-gray-300 hover:bg-gray-700 hover:text-white">
                  Register/Login
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="px-6 pt-10">
        <Outlet />
      </main>

      {/* Logout 确认弹窗 */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-black"
                onClick={() => setLogoutOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-blue-300 text-white"
                onClick={async () => {
                  try {
                    // 1) 失效 Supabase 会话（清除 sb-*-auth-token）
                    await supabase.auth.signOut();
                  } catch {}
                  try {
                    // 2) 你的后端登出（如需清 Cookie/Session）
                    await logout();
                  } catch {}
                  // 3) 立刻刷新全局状态与路由
                  setUser(null);
                  setLogoutOpen(false);
                  navigate("/login", { replace: true });
                }}
              >
                Confirm Logout
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}