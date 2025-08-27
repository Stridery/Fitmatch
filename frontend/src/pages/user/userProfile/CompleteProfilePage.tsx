import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import BasicInfo from "./step/BasicInfo"
import OptionalInfo from "./step/OptionalInfo"
import BehavioralInfo from "./step/BehavioralInfo"
import InjuriesInfo from "./step/InjuriesInfo"
import { setUserProfile, saveInjuriesBatch } from "../../../api/user"
import { supabase } from "@/lib/supabase"
import type { UserProfile, Injury } from "@/entities/user"
import { useUser } from "@/contexts/UserContext";






export type UserProfileFormState = {
  avatarUrl: string
  nickname: string
  phone: string
  isFor: string
  gender: string
  birthday: string
  country: string
  city: string
  mbtiType: string
  behavioralAnswers: Record<string, any>
  height: string
  weight: string
  frequency: string
  isCoach: boolean
  isVenue: boolean
}

export function formStateToUserProfile(
  form: UserProfileFormState,
  avatarUrlOverride: string | null = null
): Partial<UserProfile> {
  return {
    avatarUrl: avatarUrlOverride ?? (form.avatarUrl.trim() || null),
    nickname: form.nickname.trim() || null,
    phone: form.phone.trim() || null,
    isFor: form.isFor.trim() || null,
    gender: form.gender.trim() || null,
    birthday: form.birthday.trim() || null,
    country: form.country.trim() || null,
    city: form.city.trim() || null,
    mbtiType: form.mbtiType.trim() || null,
    behavioralAnswers:
      Object.keys(form.behavioralAnswers || {}).length > 0
        ? form.behavioralAnswers
        : null,
    heightCm:
      form.height !== "" ? Number(form.height) : null,
    weightKg:
      form.weight !== "" ? Number(form.weight) : null,
    currentTrainingFrequency: form.frequency.trim() || null,
    isCoach: !!form.isCoach,
    isVenue: !!form.isVenue,
  }
}

// 👇 step 校验
function validateStep(step: number, profile: UserProfileFormState): string | null {
  if (step === 1) {
    if (!profile.nickname.trim()) return "Nickname is required"
    if (!profile.gender.trim()) return "Gender is required"
    if (!profile.birthday.trim()) return "Birthday is required"
  }
  // 你可以为其他 step 加校验
  return null
}

const CompleteProfilePage = () => {
  const navigate = useNavigate()
  const { setUser } = useUser();

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
  const [error, setError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [step, setStep] = useState(1)

  

  const handleNext = () => {
    const validationError = validateStep(step, profile)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setStep((s) => Math.min(s + 1, 4))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 全局必填校验兜底
    const validationError = validateStep(1, profile)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || error) {
        alert("Session incorrect, please log in again.");
        navigate("/login");
        return;
      }
      const userId = session.user.id;
      const token = session.access_token;

      let avatarUrl: string | null = profile.avatarUrl || null

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const filePath = `${userId}.${fileExt}`

        const { error: uploadError } = await supabase
          .storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) {
          console.error("Avatar upload Failed", uploadError)
          setError("Avatar upload Failed")
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath)

        avatarUrl = publicUrlData?.publicUrl ?? null
      }

      const updatedProfile = formStateToUserProfile(profile, avatarUrl)


      const injuriesBatch = {
        created: injuries,
        updated: [],
        deletedIds: []
      }


      await setUserProfile(updatedProfile, token)
      await saveInjuriesBatch(injuriesBatch, token)

      setUser({
        id: userId,
        email: session.user.email ?? "",
        profile: updatedProfile as UserProfile, // 注意键名要和守卫检查一致：nickname/gender/birthday 等
      });

      navigate("/match")
    } catch (err: any) {
      console.error(err)
      setError("Submit failed, please check again")
    }
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-gray-100 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">FITMATCH</div>
        <p className="text-gray-500 text-center px-4">
          Where coaches and students connect
        </p>
      </div>

      <div className="w-1/2 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md"
        >
          <h2 className="text-2xl font-semibold text-center">
            Complete Your Profile
          </h2>

          {step === 1 && (
            <BasicInfo
              profile={profile}
              setProfile={setProfile}
              setAvatarFile={setAvatarFile}
            />
          )}
          {step === 2 && (
            <OptionalInfo profile={profile} setProfile={setProfile} />
          )}
          {step === 3 && (
            <BehavioralInfo profile={profile} setProfile={setProfile} />
          )}
          {step === 4 && (
            <InjuriesInfo injuries={injuries} setInjuries={setInjuries} />
          )}

          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  handleBack()
                }}
                className="bg-gray-200 text-black hover:bg-gray-300"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  handleNext()
                }}
              >
                Next
              </Button>
            ) : (
              <Button type="submit">Submit</Button>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  )
}

export default CompleteProfilePage