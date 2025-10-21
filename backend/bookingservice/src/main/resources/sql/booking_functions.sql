-- =====================================================
-- Session Booking System Functions
-- 基于现有表结构实现「Session 预约→满员入等候→取消自动补位」闭环
-- 表结构：coach_calendar_event, user_course_package, session_booking, session_waitlist
-- =====================================================

-- 1. 预约已有 Session 函数
CREATE OR REPLACE FUNCTION public.book_existing_session(
    p_event_id uuid,
    p_student_id uuid,
    p_user_course_package_id uuid
) RETURNS text AS $$
DECLARE
    v_event_record RECORD;
    v_package_record RECORD;
    v_existing_booking RECORD;
    v_waitlist_position INTEGER;
    v_result TEXT;
BEGIN
    -- 锁定目标 session 行
    SELECT * INTO v_event_record
    FROM public.coach_calendar_event
    WHERE id = p_event_id AND kind = 'session'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or not a valid session event';
    END IF;
    
    -- 检查是否已经预约过
    SELECT * INTO v_existing_booking
    FROM public.session_booking
    WHERE event_id = p_event_id AND student_id = p_student_id;
    
    IF FOUND AND v_existing_booking.status = 'CONFIRMED' THEN
        RETURN 'CONFIRMED';
    END IF;
    
    -- 校验课包（同事务内 FOR UPDATE）
    SELECT * INTO v_package_record
    FROM public.user_course_package
    WHERE id = p_user_course_package_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Course package not found';
    END IF;
    
    -- 验证课包归属和状态
    IF v_package_record.user_id != p_student_id THEN
        RAISE EXCEPTION 'Course package does not belong to student';
    END IF;
    
    IF v_package_record.status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Course package is not active';
    END IF;
    
    IF v_package_record.expires_at IS NOT NULL AND now() > v_package_record.expires_at THEN
        RAISE EXCEPTION 'Course package has expired';
    END IF;
    
    -- 验证教练和课程匹配
    IF v_package_record.coach_id != v_event_record.coach_id OR 
       v_package_record.course_id != v_event_record.course_id THEN
        RAISE EXCEPTION 'Course package does not match session coach or course';
    END IF;
    
    -- 检查容量
    IF v_event_record.booked_count < v_event_record.capacity THEN
        -- 有容量，直接预约
        IF v_package_record.remaining_credits < 1 THEN
            RAISE EXCEPTION 'Insufficient credits in course package';
        END IF;
        
        -- 插入预约记录
        INSERT INTO public.session_booking (
            event_id, student_id, user_course_package_id, status, booked_at, created_at, updated_at
        ) VALUES (
            p_event_id, p_student_id, p_user_course_package_id, 'CONFIRMED', now(), now(), now()
        ) ON CONFLICT (event_id, student_id) DO UPDATE SET
            status = 'CONFIRMED',
            booked_at = now(),
            cancelled_at = NULL,
            updated_at = now();
        
        -- 扣减课包余额
        UPDATE public.user_course_package
        SET remaining_credits = remaining_credits - 1
        WHERE id = p_user_course_package_id;
        
        -- 增加预约计数
        UPDATE public.coach_calendar_event
        SET booked_count = booked_count + 1
        WHERE id = p_event_id;
        
        v_result := 'CONFIRMED';
    ELSE
        -- 满员，加入等候队列
        -- 计算等候位置
        SELECT COALESCE(MAX(position), 0) + 1 INTO v_waitlist_position
        FROM public.session_waitlist
        WHERE event_id = p_event_id;
        
        -- 插入等候记录
        INSERT INTO public.session_waitlist (
            event_id, student_id, user_course_package_id, position, created_at
        ) VALUES (
            p_event_id, p_student_id, p_user_course_package_id, v_waitlist_position, now()
        ) ON CONFLICT (event_id, student_id) DO NOTHING;
        
        v_result := 'WAITLISTED';
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 2. 取消预约（并尝试自动补位）函数
CREATE OR REPLACE FUNCTION public.cancel_session_booking(
    p_event_id uuid,
    p_student_id uuid
) RETURNS text AS $$
DECLARE
    v_event_record RECORD;
    v_booking_record RECORD;
    v_waitlist_head RECORD;
    v_package_record RECORD;
    v_result TEXT;
