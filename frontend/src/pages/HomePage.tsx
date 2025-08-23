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
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      {/* Header */}
      <header className="w-full bg-white shadow-sm border-b">
        <div className="w-full flex items-center justify-between px-6 py-4">
          <div
            className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer"
            onClick={() => navigate("/")}
          >
            FITMATCH
          </div>

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none bg-transparent hover:bg-transparent p-0">
                <Avatar className="w-8 h-8 border bg-transparent">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={username} />
                  ) : (
                    <AvatarFallback className="bg-gray-200 text-gray-500">
                      {username?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48 mt-2" align="end">
              {loading ? (
                <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
              ) : user ? (
                <>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    Personal Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/become-coach")}>
                    Become a Coach
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/manage-venue")}>
                    Manage a Venue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  Register/Login
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 顶部菜单栏 */}
        <nav className="w-full border-t border-gray-200 bg-white">
          <div className="flex justify-center gap-10 px-4 py-2 text-sm font-medium text-gray-600">
            <button onClick={() => navigate("/home/match")} className="text-gray-600 hover:text-blue-600">
              Match Coaches
            </button>
            <button onClick={() => navigate("/home/community")} className="text-gray-600 hover:text-blue-600">
              Community
            </button>
          </div>
        </nav>
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