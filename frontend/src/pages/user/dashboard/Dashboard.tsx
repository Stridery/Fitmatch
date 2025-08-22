// src/components/Dashboard.tsx
import { useEffect, useState } from "react"
import { useNavigate, Outlet } from "react-router-dom"

import { Sidebar } from "./Sidebar"
import { UserHeader } from "./UserHeader"  
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";

function Dashboard() {
	const { user, loading } = useUser();
	const navigate = useNavigate();
	const [pageLoading, setPageLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const checkAuth = async () => {
			try {
				const { data: { session }, error } = await supabase.auth.getSession();
				if (!session || error) {
					if (isMounted) {
						setPageLoading(false);
						navigate("/login", { replace: true });
					}
					return;
				}
			} finally {
				if (isMounted) setPageLoading(false);
			}
		};
		checkAuth();
		return () => { isMounted = false };
	}, [navigate]);

	if (pageLoading || loading) return <p>Loading…</p>;
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