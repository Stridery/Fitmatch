-- =====================================================
-- 使用真实ID的测试数据脚本
-- 基于用户提供的实际ID
-- =====================================================

-- 清理之前的测试数据（可选）
DELETE FROM public.session_booking WHERE event_id IN (
    SELECT id FROM public.coach_calendar_event WHERE title = 'Test Session - Capacity 1'
);
DELETE FROM public.session_waitlist WHERE event_id IN (
    SELECT id FROM public.coach_calendar_event WHERE title = 'Test Session - Capacity 1'
);
DELETE FROM public.coach_calendar_event WHERE title = 'Test Session - Capacity 1';
DELETE FROM public.user_course_package WHERE note IN ('Test Package A', 'Test Package B');

-- 1. 创建测试Session（capacity=1，用于测试满员场景）
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
    '571b85e8-4684-4ac9-a1bf-b882d1cf2eb9', -- 现有教练ID
    '06902cd5-e14f-4810-9d24-9c1686e936d8', -- 现有课程ID
    'session',
    'Test Session - Capacity 1',
    'Online',
    now() + interval '1 day',
    now() + interval '1 day 1 hour',
    1, -- 容量为1，用于测试满员场景
    0
);

-- 2. 为两个学生创建测试课包
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
    '3047992c-2d2e-4171-9bde-a6e05357d3f7', -- 学生A ID
    '571b85e8-4684-4ac9-a1bf-b882d1cf2eb9', -- 教练ID
    '06902cd5-e14f-4810-9d24-9c1686e936d8', -- 课程ID
    cpp.id,
    10,
    1, -- 剩余1次，用于测试
    'ACTIVE',
    'Test Package A'
FROM public.course_package_prices cpp 
WHERE cpp.course_id = '06902cd5-e14f-4810-9d24-9c1686e936d8'
LIMIT 1;

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
    '83a3e2e8-d93a-4162-9d18-6e097146f535', -- 学生B ID
    '571b85e8-4684-4ac9-a1bf-b882d1cf2eb9', -- 教练ID
    '06902cd5-e14f-4810-9d24-9c1686e936d8', -- 课程ID
    cpp.id,
    10,
    1, -- 剩余1次，用于测试
    'ACTIVE',
    'Test Package B'
FROM public.course_package_prices cpp 
WHERE cpp.course_id = '06902cd5-e14f-4810-9d24-9c1686e936d8'
LIMIT 1;

-- 3. 查询测试数据ID（用于API测试）
SELECT 
    '=== TEST DATA FOR API ===' as info;

SELECT 
    'Session ID:' as field,
    cce.id as value,
    'Use this for eventId in API calls' as description
FROM public.coach_calendar_event cce 
WHERE cce.title = 'Test Session - Capacity 1';

SELECT 
    'User A ID:' as field,
    '3047992c-2d2e-4171-9bde-a6e05357d3f7' as value,
    'Use this for X-User-Id header' as description;

SELECT 
    'User A Package ID:' as field,
    ucp.id as value,
    'Use this for userCoursePackageId in API calls' as description
FROM public.user_course_package ucp 
WHERE ucp.note = 'Test Package A';

SELECT 
    'User B ID:' as field,
    '83a3e2e8-d93a-4162-9d18-6e097146f535' as value,
    'Use this for X-User-Id header' as description;

SELECT 
    'User B Package ID:' as field,
    ucp.id as value,
    'Use this for userCoursePackageId in API calls' as description
FROM public.user_course_package ucp 
WHERE ucp.note = 'Test Package B';

-- 4. 验证数据创建成功
SELECT 
    '=== DATA VERIFICATION ===' as info;

SELECT 
    'Session created:' as check_item,
    cce.title,
    cce.capacity,
    cce.booked_count,
    cce.coach_id,
    cce.course_id
FROM public.coach_calendar_event cce 
WHERE cce.title = 'Test Session - Capacity 1';

SELECT 
    'Packages created:' as check_item,
    ucp.note,
    ucp.user_id,
    ucp.remaining_credits,
    ucp.status
FROM public.user_course_package ucp 
WHERE ucp.note IN ('Test Package A', 'Test Package B')
ORDER BY ucp.note;

