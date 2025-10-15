-- =====================================================
-- 检查Session Booking System Functions是否存在
-- 请在Supabase SQL编辑器中执行此查询
-- =====================================================

-- 1. 检查所有函数是否存在
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    CASE 
        WHEN p.proname IN ('book_existing_session', 'cancel_session_booking', 'promote_waitlist_head') 
        THEN '✅ EXISTS' 
        ELSE '❓ OTHER' 
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('book_existing_session', 'cancel_session_booking', 'promote_waitlist_head')
ORDER BY p.proname;

-- 2. 检查视图是否存在
SELECT 
    schemaname,
    viewname,
    '✅ EXISTS' as status
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'v_student_personal_schedule';

-- 3. 检查所有相关的数据库对象
SELECT 
    'Functions' as object_type,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('book_existing_session', 'cancel_session_booking', 'promote_waitlist_head')

UNION ALL

SELECT 
    'Views' as object_type,
    COUNT(*) as count
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'v_student_personal_schedule'

UNION ALL

SELECT 
    'Tables' as object_type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('session_booking', 'session_waitlist', 'user_course_package', 'coach_calendar_event');

-- 4. 详细检查每个函数的具体信息
SELECT 
    'book_existing_session' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'book_existing_session'
        ) THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END as status;

SELECT 
    'cancel_session_booking' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'cancel_session_booking'
        ) THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END as status;

SELECT 
    'promote_waitlist_head' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'promote_waitlist_head'
        ) THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END as status;

SELECT 
    'v_student_personal_schedule' as view_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_views 
            WHERE schemaname = 'public' AND viewname = 'v_student_personal_schedule'
        ) THEN '✅ EXISTS'
        ELSE '❌ NOT FOUND'
    END as status;
