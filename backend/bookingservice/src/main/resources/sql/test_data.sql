-- =====================================================
-- 测试数据插入脚本
-- 用于测试Session预约→满员入等候→取消自动补位闭环
-- =====================================================

-- 清理测试数据（可选）
-- DELETE FROM public.session_booking WHERE event_id IN (SELECT id FROM public.coach_calendar_event WHERE title = 'Test Session');
-- DELETE FROM public.session_waitlist WHERE event_id IN (SELECT id FROM public.coach_calendar_event WHERE title = 'Test Session');
-- DELETE FROM public.coach_calendar_event WHERE title = 'Test Session';
-- DELETE FROM public.user_course_package WHERE id IN (SELECT id FROM public.user_course_package WHERE note = 'Test Package');

-- 1. 创建测试用的教练和课程（如果不存在）
-- 注意：这些ID需要替换为实际存在的ID
DO $$
DECLARE
    test_coach_id uuid := '00000000-0000-0000-0000-000000000001';
    test_course_id uuid := '00000000-0000-0000-0000-000000000002';
    test_user_a_id uuid := '00000000-0000-0000-0000-000000000003';
    test_user_b_id uuid := '00000000-0000-0000-0000-000000000004';
BEGIN
    -- 插入测试用户（如果不存在）
    INSERT INTO public.user_profile (user_id, nickname, gender, birthday, country, city, is_for, is_coach, is_venue)
    VALUES 
        (test_coach_id, 'Test Coach', 'male', '1990-01-01', 'China', 'Beijing', 'coach', true, false),
        (test_user_a_id, 'Test User A', 'male', '1995-01-01', 'China', 'Beijing', 'student', false, false),
        (test_user_b_id, 'Test User B', 'female', '1996-01-01', 'China', 'Shanghai', 'student', false, false)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 插入测试课程（如果不存在）
    INSERT INTO public.course_detail (id, title, description, coach_id)
    VALUES (test_course_id, 'Test Course', 'Test Course Description', test_coach_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- 插入测试课包价格（如果不存在）
    INSERT INTO public.course_package_prices (id, course_id, lessons_count, lesson_duration_minutes, price, training_mode)
    VALUES (gen_random_uuid(), test_course_id, 10, 60, 1000.00, 'online')
    ON CONFLICT DO NOTHING;
END $$;

-- 2. 创建测试Session（capacity=1，用于测试满员场景）
INSERT INTO public.coach_calendar_event (
    id, 
    coach_id, 
    course_id, 
    kind, 
    title, 
    location,
    start_ts, 
    end_ts, 
    capacity, 
    booked_count
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001', -- test_coach_id
    '00000000-0000-0000-0000-000000000002', -- test_course_id
    'session',
    'Test Session - Capacity 1',
    'Online',
    now() + interval '1 day',
    now() + interval '1 day 1 hour',
    1, -- 容量为1，用于测试满员场景
    0
) ON CONFLICT DO NOTHING;

-- 3. 创建测试用户的课包
INSERT INTO public.user_course_package (
    id,
    user_id,
    coach_id,
    course_id,
    package_price_id,
    total_credits,
    remaining_credits,
    status,
    note
) 
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003', -- test_user_a_id
    '00000000-0000-0000-0000-000000000001', -- test_coach_id
    '00000000-0000-0000-0000-000000000002', -- test_course_id
    cpp.id,
    10,
    1, -- 剩余1次，用于测试
    'ACTIVE',
    'Test Package A'
FROM public.course_package_prices cpp 
WHERE cpp.course_id = '00000000-0000-0000-0000-000000000002'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.user_course_package (
    id,
    user_id,
    coach_id,
    course_id,
    package_price_id,
    total_credits,
    remaining_credits,
    status,
    note
) 
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004', -- test_user_b_id
    '00000000-0000-0000-0000-000000000001', -- test_coach_id
    '00000000-0000-0000-0000-000000000002', -- test_course_id
    cpp.id,
    10,
    1, -- 剩余1次，用于测试
    'ACTIVE',
    'Test Package B'
FROM public.course_package_prices cpp 
WHERE cpp.course_id = '00000000-0000-0000-0000-000000000002'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 4. 查询测试数据ID（用于API测试）
SELECT 
    'Test Session ID:' as info,
    cce.id as session_id,
    cce.title,
    cce.capacity,
    cce.booked_count
FROM public.coach_calendar_event cce 
WHERE cce.title = 'Test Session - Capacity 1';

SELECT 
    'Test User A Package ID:' as info,
    ucp.id as package_id,
    ucp.user_id,
    ucp.remaining_credits
FROM public.user_course_package ucp 
WHERE ucp.user_id = '00000000-0000-0000-0000-000000000003' 
AND ucp.note = 'Test Package A';

SELECT 
    'Test User B Package ID:' as info,
    ucp.id as package_id,
    ucp.user_id,
    ucp.remaining_credits
FROM public.user_course_package ucp 
WHERE ucp.user_id = '00000000-0000-0000-0000-000000000004' 
AND ucp.note = 'Test Package B';