BEGIN
    -- 锁定 session 行
    SELECT * INTO v_event_record
    FROM public.coach_calendar_event
    WHERE id = p_event_id AND kind = 'session'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or not a valid session event';
    END IF;
    
    -- 查找并更新预约记录
    SELECT * INTO v_booking_record
    FROM public.session_booking
    WHERE event_id = p_event_id AND student_id = p_student_id AND status = 'CONFIRMED'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN 'NOOP';
    END IF;
    
    -- 取消预约
    UPDATE public.session_booking
    SET status = 'CANCELLED', cancelled_at = now()
    WHERE event_id = p_event_id AND student_id = p_student_id AND status = 'CONFIRMED';
    
    -- 查找等候队列队首
    SELECT * INTO v_waitlist_head
    FROM public.session_waitlist
    WHERE event_id = p_event_id
    ORDER BY position ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF FOUND THEN
        -- 有等候者，自动补位
        -- 验证队首的课包
        SELECT * INTO v_package_record
        FROM public.user_course_package
        WHERE id = v_waitlist_head.user_course_package_id
        FOR UPDATE;
        
        IF v_package_record.status = 'ACTIVE' AND 
           (v_package_record.expires_at IS NULL OR now() <= v_package_record.expires_at) AND
           v_package_record.remaining_credits >= 1 THEN
            
            -- 删除等候记录
            DELETE FROM public.session_waitlist
            WHERE id = v_waitlist_head.id;
            
            -- 为队首创建预约记录
            INSERT INTO public.session_booking (
                event_id, student_id, user_course_package_id, status, booked_at, created_at, updated_at
            ) VALUES (
                p_event_id, v_waitlist_head.student_id, v_waitlist_head.user_course_package_id, 'CONFIRMED', now(), now(), now()
            ) ON CONFLICT (event_id, student_id) DO UPDATE SET
                status = 'CONFIRMED',
                booked_at = now(),
                cancelled_at = NULL,
                updated_at = now();
            
            -- 扣减队首的课包余额
            UPDATE public.user_course_package
            SET remaining_credits = remaining_credits - 1
            WHERE id = v_waitlist_head.user_course_package_id;
            
            -- booked_count 保持不变（取消-1 + 补位+1）
            v_result := 'PROMOTED:' || v_waitlist_head.student_id::text;
        ELSE
            -- 队首课包无效，移除并继续查找下一个
            DELETE FROM public.session_waitlist
            WHERE id = v_waitlist_head.id;
            
            -- 减少预约计数
            UPDATE public.coach_calendar_event
            SET booked_count = GREATEST(booked_count - 1, 0)
            WHERE id = p_event_id;
            
            -- 返还取消者的课包余额
            UPDATE public.user_course_package
            SET remaining_credits = remaining_credits + 1
            WHERE id = v_booking_record.user_course_package_id;
            
            v_result := 'CANCELLED';
        END IF;
    ELSE
        -- 无等候者，减少预约计数并返还课包余额
        UPDATE public.coach_calendar_event
        SET booked_count = GREATEST(booked_count - 1, 0)
        WHERE id = p_event_id;
        
        -- 返还取消者的课包余额
        UPDATE public.user_course_package
        SET remaining_credits = remaining_credits + 1
        WHERE id = v_booking_record.user_course_package_id;
        
        v_result := 'CANCELLED';
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 3. 手动补位函数（供后台/任务使用）
CREATE OR REPLACE FUNCTION public.promote_waitlist_head(
    p_event_id uuid
) RETURNS text AS $$
DECLARE
    v_event_record RECORD;
    v_waitlist_head RECORD;
    v_package_record RECORD;
    v_result TEXT;
BEGIN
    -- 锁定 session 行
    SELECT * INTO v_event_record
    FROM public.coach_calendar_event
    WHERE id = p_event_id AND kind = 'session'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or not a valid session event';
    END IF;
    
    -- 查找等候队列队首
    SELECT * INTO v_waitlist_head
    FROM public.session_waitlist
    WHERE event_id = p_event_id
    ORDER BY position ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF NOT FOUND THEN
        RETURN 'EMPTY';
    END IF;
    
    -- 验证队首的课包
    SELECT * INTO v_package_record
    FROM public.user_course_package
    WHERE id = v_waitlist_head.user_course_package_id
    FOR UPDATE;
    
    IF v_package_record.status != 'ACTIVE' OR 
       (v_package_record.expires_at IS NOT NULL AND now() > v_package_record.expires_at) OR
       v_package_record.remaining_credits < 1 THEN
        -- 队首课包无效，移除
        DELETE FROM public.session_waitlist
        WHERE id = v_waitlist_head.id;
        
        RETURN 'EMPTY';
    END IF;
    
    -- 删除等候记录
    DELETE FROM public.session_waitlist
    WHERE id = v_waitlist_head.id;
    
    -- 为队首创建预约记录
    INSERT INTO public.session_booking (
        event_id, student_id, user_course_package_id, status, booked_at, created_at, updated_at
    ) VALUES (
        p_event_id, v_waitlist_head.student_id, v_waitlist_head.user_course_package_id, 'CONFIRMED', now(), now(), now()
    ) ON CONFLICT (event_id, student_id) DO UPDATE SET
        status = 'CONFIRMED',
        booked_at = now(),
        cancelled_at = NULL,
        updated_at = now();
    
    -- 扣减队首的课包余额
    UPDATE public.user_course_package
    SET remaining_credits = remaining_credits - 1
    WHERE id = v_waitlist_head.user_course_package_id;
    
    -- 增加预约计数
    UPDATE public.coach_calendar_event
    SET booked_count = booked_count + 1
    WHERE id = p_event_id;
    
    v_result := 'PROMOTED:' || v_waitlist_head.student_id::text;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. 教练取消Session（Cascade处理所有相关数据）
