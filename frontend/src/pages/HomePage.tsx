import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, Link, Outlet } from "react-router-dom";

interface Coach {
  id: number;
  name: string;
  rating: number;
  price: string;
  location: string;
  image: string;
  tag: string;
}

interface Category {
  name: string;
  coaches: Coach[];
}

interface User {
  name: string;
  avatar: string;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sports, setSports] = useState<{ id: number; name: string }[]>([]);
  const [location, setLocation] = useState("");
  const [sport, setSport] = useState("");
  const [gender, setGender] = useState("any");
  const [user, setUser] = useState<User | null>(null); // 登录用户状态
  const navigate = useNavigate();

  const inputStyle =
    "h-10 px-3 py-2 border border-input rounded-md text-foreground bg-white hover:border-hover hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200";

  useEffect(() => {
    fetch("/api/sports")
      .then((res) => res.json())
      .then((data) => setSports(data))
      .catch((err) => console.error("加载运动项目失败", err));
  }, []);

  useEffect(() => {
    fetch("/api/coach/popular")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch((err) => console.error("加载热门教练失败", err));
  }, []);

  useEffect(() => {

    // 实际登录接口
    fetch("/api/me", { credentials: "include" })
       .then((res) => res.ok ? res.json() : null)
       .then((data) => setUser(data))
       .catch(() => setUser(null));
  }, []);

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
                  {user?.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : (
                    <AvatarFallback className="bg-gray-200 text-gray-500">
                      ?
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
                <DropdownMenuItem onClick={() => navigate("/become-coach")}>
                  Become a Coach
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/manage-venue")}>
                  Manage a Venue
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
            <button onClick={() => navigate("/match")} className="text-gray-600 hover:text-blue-600">
              Match Coaches
            </button>
            <button onClick={() => navigate("/chat")} className="text-gray-600 hover:text-blue-600">
              Messages
            </button>
            <button onClick={() => navigate("/community")} className="text-gray-600 hover:text-blue-600">
              Community
            </button>
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