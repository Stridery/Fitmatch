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
        <h1 className="text-2xl font-semibold">Welcome back, {username}!</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl || "/avatar.jpg"} alt="@user" />
                <AvatarFallback>{username.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Dialog 放在与 header 同级最稳；Radix 会用 Portal 挂到 body，不受层级影响 */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Button
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-black"
                onClick={() => setLogoutOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="px-4 py-2 rounded-md bg-blue-300 text-white"
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