import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

export default function RequireAuth({
  requireProfile = true,
}: {
  requireProfile?: boolean;
}) {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }
  //console.log("user: ", user);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireProfile && !user.profile) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
}