CREATE OR REPLACE FUNCTION public.cancel_session_by_coach(
    p_event_id uuid,
    p_coach_id uuid
) RETURNS text AS $$
DECLARE
    v_event_record RECORD;
    v_booking_record RECORD;
    v_waitlist_record RECORD;
    v_package_record RECORD;
    v_refunded_count INTEGER := 0;
    v_waitlist_cleared_count INTEGER := 0;
BEGIN
    -- 锁定 session 行并验证教练权限
    SELECT * INTO v_event_record
    FROM public.coach_calendar_event
    WHERE id = p_event_id AND kind = 'session' AND coach_id = p_coach_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or coach does not have permission to cancel this session';
    END IF;
    
    -- 处理所有已确认的预约：标记为取消并返还课包余额
    FOR v_booking_record IN 
        SELECT * FROM public.session_booking 
        WHERE event_id = p_event_id AND status = 'CONFIRMED'
        FOR UPDATE
    LOOP
        -- 更新预约状态为取消
        UPDATE public.session_booking
        SET status = 'CANCELLED', cancelled_at = now()
        WHERE id = v_booking_record.id;
        
        -- 返还课包余额
        UPDATE public.user_course_package
        SET remaining_credits = remaining_credits + 1
        WHERE id = v_booking_record.user_course_package_id;
        
        v_refunded_count := v_refunded_count + 1;
    END LOOP;
    
    -- 清除所有waitlist记录
    FOR v_waitlist_record IN 
        SELECT * FROM public.session_waitlist 
        WHERE event_id = p_event_id
        FOR UPDATE
    LOOP
        DELETE FROM public.session_waitlist WHERE id = v_waitlist_record.id;
        v_waitlist_cleared_count := v_waitlist_cleared_count + 1;
    END LOOP;
    
    -- 删除session事件
    DELETE FROM public.coach_calendar_event WHERE id = p_event_id;
    
    RETURN 'CANCELLED: refunded=' || v_refunded_count || ', waitlist_cleared=' || v_waitlist_cleared_count;
END;
$$ LANGUAGE plpgsql;

-- 4. 个人日程视图
CREATE OR REPLACE VIEW public.v_student_personal_schedule AS
SELECT
    sb.student_id,
    cce.coach_id,
    cce.course_id,
    sb.user_course_package_id,
    cce.id AS session_event_id,
    cce.title,
    cce.start_ts,
    cce.end_ts,
    cce.capacity,
    cce.booked_count,
    sb.status AS booking_status,
    sb.booked_at,
    sb.cancelled_at
FROM public.session_booking sb
JOIN public.coach_calendar_event cce ON cce.id = sb.event_id
WHERE cce.kind = 'session';

-- =====================================================
-- Availability Booking System Functions
-- 实现「Availability 预约→时间冲突检查→即时确认」功能
-- =====================================================

-- 5. 预约Availability函数
CREATE OR REPLACE FUNCTION public.book_availability(
    p_availability_id uuid,
    p_student_id uuid,
    p_user_course_package_id uuid,
    p_start_time timestamp with time zone,
    p_end_time timestamp with time zone
) RETURNS text AS $$
DECLARE
    v_availability_record RECORD;
    v_package_record RECORD;
    v_existing_booking RECORD;
    v_result TEXT;
