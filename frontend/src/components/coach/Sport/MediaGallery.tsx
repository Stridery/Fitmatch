import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCoachMedia } from '@/hooks/useCoachMedia'

function validateFile(file: File): string | null {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  if (!isImage && !isVideo) return 'Only image or video is supported.'
  if (isImage) {
    if (file.size > 5 * 1024 * 1024) return 'Image must be ≤ 5MB.'
    const ok = /(jpeg|jpg|png|webp)$/i.test(file.name)
    if (!ok) return 'Image must be jpg/png/webp.'
  }
  if (isVideo) {
    if (file.size > 50 * 1024 * 1024) return 'Video must be ≤ 50MB.'
    const ok = /(mp4|mov|m4v)$/i.test(file.name)
    if (!ok) return 'Video must be MP4/H.264/AAC compatible.'
  }
  return null
}

export function MediaGallery({ coachSportId }: { coachSportId: string }) {
  const { items, loading, error, list, upload, remove } = useCoachMedia(coachSportId)
  const [busy, setBusy] = useState<boolean>(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const openPicker = () => fileRef.current?.click()

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    try {
      for (const f of Array.from(files)) {
        const v = validateFile(f)
        if (v) {
          window.alert(v)
          continue
        }
        await upload(coachSportId, f)
      }
      await list()
      window.alert('Upload completed')
    } catch (e: any) {
      console.error(e)
      window.alert(e?.message ?? 'Upload failed')
    } finally {
      setBusy(false)
    }
  }, [coachSportId, list, upload])

  const onDelete = useCallback(async (id: string, url: string) => {
    const ok = window.confirm('Delete this media?')
    if (!ok) return
    setBusy(true)
    try {
      await remove({ id, url })
      await list()
    } catch (e: any) {
      console.error(e)
      window.alert(e?.message ?? 'Delete failed')
    } finally {
      setBusy(false)
    }
  }, [list, remove])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gallery</CardTitle>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button type="button" variant="outline" className="text-black" onClick={openPicker} disabled={busy}>Upload</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video bg-gray-100 rounded" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-lg p-4">No media yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((m) => (
              <div key={m.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-black flex items-center justify-center">
                  {m.type === 'image' ? (
                    <img src={m.signedUrl ?? ''} alt="" className="w-full h-full object-cover" />
                  ) : m.type === 'video' ? (
                    <video src={m.signedUrl ?? ''} controls className="w-full h-full" />
                  ) : (
                    <div className="text-xs text-muted-foreground">Unsupported</div>
                  )}
                </div>
                <div className="p-2 flex justify-end">
                  <Button size="sm" variant="destructive" onClick={() => onDelete(m.id, m.url)} disabled={busy}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MediaGallery

