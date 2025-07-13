import { useState, useEffect } from "react"
import type { ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AvatarUploaderProps = {
  onFileSelect: (file: File) => void
  currentUrl?: string
}

const AvatarUploader = ({ onFileSelect, currentUrl }: AvatarUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("")

  useEffect(() => {
    if (currentUrl && !previewUrl) {
      setPreviewUrl(currentUrl)
    }
  }, [currentUrl, previewUrl])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid image file")
      return
    }

    const newUrl = URL.createObjectURL(file)
    setPreviewUrl(newUrl)
    onFileSelect(file)
  }

  return (
    <div className="space-y-4">
      

      <div>
        <Label
          htmlFor="avatar-upload"
          className="cursor-pointer inline-block px-4 py-2 border border-gray-400 text-black bg-white rounded-md hover:bg-gray-100"
        >
          Choose Image
        </Label>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex justify-center">
        <img
          src={previewUrl || "/placeholder-avatar.png"}
          alt="Avatar preview"
          className="w-32 h-32 object-cover rounded-full border"
        />
      </div>
    </div>
  )
}

export default AvatarUploader