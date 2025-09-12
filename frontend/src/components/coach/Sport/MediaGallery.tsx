import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type MediaItem = {
  id: string
  type: 'image' | 'video' | 'other'
  url: string
  description: string | null
  created_at: string
  signedUrl?: string | null
}

export function MediaGallery({ coachSportId }: { coachSportId: string }) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  async function list() {
    setLoading(true)
    setStatusMsg(null)
    try {
      const { data, error } = await supabase
        .from('coach_media')
        .select('id,type,url,description,created_at')
        .eq('coach_sport_id', coachSportId)
        .order('created_at', { ascending: false })
        .limit(24)
      if (error) throw error
      const rows = (data ?? []) as any[]
      const withSigned = await Promise.all(
        rows.map(async (row) => {
          const { data: s } = await supabase.storage
            .from('coach-media')
            .createSignedUrl(row.url, 3600)
          return { ...row, signedUrl: s?.signedUrl ?? null } as MediaItem
        })
      )
      setItems(withSigned)
    } catch (e: any) {
      console.error(e)
      setStatusMsg(e?.message ?? 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!coachSportId) return
    list()
  }, [coachSportId])

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const listFiles = Array.from(files)
    setUploading(true)
    setStatusMsg(null)
    try {
      for (const file of listFiles) {
        // client-side size/type checks
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        if (isImage && file.size > 5 * 1024 * 1024) {
          setStatusMsg('Image too large (max 5MB)')
          continue
        }
        if (isVideo && file.size > 50 * 1024 * 1024) {
          setStatusMsg('Video too large (max 50MB)')
          continue
        }

        const ext = file.name.split('.').pop() || 'bin'
        const now = new Date()
        const yyyy = `${now.getFullYear()}`
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const rand = Math.random().toString(36).slice(2, 9)
        const path = `sports/${coachSportId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

        const { error: upErr } = await supabase.storage
          .from('coach-media')
          .upload(path, file, { upsert: false })
        if (upErr) throw upErr

        const type = isVideo ? 'video' : isImage ? 'image' : 'other'
        const { error: insErr } = await supabase
          .from('coach_media')
          .insert([{ coach_sport_id: coachSportId, type, url: path }])
        if (insErr) {
          await supabase.storage.from('coach-media').remove([path])
          throw insErr
        }
      }
      setStatusMsg('Uploaded')
      await list()
    } catch (e: any) {
      console.error(e)
      setStatusMsg(e?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function deleteItem(item: MediaItem) {
    try {
      const { error } = await supabase
        .from('coach_media')
        .delete()
        .eq('id', item.id)
      if (error) throw error
      await supabase.storage.from('coach-media').remove([item.url])
      setItems((prev: MediaItem[]) => prev.filter((x: MediaItem) => x.id !== item.id))
    } catch (e: any) {
      console.error(e)
      setStatusMsg(e?.message ?? 'Delete failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="inline-flex items-center gap-2">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => uploadFiles(e.target.files)}
              disabled={uploading}
            />
          </label>
          {statusMsg ? (
            <div className="text-sm text-muted-foreground">{statusMsg}</div>
          ) : null}
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-lg p-4">No media yet. Upload images or videos.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((m: MediaItem) => (
              <div key={m.id} className="border rounded-lg overflow-hidden">
                <div className="w-full aspect-video bg-gray-100">
                  {m.type === 'image' && m.signedUrl ? (
                    <img src={m.signedUrl} className="w-full h-full object-cover" />
                  ) : m.type === 'video' && m.signedUrl ? (
                    <video src={m.signedUrl} controls className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Unsupported</div>
                  )}
                </div>
                <div className="p-2 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground truncate">{m.type}</div>
                  <Button size="sm" variant="outline" onClick={() => deleteItem(m)}>
                    Delete
                  </Button>
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

