import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, Outlet } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  useEffect(() => {
    // 可以在这里做一些首页加载逻辑
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (e) {
      // already logged
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      {/* ✅ Header */}
      <header className="w-full bg-white shadow-sm border-b">
        <div className="w-full flex items-center justify-between px-6 py-4">
          <div
            className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer"
            onClick={() => navigate("/")}
          >
            FITMATCH
          </div>

          {/* ✅ 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none bg-transparent hover:bg-transparent p-0">
                <Avatar className="w-8 h-8 border bg-transparent">
                  {user?.profile?.avatarUrl ? (
                    <AvatarImage src={user.profile.avatarUrl} alt={user.email} />
                  ) : (
                    <AvatarFallback className="bg-gray-200 text-gray-500">?
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            {/* ✅ 登录后才显示下拉菜单内容 */}
            <DropdownMenuContent className="w-48 mt-2" align="end">
              {user ? (
                <>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    Personal Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/coach-application")}>
                    Become a Coach
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/manage-venue")}>
                    Manage a Venue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => navigate("/login")}>
                    Register/Login
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ✅ 顶部菜单栏 */}
        <nav className="w-full border-t border-gray-200 bg-white">
          <div className="flex justify-center gap-10 px-4 py-2 text-sm font-medium text-gray-600">
            <button onClick={() => navigate("/home/match")} className="text-gray-600 hover:text-blue-600">
              Match Coaches
            </button>
            <button onClick={() => navigate("/home/community")} className="text-gray-600 hover:text-blue-600">Community</button>
          </div>
        </nav>
      </header>

      {/* ✅ 页面主体内容 */}
      <main className="px-6 pt-10">
        <Outlet />
      </main>
    </div>
  );
}