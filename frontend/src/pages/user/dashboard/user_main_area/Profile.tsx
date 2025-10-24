import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { injuryTypeOptions, injuryTagOptions } from "../../userProfile/step/InjuriesInfo"
import { getUserProfile, getUserInjuries, setUserProfile, saveInjuriesBatch } from "@/api/user"
import { supabase } from "@/lib/supabase"
import type { UserProfile, Injury } from "@/entities/user"
import type { UserProfileFormState } from "../../userProfile/CompleteProfilePage"
import { formStateToUserProfile } from "../../userProfile/CompleteProfilePage"
import AvatarUploader from "../../userProfile/AvatarUploader"

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

export function userProfileToFormState(data: UserProfile): UserProfileFormState {
  return {
    avatarUrl: data.avatarUrl ?? "",
    nickname: data.nickname ?? "",
    phone: data.phone ?? "",
    isFor: data.isFor ?? "",
    gender: data.gender ?? "",
    birthday: data.birthday ?? "",
    country: data.country ?? "",
    city: data.city ?? "",
    mbtiType: data.mbtiType ?? "",
    behavioralAnswers: data.behavioralAnswers ?? {},
    height: data.heightCm !== null && data.heightCm !== undefined ? String(data.heightCm) : "",
    weight: data.weightKg !== null && data.weightKg !== undefined ? String(data.weightKg) : "",
    frequency: data.currentTrainingFrequency ?? "",
    isCoach: !!data.isCoach,
    isVenue: !!data.isVenue,
  }
}


function diffInjuries(original: Injury[], current: Injury[]) {
  const toCreate: Injury[] = []
  const toUpdate: Injury[] = []
  const toDelete: string[] = []

  const originalMap = new Map(original.map(i => [i.id, i]))

  const currentIds = new Set<string>()

  current.forEach(curr => {
    if (!curr.id) {
      toCreate.push(curr)
    } else {
      currentIds.add(curr.id)
      const orig = originalMap.get(curr.id)
      if (!orig) {
        // 应该不可能
        toCreate.push(curr)
      } else if (
        orig.injuryType !== curr.injuryType ||
        orig.customInjuryType !== curr.customInjuryType ||
        JSON.stringify(orig.injuryTag) !== JSON.stringify(curr.injuryTag) ||
        orig.isVisibleToCoach !== curr.isVisibleToCoach
      ) {
        toUpdate.push(curr)
      }
    }
  })

  original.forEach(orig => {
    if (orig.id && !currentIds.has(orig.id!)) {
      toDelete.push(orig.id)
    }
  })

  return { toCreate, toUpdate, toDelete }
}




const ProfilePage: React.FC = () => {
  const navigate = useNavigate()

  const [profile, setProfile] = useState<UserProfileFormState>({
    avatarUrl: "",
    nickname: "",
    phone: "",
    isFor: "",
    gender: "",
    birthday: "",
    country: "",
    city: "",
    mbtiType: "",
    behavioralAnswers: {},
    height: "",
    weight: "",
    frequency: "",
    isCoach: false,
    isVenue: false,
  })

  const [injuries, setInjuries] = useState<Injury[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    profile.birthday ? new Date(profile.birthday) : undefined
  )
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
   const [error, setError] = useState<string | null>(null)
   const [originalInjuries, setOriginalInjuries] = useState<Injury[]>([])

  // 🆕 补充：新伤病表单状态
  const [newInjury, setNewInjury] = useState<Injury>({
    injuryType: "",
    customInjuryType: "",
    injuryTag: [],
    isVisibleToCoach: true,
  })

  // 🆕 补充：toggleTag
  const toggleTag = (tag: string) => {
    setNewInjury((prev) => {
      const tags = prev.injuryTag || []
      if (tags.includes(tag)) {
        return { ...prev, injuryTag: tags.filter((t) => t !== tag) }
      } else {
        return { ...prev, injuryTag: [...tags, tag] }
      }
    })
  }

  const resetForm = () => {
    setNewInjury({
      injuryType: "",
      customInjuryType: "",
      injuryTag: [],
      isVisibleToCoach: true,
    })
    setEditingIndex(null)
    setShowForm(false)
  }

  const handleSaveInjury = () => {
    if (!newInjury.injuryType) return

    if (editingIndex !== null) {
      const updated = [...injuries]
      updated[editingIndex] = newInjury
      setInjuries(updated)
    } else {
      setInjuries([...injuries, newInjury])
    }

    resetForm()
  }

  const handleEdit = (index: number) => {
    setNewInjury(injuries[index])
    setEditingIndex(index)
    setShowForm(true)
  }

  // 🆕 补充：删除伤病
  const handleDelete = (index: number) => {
    setInjuries((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveInjuries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Session expired, please log in again.");
        navigate("/login");
        return;
      }

      const token = session.access_token;

      const { toCreate, toUpdate, toDelete } = diffInjuries(
        originalInjuries,
        injuries
      );

      console.log("Injury diff:", { toCreate, toUpdate, toDelete });

      await saveInjuriesBatch(
        { created: toCreate, updated: toUpdate, deletedIds: toDelete }
      );

      alert("✅ Injuries updated successfully!");

      // 刷新状态
      const freshInjuries = await getUserInjuries();
      setInjuries(freshInjuries);
      setOriginalInjuries(freshInjuries);

    } catch (err) {
      console.error(err);
      alert("❌ Failed to update injuries.");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Session expired, please log in again.");
        navigate("/login");
        return;
      }

      const token = session.access_token;
      const userId = session.user.id;

      let avatarUrl: string | null = profile.avatarUrl || null

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const filePath = `${userId}.${fileExt}`
        console.log("file path: ", filePath);
        console.log("avatarFile: ", avatarFile);

        

        const { error: uploadError } = await supabase
          .storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true })

