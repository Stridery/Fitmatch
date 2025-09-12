import { useEffect, useState, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSportDetail } from '@/hooks/useSportDetail'
import { SportHeader } from '@/components/coach/Sport/SportHeader'
import { ModeGrid } from '@/components/coach/Sport/ModeGrid'
import { Button } from '@/components/ui/button'
import MediaGallery from '@/components/coach/Sport/MediaGallery'

export default function SportDetailPage() {
  const { id } = useParams()
  const location = useLocation() as { state?: { sportName?: string } }
  const navigate = useNavigate()

  // ✅ 自定义 Hook 必须在顶层
  const { loading, error, coachSport, courses, courseVMs, canSchedule } = useSportDetail(id)

  // ✅ 所有 useState 都放在顶层——不要放在任何条件 return 之后
  const [resolvedSportName, setResolvedSportName] = useState<string | null>(
    location.state?.sportName ?? null
  )
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isCourseDeleted, setIsCourseDeleted] = useState<boolean>(false)

  // ✅ 这个副作用也在顶层（没问题）
  useEffect(() => {
    let mounted = true
    if (!resolvedSportName && coachSport?.sport_id) {
      supabase
        .from('sports')
        .select('name')
        .eq('id', coachSport.sport_id)
        .maybeSingle()
        .then(({ data }) => {
          if (mounted) setResolvedSportName(data?.name ?? null)
        })
    }
    return () => { mounted = false }
  }, [resolvedSportName, coachSport?.sport_id])

  // ✅ 删除指定课程后刷新
  const handleDeleteCourse = useCallback(async (courseId: string) => {
    const ok = window.confirm('Delete this course? This cannot be undone.')
    if (!ok) return
    try {
      setIsDeleting(true)
      const { error: delErr } = await supabase
        .from('course_detail')
        .delete()
        .eq('id', courseId)
      if (delErr) throw delErr
      setIsCourseDeleted(true)
      window.alert('Course deleted')
      window.location.reload()
    } catch (e: unknown) {
      console.error(e)
      const msg = e instanceof Error ? e.message : 'Failed to delete'
      window.alert(msg)
    } finally {
      setIsDeleting(false)
    }
  }, [])

  // 下面开始做条件渲染就安全了（不会再引入新 Hook）
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-40 bg-gray-100 rounded" />
        <div className="h-5 w-72 bg-gray-100 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-72 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  if (!coachSport) {
    return <div className="p-6">Not found.</div>
  }

  const sportName = resolvedSportName ?? coachSport.sport_id

  return (
    <div className="p-6 space-y-6">
      <SportHeader
        sportName={sportName}
        status={coachSport.status}
        sportId={coachSport.id}
      />

      {(!courseVMs || courseVMs.length === 0) || isCourseDeleted ? (
        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
          <div>You haven’t set up your course profile yet.</div>
          <div className="mt-3">
            <Button
              className="text-black"
              onClick={() =>
                navigate(`/coach/sports/${coachSport.id}/course/new`, {
                  state: { sportName },
                })
              }
            >
              Add course
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courseVMs.map(({ courseId, vm }) => {
            return (
              <div key={courseId} className="h-full">
                <ModeGrid
                  vm={vm}
                  sportId={coachSport.id}
                  canSchedule={canSchedule}
                  courseId={courseId}
                  onDelete={() => handleDeleteCourse(courseId)}
                  deleting={isDeleting}
                />
              </div>
            )
          })}
        </div>
      )}

      <MediaGallery coachSportId={coachSport.id} />

      <div className="pt-2">
        <div className="border-t mt-4 pt-4 flex justify-end">
          <Button
            className="text-black"
            onClick={() =>
              navigate(`/coach/sports/${coachSport.id}/course/new`, {
                state: { sportName },
              })
            }
          >
            Add course
          </Button>
        </div>
      </div>
    </div>
  )
}
