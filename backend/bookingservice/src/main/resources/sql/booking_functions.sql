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
            event_id, student_id, user_course_package_id, status, booked_at
        ) VALUES (
            p_event_id, p_student_id, p_user_course_package_id, 'CONFIRMED', now()
        ) ON CONFLICT (event_id, student_id) DO UPDATE SET
            status = 'CONFIRMED',
            booked_at = now(),
            cancelled_at = NULL;
        
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
                event_id, student_id, user_course_package_id, status, booked_at
            ) VALUES (
                p_event_id, v_waitlist_head.student_id, v_waitlist_head.user_course_package_id, 'CONFIRMED', now()
            ) ON CONFLICT (event_id, student_id) DO UPDATE SET
                status = 'CONFIRMED',
                booked_at = now(),
                cancelled_at = NULL;
            
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
        event_id, student_id, user_course_package_id, status, booked_at
    ) VALUES (
        p_event_id, v_waitlist_head.student_id, v_waitlist_head.user_course_package_id, 'CONFIRMED', now()
    ) ON CONFLICT (event_id, student_id) DO UPDATE SET
        status = 'CONFIRMED',
        booked_at = now(),
        cancelled_at = NULL;
    
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

-- 5. 添加注释
COMMENT ON FUNCTION public.book_existing_session(uuid, uuid, uuid) IS '预约已有Session，满员时自动加入等候队列';
COMMENT ON FUNCTION public.cancel_session_booking(uuid, uuid) IS '取消预约并尝试自动补位，返还课包余额';
COMMENT ON FUNCTION public.promote_waitlist_head(uuid) IS '手动补位等候队列队首，供后台任务使用';
COMMENT ON VIEW public.v_student_personal_schedule IS '学员个人日程视图，显示所有已预约的Session';
