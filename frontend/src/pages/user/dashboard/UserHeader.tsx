import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"
import { useNavigate } from "react-router-dom"

interface UserHeaderProps {
  username?: string
  avatarUrl?: string
}

export function UserHeader({ username = "Alex", avatarUrl }: UserHeaderProps) {
  const { logout } = useUser()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (e) {
      // no-op: errors already logged in context
    }
  }

  return (
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
          <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}