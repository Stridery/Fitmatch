import { useState } from "react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logout } from "@/api/auth";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useChatDockStore } from "@/pages/community/chatDock/store";
import { useCommunityStore } from "@/pages/community/store";

interface UserHeaderProps {
  username?: string;
  avatarUrl?: string;
}

export function UserHeader({ username = "Alex", avatarUrl }: UserHeaderProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { setUser } = useUser();       // 这里 user/loading 不一定要用到
  const navigate = useNavigate();
  const disconnectChatDock = useChatDockStore((s) => s.disconnectSocket);
  const disconnectCommunity = useCommunityStore((s) => s.disconnectSocket);

  return (
    <>
      <header className="flex justify-between items-center w-full mb-6">
        <h1 className="text-2xl font-semibold text-white">Welcome back, {username}!</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-800">
              <Avatar className="h-10 w-10 border border-gray-600">
                <AvatarImage src={avatarUrl || "/avatar.jpg"} alt="@user" />
                <AvatarFallback className="bg-gray-700 text-gray-300">{username.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
            <DropdownMenuLabel className="text-gray-300">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="text-gray-300 hover:bg-gray-700 hover:text-white">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")} className="text-gray-300 hover:bg-gray-700 hover:text-white">
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLogoutOpen(true)} className="text-gray-300 hover:bg-gray-700 hover:text-white">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Dialog 放在与 header 同级最稳；Radix 会用 Portal 挂到 body，不受层级影响 */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Logout</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Button
                className="px-4 py-2 rounded-md border border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                onClick={() => setLogoutOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="px-4 py-2 rounded-md bg-white text-black hover:bg-gray-100"
                onClick={async () => {
                  try { await supabase.auth.signOut(); } catch {}
                  try { await logout(); } catch {}
                  try { disconnectChatDock(); } catch {}
                  try { disconnectCommunity(); } catch {}
                  setUser(null);
                  setLogoutOpen(false);
                  navigate("/login", { replace: true });
                }}
              >
                Confirm Logout
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}