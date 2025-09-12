import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type MediaItem = {
  id: string
  type: 'image' | 'video' | 'other'
  url: string
  description: string | null
  created_at: string
  signedUrl?: string | null
}

export function useCoachMedia(coachSportId?: string) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const list = useCallback(async (id?: string) => {
    const sportId = id ?? coachSportId
    if (!sportId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('coach_media')
        .select('id,type,url,description,created_at')
        .eq('coach_sport_id', sportId)
        .order('created_at', { ascending: false })
        .limit(24)
      if (error) throw error
      const withSigned = await Promise.all((data ?? []).map(async (row: any) => {
        const { data: s } = await supabase.storage.from('coach-media').createSignedUrl(row.url, 3600)
        return { ...row, signedUrl: s?.signedUrl ?? null } as MediaItem
      }))
      setItems(withSigned)
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [coachSportId])

  useEffect(() => {
    list().catch(() => {})
  }, [list])

  const upload = useCallback(async (sportId: string, file: File) => {
    const ext = file.name.split('.').pop() || 'bin'
    const now = new Date()
    const yyyy = `${now.getFullYear()}`
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const rand = Math.random().toString(36).slice(2, 9)
    const path = `sports/${sportId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

    const { error: upErr } = await supabase.storage.from('coach-media').upload(path, file, { upsert: false })
    if (upErr) throw upErr

    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'other'

    const { error: insErr } = await supabase
      .from('coach_media')
      .insert([{ coach_sport_id: sportId, type, url: path }])
    if (insErr) {
      await supabase.storage.from('coach-media').remove([path])
      throw insErr
    }
  }, [])

  const remove = useCallback(async (item: { id: string; url: string }) => {
    const { error } = await supabase.from('coach_media').delete().eq('id', item.id)
    if (error) throw error
    await supabase.storage.from('coach-media').remove([item.url])
  }, [])

  return { items, loading, error, list, upload, remove }
}

