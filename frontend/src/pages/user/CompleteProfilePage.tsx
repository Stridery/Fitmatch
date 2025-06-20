import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from '@supabase/supabase-js'
import AvatarUploader from './AvatarUploader'
import { parseJwt } from "../../utils/Jwt"
import { setUserProfile } from '../../api/user'

const countries = ["United States", "Canada", "China", "Japan", "Germany", "France", "Australia", "United Kingdom"]

const CompleteProfilePage = () => {
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    avatarUrl: "",
    isFor: "",
    gender: "",
    birthday: "",
    country: "",
    city: "",
    mbtiType: "",
  })

  const [error, setError] = useState<string | null>(null)
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false)


  const [avatarFile, setAvatarFile] = useState<File | null>(null)


    

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("请先登录")
        return
      }

      let avatarUrl: string | null = null

      // 如果用户选择了头像，上传到 Supabase
      if (avatarFile) {
        const supabase = createClient("https://sppzmqwocajtdvazhehp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcHptcXdvY2FqdGR2YXpoZWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTYyMTYsImV4cCI6MjA2NTc3MjIxNn0.9lcnqX_b3as2TYIXX-nRGrr8pP3qo7PZbOq3LjcUDlQ")
        const fileExt = avatarFile.name.split(".").pop()
        const userId = parseJwt(token).sub // 从 token 解析 userId（sub 字段）
        const filePath = `avatars/${userId}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile)

        if (uploadError) {
          console.error("上传头像失败", uploadError)
          setError("上传头像失败")
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        avatarUrl = publicUrlData?.publicUrl ?? null

        setProfile((prev) => ({
          ...prev,
          avatarUrl: avatarUrl ?? "", // 👈 如果是 null，就用空字符串
        }))
      }

      await setUserProfile(profile, token)

      

      navigate("/dashboard")
    } catch (err: any) {
      console.error(err)
      setError("提交失败，请检查信息")
    }
  }
  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">FITMATCH</div>
        <p className="text-gray-500 text-center px-4">Where coaches and students connect</p>
      </div>

      <div className="w-1/2 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md"
        >
          <h2 className="text-2xl font-semibold text-center">完善个人信息</h2>


          <AvatarUploader onFileSelect={(file) => setAvatarFile(file)} />

          {/* isFor */}
          <div className="space-y-2">
            <Label htmlFor="isFor">为谁报名</Label>
            <Select
              value={profile.isFor}
              onValueChange={(value) => setProfile({ ...profile, isFor: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择报名对象" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">本人 (self)</SelectItem>
                <SelectItem value="child">孩子 (child)</SelectItem>
                <SelectItem value="other">其他 (other)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">性别</Label>
            <Select
              value={profile.gender}
              onValueChange={(value) => setProfile({ ...profile, gender: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">男性 (M)</SelectItem>
                <SelectItem value="F">女性 (F)</SelectItem>
                <SelectItem value="O">其他 (O)</SelectItem>
                <SelectItem value="U">不愿透露 (U)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* birthday */}
          <div className="space-y-2">
            <Label htmlFor="birthday">生日</Label>
            <Input
              id="birthday"
              type="date"
              value={profile.birthday}
              onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
              required
            />
          </div>

          {/* country */}
          <div className="space-y-2">
            <Label htmlFor="country">国家</Label>
            <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryPopoverOpen}
                  className="w-full justify-between text-black"
                >
                  {profile.country || "选择国家"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="搜索国家..." />
                  <CommandEmpty>无匹配项</CommandEmpty>
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
            <Label htmlFor="city">城市</Label>
            <Input
              id="city"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              required
            />
          </div>

          {/* mbti */}
          <div className="space-y-2">
            <Label htmlFor="mbtiType">MBTI 类型（可选）</Label>
            <Input
              id="mbtiType"
              value={profile.mbtiType}
              onChange={(e) => setProfile({ ...profile, mbtiType: e.target.value })}
              placeholder="如 INFP、ESTJ"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button type="submit" className="w-full">
            提交信息
          </Button>
        </form>
      </div>
    </div>
  )
}

export default CompleteProfilePage