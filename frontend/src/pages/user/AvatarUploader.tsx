import { useState } from "react"
import type { ChangeEvent } from "react"
import { Input } from "@/components/ui/input"

type AvatarUploaderProps = {
  onFileSelect: (file: File) => void
}

const AvatarUploader = ({ onFileSelect }: AvatarUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("请选择有效的图片文件")
      return
    }

    setError(null)
    setPreviewUrl(URL.createObjectURL(file)) // ✅ 本地预览
    onFileSelect(file) // ✅ 将 File 传给父组件处理
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">上传头像（可选）</label>
      <Input type="file" accept="image/*" onChange={handleFileChange} />
      {previewUrl && (
        <img
          src={previewUrl}
          alt="头像预览"
          className="w-32 h-32 object-cover rounded-full border"
        />
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}

export default AvatarUploader