-- 调试用户预订记录查询
-- 请在Supabase SQL编辑器中执行此查询

-- 1. 检查session_booking表中是否有记录
SELECT 
    'Session Bookings' as table_name,
    COUNT(*) as count
FROM public.session_booking;

-- 2. 检查特定用户的预订记录
SELECT 
    'User Bookings' as info,
    sb.id,
    sb.event_id,
    sb.student_id,
    sb.user_course_package_id,
    sb.status,
    sb.booked_at,
    sb.created_at
FROM public.session_booking sb
WHERE sb.student_id = '3047992c-2d2e-4171-9bde-a6e05357d3f7';

-- 3. 检查JOIN查询是否正常
SELECT
    sb.student_id as studentId,
    cce.coach_id as coachId,
    cce.course_id as courseId,
    sb.user_course_package_id as userCoursePackageId,
    cce.id as sessionEventId,
    cce.title,
    cce.start_ts::timestamp as startTs,
    cce.end_ts::timestamp as endTs,
    cce.capacity,
    cce.booked_count as bookedCount,
    sb.status as bookingStatus,
    sb.booked_at::timestamp as bookedAt,
    sb.cancelled_at::timestamp as cancelledAt
FROM public.session_booking sb
JOIN public.coach_calendar_event cce ON cce.id = sb.event_id
WHERE cce.kind = 'session'
AND sb.student_id = '3047992c-2d2e-4171-9bde-a6e05357d3f7';

-- 4. 检查coach_calendar_event表中的数据
SELECT 
    'Coach Calendar Events' as info,
    id,
    coach_id,
    course_id,
    kind,
    title,
    start_ts,
    end_ts,
    capacity,
    booked_count
FROM public.coach_calendar_event
WHERE kind = 'session'
LIMIT 5;
