import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import AvatarUploader from "../AvatarUploader"
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

const countries = [
  "United States", "Canada", "China", "Japan", "Germany", "France",
  "Australia", "United Kingdom"
]

function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

type Props = {
  profile: {
    avatarUrl?: string
    nickname: string
    phone: string
    isFor: string
    gender: string
    birthday: string
    country: string
    city: string
    mbtiType: string
    // isCoach and isVenue are handled by backend logic, not part of the form
  }
  setProfile: (val: any) => void
  setAvatarFile: (file: File | null) => void
}

const BasicInfo: React.FC<Props> = ({
  profile,
  setProfile,
  setAvatarFile,
}) => {
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    profile.birthday ? new Date(profile.birthday) : undefined
  )

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Basic Information</h2>

      <Label className="block text-sm font-medium">Upload your avatar</Label>
      <AvatarUploader
        onFileSelect={(file) => setAvatarFile(file)}
      />

      {/* Nickname */}
      <div className="space-y-2">
        <Label htmlFor="nickname">Nickname</Label>
        <Input
          id="nickname"
          value={profile.nickname}
          onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
          placeholder="Your nickname"
          required
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          placeholder="e.g. +1 555 123 4567"
          pattern="^\+?[0-9\s\-]{7,15}$"
          autoComplete="tel"
          required
        />
      </div>

      {/* isFor */}
      <div className="space-y-2">
        <Label htmlFor="isFor">Registering For</Label>
        <Select
          value={profile.isFor}
          onValueChange={(value) => setProfile({ ...profile, isFor: value })}
        >
          <SelectTrigger className="w-full text-black bg-white dark:text-white dark:bg-gray-900">
            <SelectValue placeholder="Select a registrant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self">Myself</SelectItem>
            <SelectItem value="child">My Child</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* gender */}
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select
          value={profile.gender}
          onValueChange={(value) => setProfile({ ...profile, gender: value })}
        >
          <SelectTrigger className="w-full text-black bg-white dark:text-white dark:bg-gray-900">
            <SelectValue placeholder="Your gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
            <SelectItem value="O">Other</SelectItem>
            <SelectItem value="U">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* birthday */}
      <div className="space-y-2">
        <Label htmlFor="birthday">Select Birthday</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-black bg-white dark:text-white dark:bg-gray-900"
            >
              {selectedDate ? format(selectedDate, "yyyy-MM-dd") : "Pick a date"}
              <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date)
                  setProfile({ ...profile, birthday: formatDateLocal(date) })
                }
              }}
              captionLayout="dropdown"
              className="rounded-md border [&_button]:text-black dark:[&_button]:text-white"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* country */}
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={countryPopoverOpen}
              className="w-full justify-between text-black"
            >
              {profile.country ? profile.country : <span className="text-gray-400">Select country</span>}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search countries..." />
              <CommandEmpty>No matching result</CommandEmpty>
              <CommandGroup>
                {countries.map((c) => (
                  <CommandItem
                    key={c}
                    value={c}
                    onSelect={(val) => {
                      setProfile({ ...profile, country: val })
                      setCountryPopoverOpen(false)
                    }}
                    className={cn(
                      "!text-black hover:bg-gray-100",
                      profile.country === c && "bg-gray-100"
                    )}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", profile.country === c ? "opacity-100" : "opacity-0")}
                    />
                    {c}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* city */}
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={profile.city}
          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
          placeholder="Input a city"
          required
        />
      </div>

      {/* mbti */}
      <div className="space-y-2">
        <Label htmlFor="mbtiType">MBTI (Optional)</Label>
        <Input
          id="mbtiType"
          value={profile.mbtiType}
          onChange={(e) => setProfile({ ...profile, mbtiType: e.target.value })}
          placeholder="Example: INFP、ESTJ"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}

export default BasicInfo