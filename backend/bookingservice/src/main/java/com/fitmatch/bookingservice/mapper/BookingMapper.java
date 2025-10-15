package com.fitmatch.bookingservice.mapper;

import com.fitmatch.bookingservice.dto.ScheduleItem;
import com.fitmatch.bookingservice.dto.WaitlistItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface BookingMapper {
    
    /**
     * 预约已有Session
     * @param eventId 事件ID
     * @param studentId 学生ID
     * @param userCoursePackageId 用户课包ID
     * @return 'CONFIRMED' | 'WAITLISTED'
     */
    String bookExistingSession(
        @Param("eventId") UUID eventId,
        @Param("studentId") UUID studentId,
        @Param("userCoursePackageId") UUID userCoursePackageId
    );
    
    /**
     * 取消预约（并尝试自动补位）
     * @param eventId 事件ID
     * @param studentId 学生ID
     * @return 'CANCELLED' | 'PROMOTED:<student_id>' | 'NOOP'
     */
    String cancelSessionBooking(
        @Param("eventId") UUID eventId,
        @Param("studentId") UUID studentId
    );
    
    /**
     * 手动补位等候队列队首
     * @param eventId 事件ID
     * @return 'PROMOTED:<student_id>' | 'EMPTY'
     */
    String promoteWaitlistHead(@Param("eventId") UUID eventId);
    
    /**
     * 获取学生个人日程
     * @param studentId 学生ID
     * @param fromDate 开始日期
     * @param toDate 结束日期
     * @return 日程列表
     */
    List<ScheduleItem> getStudentPersonalSchedule(
        @Param("studentId") UUID studentId,
        @Param("fromDate") String fromDate,
        @Param("toDate") String toDate
    );
    
    /**
     * 获取用户waitlist记录
     * @param studentId 学生ID
     * @return waitlist列表
     */
    List<WaitlistItem> getUserWaitlist(@Param("studentId") UUID studentId);
    
    /**
     * 退出waitlist
     * @param eventId 事件ID
     * @param studentId 学生ID
     * @return 删除的记录数
     */
    int exitWaitlist(
        @Param("eventId") UUID eventId,
        @Param("studentId") UUID studentId
    );
    
    /**
     * 教练取消Session（Cascade处理）
     * @param eventId 事件ID
     * @param coachId 教练ID
     * @return 处理结果
     */
    String cancelSessionByCoach(
        @Param("eventId") UUID eventId,
        @Param("coachId") UUID coachId
    );
}
