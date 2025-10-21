-- Availability Booking Database Validation Script
-- 验证availability booking功能的数据完整性

-- 1. 检查session_booking表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'session_booking' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查availability_courses表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'availability_courses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 检查availability booking相关的约束
SELECT 
    constraint_name, 
    constraint_type, 
    check_clause 
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'session_booking' 
AND tc.constraint_type = 'CHECK';

-- 4. 检查availability booking相关的函数
SELECT 
    routine_name, 
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'book_availability',
    'cancel_availability_booking', 
    'get_availability_available_slots'
)
ORDER BY routine_name;

-- 5. 检查availability booking相关的触发器
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%availability%'
ORDER BY trigger_name;

-- 6. 测试数据示例查询
-- 查看现有的availability事件
SELECT 
    id,
    coach_id,
    kind,
    title,
    start_ts,
    end_ts,
    booked_count
FROM coach_calendar_event 
WHERE kind = 'availability'
ORDER BY start_ts DESC
LIMIT 5;

-- 查看现有的availability-course关联
SELECT 
    ac.id,
    ac.availability_id,
    ac.course_id,
    cce.title as availability_title,
    cd.summary as course_title
FROM availability_courses ac
JOIN coach_calendar_event cce ON ac.availability_id = cce.id
JOIN course_detail cd ON ac.course_id = cd.id
ORDER BY ac.created_at DESC
LIMIT 5;

-- 查看现有的availability booking记录
SELECT 
    sb.id,
    sb.event_id,
    sb.student_id,
    sb.user_course_package_id,
    sb.status,
    sb.booked_start_time,
    sb.booked_end_time,
    sb.booked_at,
    cce.title as availability_title
FROM session_booking sb
JOIN coach_calendar_event cce ON sb.event_id = cce.id
WHERE cce.kind = 'availability'
ORDER BY sb.booked_at DESC
LIMIT 5;
