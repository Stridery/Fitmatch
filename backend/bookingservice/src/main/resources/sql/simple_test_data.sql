-- =====================================================
-- 简化测试数据脚本
-- 使用现有数据，避免创建新用户
-- =====================================================

-- 1. 查找现有的教练和课程
SELECT 'Existing Coaches:' as info, user_id, nickname, is_coach 
FROM public.user_profile 
WHERE is_coach = true 
LIMIT 5;

SELECT 'Existing Courses:' as info, id, title, coach_id 
FROM public.course_detail 
LIMIT 5;

-- 2. 创建测试Session（使用现有的教练和课程）
-- 请替换下面的ID为实际存在的ID
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
    (SELECT user_id FROM public.user_profile WHERE is_coach = true LIMIT 1), -- 使用第一个教练
    (SELECT id FROM public.course_detail LIMIT 1), -- 使用第一个课程
    'session',
    'Test Session - Capacity 1',
    'Online',
    now() + interval '1 day',
    now() + interval '1 day 1 hour',
    1, -- 容量为1，用于测试满员场景
    0
) ON CONFLICT DO NOTHING;

-- 3. 查找现有的学生用户
SELECT 'Existing Students:' as info, user_id, nickname, is_coach 
FROM public.user_profile 
WHERE is_coach = false 
LIMIT 5;

-- 4. 为现有学生创建测试课包
-- 请替换下面的ID为实际存在的ID
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
    (SELECT user_id FROM public.user_profile WHERE is_coach = false LIMIT 1), -- 第一个学生
    (SELECT user_id FROM public.user_profile WHERE is_coach = true LIMIT 1),  -- 第一个教练
    (SELECT id FROM public.course_detail LIMIT 1), -- 第一个课程
    cpp.id,
    10,
    1, -- 剩余1次，用于测试
    'ACTIVE',
    'Test Package A'
FROM public.course_package_prices cpp 
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
    (SELECT user_id FROM public.user_profile WHERE is_coach = false OFFSET 1 LIMIT 1), -- 第二个学生
    (SELECT user_id FROM public.user_profile WHERE is_coach = true LIMIT 1),  -- 第一个教练
    (SELECT id FROM public.course_detail LIMIT 1), -- 第一个课程
    cpp.id,
    10,
    1, -- 剩余1次，用于测试
    'ACTIVE',
    'Test Package B'
FROM public.course_package_prices cpp 
LIMIT 1
ON CONFLICT DO NOTHING;

-- 5. 查询测试数据ID（用于API测试）
SELECT 
    'Test Session ID:' as info,
    cce.id as session_id,
    cce.title,
    cce.capacity,
    cce.booked_count,
    cce.coach_id,
    cce.course_id
FROM public.coach_calendar_event cce 
WHERE cce.title = 'Test Session - Capacity 1';

SELECT 
    'Test User A Package ID:' as info,
    ucp.id as package_id,
    ucp.user_id,
    ucp.remaining_credits,
    ucp.note
FROM public.user_course_package ucp 
WHERE ucp.note = 'Test Package A';

SELECT 
    'Test User B Package ID:' as info,
    ucp.id as package_id,
    ucp.user_id,
    ucp.remaining_credits,
    ucp.note
FROM public.user_course_package ucp 
WHERE ucp.note = 'Test Package B';

-- 6. 显示用于API测试的完整信息
SELECT 
    'API Test Data:' as info,
    cce.id as session_id,
    ucp_a.user_id as user_a_id,
    ucp_a.id as user_a_package_id,
    ucp_b.user_id as user_b_id,
    ucp_b.id as user_b_package_id
FROM public.coach_calendar_event cce
CROSS JOIN (
    SELECT user_id, id FROM public.user_course_package WHERE note = 'Test Package A'
) ucp_a
CROSS JOIN (
    SELECT user_id, id FROM public.user_course_package WHERE note = 'Test Package B'
) ucp_b
WHERE cce.title = 'Test Session - Capacity 1';
