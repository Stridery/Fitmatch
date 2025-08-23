// components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

type Props = {
  requireAuth?: boolean;      // 是否强制登录（默认 true）
  requireProfile?: boolean;   // 仅在已登录时才检查资料（默认 true）
};

export default function RequireAuth({
  requireAuth = true,
  requireProfile = true,
}: Props) {
  const { user, loading } = useUser();
  const location = useLocation();

  // 访客可访问：直接放行（不跳转）
  if (!requireAuth) {
    if (requireProfile && user && !user.profile) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <Outlet />;
  }

  // 强制登录模式
  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (requireProfile && !user.profile) {
    return <Navigate to="/complete-profile" replace />;
  }
  return <Outlet />;
}