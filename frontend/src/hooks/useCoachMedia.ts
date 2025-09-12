import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BUCKET = 'coach_media' // 确认与实际桶名完全一致

export type MediaItem = {
  id: string
  type: 'image' | 'video' | 'other'
  url: string          // storage path
  created_at: string
  signedUrl?: string | null
}

// DB 返回行
type DbMediaRow = {
  id: string
  type: 'image' | 'video' | 'other'
  url: string
  created_at: string
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
        .select('id,type,url,created_at')
        .eq('coach_sport_id', sportId)
        .order('created_at', { ascending: false })
        .limit(24)

      if (error) throw error

      const rows = (data ?? []) as DbMediaRow[]
      const withSigned: MediaItem[] = await Promise.all(
        rows.map(async (row) => {
          const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(row.url, 3600)
          return { ...row, signedUrl: s?.signedUrl ?? null }
        })
      )
      setItems(withSigned)
    } catch (e: unknown) {
      console.error(e)
      const msg = e instanceof Error ? e.message : 'Failed to load media'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [coachSportId])

  useEffect(() => {
    if (coachSportId) list().catch(() => {})
  }, [coachSportId, list])

  const upload = useCallback(async (sportId: string, file: File) => {
    if (!sportId) throw new Error('Missing coach_sport_id')

    // 获取当前登录用户，做 coach_id
    const { data: userRes, error: userErr } = await supabase.auth.getUser()
    if (userErr) throw userErr
    const coachId = userRes.user?.id
    if (!coachId) throw new Error('Not authenticated')

    const ext = file.name.split('.').pop() || 'bin'
    const now = new Date()
    const yyyy = `${now.getFullYear()}`
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const rand = Math.random().toString(36).slice(2, 9)
    const path = `${coachId}/${sportId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

    // 1) 上传到 Storage
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
    if (upErr) throw upErr

    // 2) 插入 DB（带上 coach_id / coach_sport_id / type / url）
    const type: MediaItem['type'] =
      file.type.startsWith('video/') ? 'video' :
      file.type.startsWith('image/') ? 'image' : 'other'

    const { error: insErr } = await supabase.from('coach_media').insert([{
      coach_id: coachId,
      coach_sport_id: sportId,
      type,
      url: path,
    }])
    if (insErr) {
      // DB 失败回滚对象
      await supabase.storage.from(BUCKET).remove([path]).catch(() => {})
      throw insErr
    }

    // 3) 刷新列表
    await list(sportId)
  }, [list])

  const remove = useCallback(async (item: { id: string; url: string }) => {
    const { error } = await supabase.from('coach_media').delete().eq('id', item.id)
    if (error) throw error
    await supabase.storage.from(BUCKET).remove([item.url]).catch(() => {})
    setItems(prev => prev.filter(it => it.id !== item.id))
  }, [])

  return { items, loading, error, list, upload, remove }
}