console.log("insert success");

        if (uploadError) {
          console.error("Avatar upload Failed", uploadError)
          setError("Avatar upload Failed")
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)
console.log("public url: ", publicUrlData);
          

        avatarUrl = publicUrlData?.publicUrl ?? null
      }

      const updatedProfile = formStateToUserProfile(profile, avatarUrl ?? "")
      await setUserProfile(updatedProfile);

      alert("✅ Profile updated successfully!")
    } catch (err) {
      console.error(err)
      alert("❌ Failed to update profile.")
    }
  }

  useEffect(() => {
  const fetchProfileAndInjuries = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
          if (!session || error) {
            alert("Session incorrect, please log in again.");
            navigate("/login");
            return;
          }
          //const userId = session.user.id;
          const token = session.access_token;
        

    try {
      const data = await getUserProfile()
      if (data) {
        const formState = userProfileToFormState(data)
        setProfile(formState)
        if (data.birthday) {
          setSelectedDate(new Date(data.birthday))
        }
      }

      const injuries = await getUserInjuries()
      setInjuries(injuries)
      setOriginalInjuries(injuries)

    } catch (err) {
      console.error("Failed to fetch profile or injuries:", err)
      alert("Failed to fetch data, please try again")
    }
  }

  fetchProfileAndInjuries()
}, [])


  return (
    <div className="space-y-8 text-white">
      {/* Basic Profile Section */}
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Basic Profile Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar Section */}
          <div className="md:col-span-2 flex justify-center mb-4">
            <AvatarUploader
              onFileSelect={(file) => setAvatarFile(file)}
              currentUrl={profile.avatarUrl}
            />
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Nickname</Label>
              <Input
                placeholder="Enter your nickname"
                value={profile.nickname}
                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Phone Number</Label>
              <Input
                placeholder="Enter your phone number"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Registration For</Label>
              <Select
                value={profile.isFor}
                onValueChange={(value) => setProfile({ ...profile, isFor: value })}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50 hover:border-gray-500">
                  <SelectValue placeholder="Select registrant" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="self" className="text-white hover:bg-gray-700">Myself</SelectItem>
                  <SelectItem value="child" className="text-white hover:bg-gray-700">My Child</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-gray-700">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Gender</Label>
              <Select
                value={profile.gender}
                onValueChange={(value) => setProfile({ ...profile, gender: value })}
              >
                <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50 hover:border-gray-500">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="M" className="text-white hover:bg-gray-700">Male</SelectItem>
                  <SelectItem value="F" className="text-white hover:bg-gray-700">Female</SelectItem>
                  <SelectItem value="O" className="text-white hover:bg-gray-700">Other</SelectItem>
                  <SelectItem value="U" className="text-white hover:bg-gray-700">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Birthday</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50 hover:border-gray-500"
                  >
                    {selectedDate ? format(selectedDate, "yyyy-MM-dd") : "Pick a date"}
                    <CalendarIcon className="ml-2 h-4 w-4 text-gray-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
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
                    className="rounded-md border [&_button]:text-white [&_button]:hover:bg-gray-700"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Country</Label>
              <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryPopoverOpen}
                    className="w-full justify-between bg-gray-700/50 border-gray-600 text-white hover:bg-gray-600/50 hover:border-gray-500"
                  >
                    {profile.country ? profile.country : <span className="text-gray-400">Select country</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                  <Command>
                    <CommandInput placeholder="Search countries..." className="text-white" />
                    <CommandEmpty className="text-gray-400">No matching result</CommandEmpty>
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
                            "text-white hover:bg-gray-700",
                            profile.country === c && "bg-gray-700"
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
          </div>

          {/* Additional Information */}
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">City</Label>
                <Input
                  placeholder="Enter your city"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">MBTI Type</Label>
                <Input
                  placeholder="Enter your MBTI type"
                  value={profile.mbtiType}
                  onChange={(e) => setProfile({ ...profile, mbtiType: e.target.value })}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-white focus:ring-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Update Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleUpdateProfile}
            className="bg-white hover:bg-gray-100 text-black px-8 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform"
          >
            Update Profile
          </Button>
        </div>
      </div>

      {/* Injury Information Section */}
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Injury Information</h2>
        
        {injuries.length > 0 ? (
          <div className="space-y-4 mb-6">
            {injuries.map((injury, index) => {
              const label =
                injury.injuryType === "other"
                  ? injury.customInjuryType
                  : injuryTypeOptions.find((opt) => opt.value === injury.injuryType)?.label || injury.injuryType

              return (
                <div
                  key={index}
                  className="bg-gray-700/50 border border-gray-600 p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2"><strong>Type:</strong> {label}</p>
                      {injury.injuryTag.length > 0 && (
                        <p className="text-gray-300 mb-2"><strong>Tags:</strong> {injury.injuryTag.join(", ")}</p>
                      )}
                      <p className="text-gray-300"><strong>Visible to Coach:</strong> {injury.isVisibleToCoach ? "Yes" : "No"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(index)}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(index)}
                        className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-400 mb-6">No injury records</p>
        )}

        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)} 
            type="button" 
            variant="outline" 
            className="bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white hover:border-gray-500 mb-6"
          >
            Add Injury Record
          </Button>
        )}

        {showForm && (
          <div className="space-y-4 border border-gray-600 rounded-lg p-6 bg-gray-700/50">
            <div className="space-y-2">
              <Label className="text-gray-300">Injury Type</Label>
              <Select
                value={newInjury.injuryType}
                onValueChange={(val) => setNewInjury({ ...newInjury, injuryType: val })}
              >
                <SelectTrigger className="bg-gray-600/50 border-gray-500 text-white hover:bg-gray-500/50 hover:border-gray-400">
                  <SelectValue placeholder="Select injury type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {injuryTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-gray-700">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newInjury.injuryType === "other" && (
              <div className="space-y-2">
                <Label className="text-gray-300">Custom Injury Type</Label>
                <Input
                  value={newInjury.customInjuryType}
                  onChange={(e) =>
                    setNewInjury({ ...newInjury, customInjuryType: e.target.value })
                  }
                  placeholder="e.g. Hip inflammation"
                  className="bg-gray-600/50 border-gray-500 text-white placeholder-gray-400 focus:border-gray-400 focus:ring-gray-400"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300">Tags (optional, multiple)</Label>
              <div className="flex flex-wrap gap-3">
                {injuryTagOptions.map((tag) => (
                  <div key={tag.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag.value}
                      checked={newInjury.injuryTag.includes(tag.value)}
                      onCheckedChange={() => toggleTag(tag.value)}
                      className="border-gray-500 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label htmlFor={tag.value} className="text-gray-300">{tag.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="visible"
                checked={newInjury.isVisibleToCoach}
                onCheckedChange={(checked) =>
                  setNewInjury({ ...newInjury, isVisibleToCoach: !!checked })
                }
                className="border-gray-500 data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="visible" className="text-gray-300">Visible to Coach</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-500 text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveInjury}
                className="bg-white hover:bg-gray-100 text-black"
              >
                {editingIndex !== null ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleSaveInjuries}
            className="bg-white hover:bg-gray-100 text-black px-8 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform"
          >
            Update Injuries
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage