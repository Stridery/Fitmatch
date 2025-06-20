import React, { useState } from "react"

type Profile = {
  isFor: string
  gender: string
  birthday: string
  country: string
  city: string
  mbtiType: string
  mbtiDistribution: Record<string, any>
}

type StudentAdditional = {
  heightCm: string
  weightKg: string
  trainingFrequency: string
  preferredVenue: string
  transportationMode: string
}

type Injury = {
  injuryType: string
  customInjuryType?: string
  injuryTag?: string
  isVisibleToCoach: boolean
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile>({
    isFor: "",
    gender: "",
    birthday: "",
    country: "",
    city: "",
    mbtiType: "",
    mbtiDistribution: {},
  })

  const [additional, setAdditional] = useState<StudentAdditional>({
    heightCm: "",
    weightKg: "",
    trainingFrequency: "",
    preferredVenue: "",
    transportationMode: "",
  })

  const [injuries, setInjuries] = useState<Injury[]>([]) // ✅ 明确指定类型

  const handleAddInjury = () => {
    setInjuries([
      ...injuries,
      {
        injuryType: "",
        customInjuryType: "",
        injuryTag: "",
        isVisibleToCoach: true,
      },
    ])
  }

  const handleInjuryChange = (
    index: number,
    field: keyof Injury,
    value: string | boolean
  ) => {
    const updated = [...injuries]
    updated[index][field] = value as never
    setInjuries(updated)
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">👤 用户基础信息</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          placeholder="为谁报名 (self/child/other)"
          value={profile.isFor}
          onChange={(e) => setProfile({ ...profile, isFor: e.target.value })}
          className="input"
        />
        <input
          placeholder="性别 (M/F/O/U)"
          value={profile.gender}
          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          className="input"
        />
        <input
          type="date"
          placeholder="生日"
          value={profile.birthday}
          onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
          className="input"
        />
        <input
          placeholder="国家"
          value={profile.country}
          onChange={(e) => setProfile({ ...profile, country: e.target.value })}
          className="input"
        />
        <input
          placeholder="城市"
          value={profile.city}
          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
          className="input"
        />
        <input
          placeholder="MBTI 类型（可选）"
          value={profile.mbtiType}
          onChange={(e) => setProfile({ ...profile, mbtiType: e.target.value })}
          className="input"
        />
      </div>

      <h2 className="text-2xl font-bold">📋 学员补充信息（选填）</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          placeholder="身高 (cm)"
          value={additional.heightCm}
          onChange={(e) =>
            setAdditional({ ...additional, heightCm: e.target.value })
          }
          className="input"
        />
        <input
          placeholder="体重 (kg)"
          value={additional.weightKg}
          onChange={(e) =>
            setAdditional({ ...additional, weightKg: e.target.value })
          }
          className="input"
        />
        <input
          placeholder="训练频率"
          value={additional.trainingFrequency}
          onChange={(e) =>
            setAdditional({
              ...additional,
              trainingFrequency: e.target.value,
            })
          }
          className="input"
        />
        <input
          placeholder="场地偏好"
          value={additional.preferredVenue}
          onChange={(e) =>
            setAdditional({ ...additional, preferredVenue: e.target.value })
          }
          className="input"
        />
        <input
          placeholder="交通方式"
          value={additional.transportationMode}
          onChange={(e) =>
            setAdditional({
              ...additional,
              transportationMode: e.target.value,
            })
          }
          className="input"
        />
      </div>

      <h2 className="text-2xl font-bold">💢 伤病信息（可多条）</h2>
      {injuries.map((injury, index) => (
        <div key={index} className="grid grid-cols-2 gap-4 border p-4 rounded">
          <input
            placeholder="伤病类型 (如 ACL, custom)"
            value={injury.injuryType}
            onChange={(e) =>
              handleInjuryChange(index, "injuryType", e.target.value)
            }
            className="input"
          />
          <input
            placeholder="自定义伤病名称"
            value={injury.customInjuryType || ""}
            onChange={(e) =>
              handleInjuryChange(index, "customInjuryType", e.target.value)
            }
            className="input"
          />
          <input
            placeholder="归一化标签（如 knee_injury）"
            value={injury.injuryTag || ""}
            onChange={(e) =>
              handleInjuryChange(index, "injuryTag", e.target.value)
            }
            className="input"
          />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={injury.isVisibleToCoach}
              onChange={(e) =>
                handleInjuryChange(index, "isVisibleToCoach", e.target.checked)
              }
            />
            <span>允许展示给教练</span>
          </label>
        </div>
      ))}

      <button
        onClick={handleAddInjury}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        ➕ 添加伤病记录
      </button>
    </div>
  )
}

export default ProfilePage