BEGIN
    -- 锁定目标 availability 行
    SELECT * INTO v_availability_record
    FROM public.coach_calendar_event
    WHERE id = p_availability_id AND kind = 'availability'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Availability not found or not a valid availability event';
    END IF;
    
    -- 检查是否已经预约过
    SELECT * INTO v_existing_booking
    FROM public.session_booking
    WHERE event_id = p_availability_id AND student_id = p_student_id;
    
    IF FOUND AND v_existing_booking.status = 'CONFIRMED' THEN
        RETURN 'CONFIRMED';
    END IF;
    
    -- 校验课包（同事务内 FOR UPDATE）
    SELECT * INTO v_package_record
    FROM public.user_course_package
    WHERE id = p_user_course_package_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Course package not found';
    END IF;
    
    -- 验证课包归属和状态
    IF v_package_record.user_id != p_student_id THEN
        RAISE EXCEPTION 'Course package does not belong to student';
    END IF;
    
    IF v_package_record.status != 'ACTIVE' THEN
        RAISE EXCEPTION 'Course package is not active';
    END IF;
    
    IF v_package_record.expires_at IS NOT NULL AND now() > v_package_record.expires_at THEN
        RAISE EXCEPTION 'Course package has expired';
    END IF;
    
    -- 验证教练匹配（availability通过availability_courses关联课程）
    IF v_package_record.coach_id != v_availability_record.coach_id THEN
        RAISE EXCEPTION 'Course package does not match availability coach';
    END IF;
    
    -- 验证课程匹配（检查availability是否包含该课程）
    IF NOT EXISTS (
        SELECT 1 FROM public.availability_courses ac
        WHERE ac.availability_id = p_availability_id 
        AND ac.course_id = v_package_record.course_id
    ) THEN
        RAISE EXCEPTION 'Course package does not match availability courses';
    END IF;
    
    -- 验证时间范围
    IF p_start_time < v_availability_record.start_ts OR 
       p_end_time > v_availability_record.end_ts THEN
        RAISE EXCEPTION 'Selected time is outside availability time range';
    END IF;
    
    -- 检查时间冲突（包含前后1小时缓冲）
    IF EXISTS (
        SELECT 1 FROM public.session_booking sb
        JOIN public.coach_calendar_event cce ON sb.event_id = cce.id
        WHERE cce.kind = 'availability'
        AND cce.coach_id = v_availability_record.coach_id
        AND sb.status = 'CONFIRMED'
        AND sb.event_id != p_availability_id
        AND sb.booked_start_time IS NOT NULL
        AND sb.booked_end_time IS NOT NULL
        -- 检查时间重叠（包含1小时缓冲）
        AND NOT (
            p_end_time <= (sb.booked_start_time - INTERVAL '1 hour') OR
            p_start_time >= (sb.booked_end_time + INTERVAL '1 hour')
        )
    ) THEN
        RAISE EXCEPTION 'Time conflict with existing booking (including 1-hour buffer)';
    END IF;
    
    -- 检查课包余额
    IF v_package_record.remaining_credits < 1 THEN
        RAISE EXCEPTION 'Insufficient credits in course package';
    END IF;
    
    -- 插入预约记录（包含具体时间）
    INSERT INTO public.session_booking (
        event_id, student_id, user_course_package_id, status,
        booked_start_time, booked_end_time, booked_at, created_at, updated_at
    ) VALUES (
        p_availability_id, p_student_id, p_user_course_package_id, 'CONFIRMED',
        p_start_time, p_end_time, now(), now(), now()
    ) ON CONFLICT (event_id, student_id) DO UPDATE SET
        status = 'CONFIRMED',
        booked_start_time = p_start_time,
        booked_end_time = p_end_time,
        booked_at = now(),
        cancelled_at = NULL,
        updated_at = now();
    
    -- 扣减课包余额
    UPDATE public.user_course_package
    SET remaining_credits = remaining_credits - 1
    WHERE id = p_user_course_package_id;
    
    -- 增加预约计数
    UPDATE public.coach_calendar_event
    SET booked_count = booked_count + 1
    WHERE id = p_availability_id;
    
    v_result := 'CONFIRMED';
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 6. 取消Availability预约函数
CREATE OR REPLACE FUNCTION public.cancel_availability_booking(
    p_availability_id uuid,
    p_student_id uuid
) RETURNS text AS $$
DECLARE
    v_availability_record RECORD;
    v_booking_record RECORD;
    v_result TEXT;
