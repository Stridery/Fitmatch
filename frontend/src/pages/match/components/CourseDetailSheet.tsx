import { useState, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { CourseSearchItem } from "../types";
import SessionAvailabilityList from "@/components/course/SessionAvailabilityList";
import AvailabilityBookingDialog from "@/components/course/AvailabilityBookingDialog";
import SessionBookingDialog from "@/components/course/SessionBookingDialog";
import { getCoachSessionsByCourse } from "@/api/coachCalendar";
import type { CoachCalendarEvent } from "@/api/coachCalendar";
import api from "@/api/client";

interface CourseDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseSearchItem | null;
}

export function CourseDetailSheet({ open, onOpenChange, course }: CourseDetailSheetProps) {
  const [events, setEvents] = useState<CoachCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<CoachCalendarEvent | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CoachCalendarEvent | null>(null);
  const [sessionBookingDialogOpen, setSessionBookingDialogOpen] = useState(false);

  // Load sessions and availabilities when course changes
  useEffect(() => {
    const loadEvents = async () => {
      if (!course?.course_id || !open) {
        //console.log('[CourseDetailSheet] Skipping load - course_id:', course?.course_id, 'open:', open);
        return;
      }
      
      //console.log('[CourseDetailSheet] Loading events for course:', course.course_id);
      setLoading(true);
      try {
        const data = await getCoachSessionsByCourse(course.course_id);
        //console.log('[CourseDetailSheet] Loaded events:', data);
        setEvents(data);
      } catch (error) {
        //console.error('[CourseDetailSheet] Error loading events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [course?.course_id, open]);

  const handleSelectAvailability = (availability: CoachCalendarEvent) => {
    setSelectedAvailability(availability);
    setBookingDialogOpen(true);
  };

  const handleConfirmBooking = (startTime: string, endTime: string, packageId: string) => {
    // TODO: Implement booking logic
    console.log('Booking confirmed:', { 
      startTime, 
      endTime, 
      packageId,
      courseId: course?.course_id,
      availability: selectedAvailability 
    });
    // For now, just show confirmation
    alert(`预约成功！\n开始时间: ${new Date(startTime).toLocaleString('zh-CN')}\n结束时间: ${new Date(endTime).toLocaleString('zh-CN')}\n套餐ID: ${packageId}`);
    setBookingDialogOpen(false);
  };

  const handleBookSession = (session: CoachCalendarEvent) => {
    // 处理Session报名
    setSelectedSession(session);
    setSessionBookingDialogOpen(true);
  };

  const handleSessionBookingConfirm = async (packageId: string) => {
    if (!selectedSession) return;
    
    try {
      // 调用预订API
      const { data: result } = await api.post('/bookings/session', {
        eventId: selectedSession.id,
        userCoursePackageId: packageId
      });
      
      console.log('Session booking confirmed:', {
        session: selectedSession,
        packageId,
        courseId: course?.course_id,
        result
      });
      
      alert(`报名成功！\nSession: ${selectedSession.title}\n时间: ${new Date(selectedSession.start_ts).toLocaleString('zh-CN')} - ${new Date(selectedSession.end_ts).toLocaleString('zh-CN')}\n套餐ID: ${packageId}\n状态: ${result.status}`);
      
      // 刷新事件列表
      refreshEvents();
      
    } catch (error) {
      console.error('Booking error:', error);
      alert(`报名失败: ${error.message}`);
    }
  };

  // 处理取消预订
  const handleCancelBooking = (eventId: string) => {
    // 刷新事件列表以更新状态
    refreshEvents();
  };

  // 刷新事件列表的通用函数
  const refreshEvents = async () => {
    if (!course?.course_id) return;
    setLoading(true);
    try {
      const data = await getCoachSessionsByCourse(course.course_id);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {/* 顶部摘要 */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold">{course.course_title || "未命名课程"}</h3>
          <div className="text-sm text-gray-500 mt-2">
            <span>{course.sport_name || "—"}</span>
            <span className="mx-2">·</span>
            <span>{course.city || "—"}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="course" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="course">课程</TabsTrigger>
            <TabsTrigger value="schedule">排期</TabsTrigger>
            <TabsTrigger value="coach">教练</TabsTrigger>
          </TabsList>

          <TabsContent value="course" className="mt-4">
            <div className="space-y-4">
              {/* 基本信息 */}
              <div>
                <h4 className="font-medium mb-2">基本信息</h4>
                <div className="space-y-2 text-gray-600">
                  <p>课程ID：{course.course_id}</p>
                  <p>课程名称：{course.course_title}</p>
                  <p>运动类型：{course.sport_name}</p>
                  <p>教练姓名：{course.coach_name}</p>
                  <p>教练昵称：{course.coach_nickname}</p>
                  <p>城市：{course.city}</p>
                  <p>匹配度：{Math.round(course.match_score)}%</p>
                </div>
              </div>

              {/* 价格信息 */}
              <div>
                <h4 className="font-medium mb-2">价格信息</h4>
                <div className="space-y-2 text-gray-600">
                  <p>每课最低价：{course.price_per_lesson ? `¥${course.price_per_lesson.toFixed(2)}` : '暂无'}</p>
                </div>
              </div>

              {/* 证书信息 */}
              <div>
                <h4 className="font-medium mb-2">证书信息</h4>
                <div className="flex flex-wrap gap-2">
                  {course.certificates?.length > 0 ? course.certificates.map(cert => (
                    <Badge key={cert} variant="secondary">{cert}</Badge>
                  )) : <p className="text-gray-600">暂无证书</p>}
                </div>
              </div>

              {/* 课程风格 */}
              <div>
                <h4 className="font-medium mb-2">课程风格</h4>
                <div className="flex flex-wrap gap-2">
                  {(course.styles?.length ?? 0) > 0 ? course.styles?.map(style => (
                    <Badge key={style} variant="secondary">{style}</Badge>
                  )) : <p className="text-gray-600">暂无风格信息</p>}
                </div>
              </div>

              {/* 沟通风格 */}
              <div>
                <h4 className="font-medium mb-2">沟通风格</h4>
                <div className="flex flex-wrap gap-2">
                  {(course.comm_styles?.length ?? 0) > 0 ? course.comm_styles?.map(style => (
                    <Badge key={style} variant="secondary">{style}</Badge>
                  )) : <p className="text-gray-600">暂无沟通风格信息</p>}
                </div>
              </div>

              {/* 训练强度 */}
              <div>
                <h4 className="font-medium mb-2">训练强度</h4>
                <div className="flex flex-wrap gap-2">
                  {(course.pace_intensities?.length ?? 0) > 0 ? course.pace_intensities?.map(intensity => (
                    <Badge key={intensity} variant="secondary">{intensity}</Badge>
                  )) : <p className="text-gray-600">暂无强度信息</p>}
                </div>
              </div>

              {/* 适合学员 */}
              <div>
                <h4 className="font-medium mb-2">适合学员</h4>
                <div className="flex flex-wrap gap-2">
                  {(course.prefer_students?.length ?? 0) > 0 ? course.prefer_students?.map(student => (
                    <Badge key={student} variant="secondary">{student}</Badge>
                  )) : <p className="text-gray-600">暂无学员偏好信息</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                加载中...
              </div>
            ) : (
              <SessionAvailabilityList 
                events={events}
                onSelectAvailability={handleSelectAvailability}
                onBookSession={handleBookSession}
                onCancelBooking={handleCancelBooking}
              />
            )}
          </TabsContent>

          <TabsContent value="coach" className="mt-4">
            <div className="space-y-4">
              <p className="text-gray-600">教练信息待完善</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Availability Booking Dialog */}
        <AvailabilityBookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          availability={selectedAvailability}
          courseId={course.course_id}
          onConfirm={handleConfirmBooking}
        />

        {/* Session Booking Dialog */}
        <SessionBookingDialog
          open={sessionBookingDialogOpen}
          onOpenChange={setSessionBookingDialogOpen}
          session={selectedSession}
          courseId={course.course_id}
          onConfirm={handleSessionBookingConfirm}
        />

        {/* CTA */}
        <div className="mt-8">
          <button
            className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            请求时间
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}