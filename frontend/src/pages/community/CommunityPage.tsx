import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import EventListPage from "../events/EventListPage";
import SeriesListPage from "../events/SeriesListPage";
import { useCommunityStore } from "./store";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  const currentTab = useCommunityStore((s) => s.currentTab);
  const setCurrentTab = useCommunityStore((s) => s.setCurrentTab);
  const ensureSocket = useCommunityStore((s) => s.ensureSocket);
  const setCurrentUserId = useCommunityStore((s) => s.setCurrentUserId);
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If we're on an events route, set tab to events
    if (location.pathname.startsWith('/home/community/events')) {
      setCurrentTab("events");
    } else if (location.pathname.startsWith('/home/community/series')) {
      setCurrentTab("series");
    } else if (location.pathname === '/home/community') {
      // Default to events tab when on community page
      setCurrentTab("events");
      navigate('/home/community/events', { replace: true });
    } else if (currentTab === "events" && !location.pathname.startsWith('/home/community/events')) {
      // If tab is events but we're not on events route, navigate to events
      navigate('/home/community/events', { replace: true });
    } else if (currentTab === "series" && !location.pathname.startsWith('/home/community/series')) {
      // If tab is series but we're not on series route, navigate to series
      navigate('/home/community/series', { replace: true });
    }
  }, [location.pathname, currentTab, setCurrentTab, navigate]);

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      ensureSocket();
    }
  }, [user?.id, ensureSocket, setCurrentUserId]);

  const handleTabChange = (tab: "events" | "series") => {
    setCurrentTab(tab);
    if (tab === "events") {
      navigate("/home/community/events");
    } else if (tab === "series") {
      navigate("/home/community/series");
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-semibold">Community</div>
        <div className="hidden lg:block" />
      </div>
      
      {/* Tab Navigation Bar */}
      <div className="mb-4 flex gap-2 border-b border-gray-700">
        <Button
          variant={currentTab === "events" ? "default" : "ghost"}
          onClick={() => handleTabChange("events")}
          className={`${
            currentTab === "events"
              ? "bg-blue-600 hover:bg-blue-700 text-white border-b-2 border-blue-600"
              : "text-gray-300 hover:text-white hover:bg-gray-800"
          } rounded-b-none`}
        >
          Events
        </Button>
        <Button
          variant={currentTab === "series" ? "default" : "ghost"}
          onClick={() => handleTabChange("series")}
          className={`${
            currentTab === "series"
              ? "bg-blue-600 hover:bg-blue-700 text-white border-b-2 border-blue-600"
              : "text-gray-300 hover:text-white hover:bg-gray-800"
          } rounded-b-none`}
        >
          Series
        </Button>
      </div>

      {/* Tab Content */}
      {location.pathname.startsWith('/home/community/events') ? (
        <Outlet />
      ) : location.pathname.startsWith('/home/community/series') ? (
        <Outlet />
      ) : (
        <>
          {currentTab === "events" && <EventListPage />}
          {currentTab === "series" && <SeriesListPage />}
        </>
      )}
    </div>
  );
}