BEGIN
    -- 锁定 availability 行
    SELECT * INTO v_availability_record
    FROM public.coach_calendar_event
    WHERE id = p_availability_id AND kind = 'availability'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Availability not found or not a valid availability event';
    END IF;
    
    -- 查找并更新预约记录
    SELECT * INTO v_booking_record
    FROM public.session_booking
    WHERE event_id = p_availability_id AND student_id = p_student_id AND status = 'CONFIRMED'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN 'NOOP';
    END IF;
    
    -- 取消预约
    UPDATE public.session_booking
    SET status = 'CANCELLED', cancelled_at = now()
    WHERE event_id = p_availability_id AND student_id = p_student_id AND status = 'CONFIRMED';
    
    -- 减少预约计数
    UPDATE public.coach_calendar_event
    SET booked_count = GREATEST(booked_count - 1, 0)
    WHERE id = p_availability_id;
    
    -- 返还课包余额
    UPDATE public.user_course_package
    SET remaining_credits = remaining_credits + 1
    WHERE id = v_booking_record.user_course_package_id;
    
    v_result := 'CANCELLED';
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 7. 获取Availability可用时段函数（简化版本，不使用临时表）
CREATE OR REPLACE FUNCTION public.get_availability_available_slots(p_availability_id uuid)
RETURNS TABLE (
    slot_start timestamp with time zone,
    slot_end timestamp with time zone,
    duration_minutes bigint
) AS $$
DECLARE
    v_availability_start timestamp with time zone;
    v_availability_end timestamp with time zone;
    v_occupied_start timestamp with time zone;
    v_occupied_end timestamp with time zone;
    v_prev_end timestamp with time zone;
    v_has_bookings boolean := false;
BEGIN
    -- 获取availability的时间范围
    SELECT start_ts, end_ts INTO v_availability_start, v_availability_end
    FROM public.coach_calendar_event
    WHERE id = p_availability_id AND kind = 'availability';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Availability not found';
    END IF;

    -- 初始化前一个结束时间为availability开始时间
    v_prev_end := v_availability_start;

    -- 遍历已占用的时段（包含1小时缓冲）
    FOR v_occupied_start, v_occupied_end IN
        SELECT 
            booked_start_time - INTERVAL '1 hour' as occupied_start,
            booked_end_time + INTERVAL '1 hour' as occupied_end
        FROM public.session_booking sb
        JOIN public.coach_calendar_event cce ON sb.event_id = cce.id
        WHERE cce.id = p_availability_id
        AND cce.kind = 'availability'
        AND sb.status = 'CONFIRMED'
        AND sb.booked_start_time IS NOT NULL
        AND sb.booked_end_time IS NOT NULL
        ORDER BY occupied_start
    LOOP
        v_has_bookings := true;
        
        -- 如果当前占用时段的开始时间晚于前一个结束时间
        -- 说明中间有空隙，添加可用时段
        IF v_occupied_start > v_prev_end THEN
            slot_start := v_prev_end;
            slot_end := v_occupied_start;
            duration_minutes := EXTRACT(EPOCH FROM (slot_end - slot_start)) / 60;
            RETURN NEXT;
        END IF;
        
        -- 更新前一个结束时间为当前占用时段的结束时间（取较大值）
        v_prev_end := GREATEST(v_prev_end, v_occupied_end);
    END LOOP;

    -- 如果没有预约，返回整个availability时段
    IF NOT v_has_bookings THEN
        slot_start := v_availability_start;
        slot_end := v_availability_end;
        duration_minutes := EXTRACT(EPOCH FROM (slot_end - slot_start)) / 60;
        RETURN NEXT;
    ELSE
        -- 添加最后一个可用时段（从最后一个占用时段结束到availability结束）
        IF v_prev_end < v_availability_end THEN
            slot_start := v_prev_end;
            slot_end := v_availability_end;
            duration_minutes := EXTRACT(EPOCH FROM (slot_end - slot_start)) / 60;
            RETURN NEXT;
        END IF;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 8. 添加注释
COMMENT ON FUNCTION public.book_existing_session(uuid, uuid, uuid) IS '预约已有Session，满员时自动加入等候队列';
COMMENT ON FUNCTION public.cancel_session_booking(uuid, uuid) IS '取消预约并尝试自动补位，返还课包余额';
COMMENT ON FUNCTION public.promote_waitlist_head(uuid) IS '手动补位等候队列队首，供后台任务使用';
COMMENT ON FUNCTION public.book_availability(uuid, uuid, uuid, timestamp with time zone, timestamp with time zone) IS '预约Availability时段，包含时间冲突检查和1小时缓冲';
COMMENT ON FUNCTION public.cancel_availability_booking(uuid, uuid) IS '取消Availability预约，返还课包余额';
COMMENT ON FUNCTION public.get_availability_available_slots(uuid) IS '获取Availability的可用时段，考虑已预约时段和1小时缓冲';
COMMENT ON VIEW public.v_student_personal_schedule IS '学员个人日程视图，显示所有已预约的Session';
