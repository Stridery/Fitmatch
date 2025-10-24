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
    alert(`Booking successful!\nStart time: ${new Date(startTime).toLocaleString('en-US')}\nEnd time: ${new Date(endTime).toLocaleString('en-US')}\nPackage ID: ${packageId}`);
    setBookingDialogOpen(false);
  };

  const handleBookingSuccess = () => {
    // 刷新事件列表
    refreshEvents();
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
      
      alert(`Booking successful!\nSession: ${selectedSession.title}\nTime: ${new Date(selectedSession.start_ts).toLocaleString('en-US')} - ${new Date(selectedSession.end_ts).toLocaleString('en-US')}\nPackage ID: ${packageId}\nStatus: ${result.status}`);
      
      // 刷新事件列表
      refreshEvents();
      
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Booking failed: ${errorMessage}`);
    }
  };

  // 处理取消预订
  const handleCancelBooking = (_eventId: string) => {
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
          <h3 className="text-xl font-semibold">{course.course_title || "Untitled Course"}</h3>
          <div className="text-sm text-gray-500 mt-2">
            <span>{course.sport_name || "—"}</span>
            <span className="mx-2">·</span>
            <span>{course.city || "—"}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="course" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="course">Course</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="coach">Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="course" className="mt-4">
            <div className="space-y-4">
              {/* Basic Information */}
              <div>
                <h4 className="font-medium mb-2">Basic Information</h4>
                <div className="space-y-2 text-gray-600">
                  <p>Course ID: {course.course_id}</p>
                  <p>Course Name: {course.course_title}</p>
                  <p>Sport Type: {course.sport_name}</p>
                  <p>Coach Name: {course.coach_name}</p>
                  <p>Coach Nickname: {course.coach_nickname}</p>
                  <p>City: {course.city}</p>
                  <p>Match Score: {Math.round(course.match_score)}%</p>
                </div>
              </div>

              {/* Price Information */}
              <div>
                <h4 className="font-medium mb-2">Price Information</h4>
                <div className="space-y-2 text-gray-600">
                  <p>Minimum Price per Lesson: {course.price_per_lesson ? `¥${course.price_per_lesson.toFixed(2)}` : 'Not available'}</p>
                </div>
              </div>

              {/* Certificate Information */}
              <div>
                <h4 className="font-medium mb-2">Certificate Information</h4>
                <div className="flex flex-wrap gap-2">
                  {course.certificates?.length > 0 ? course.certificates.map(cert => (
                    <Badge key={cert} variant="secondary">{cert}</Badge>
                  )) : <p className="text-gray-600">No certificates</p>}
                </div>
              </div>

              {/* Course Styles */}
              <div>
                <h4 className="font-medium mb-2">Course Styles</h4>
                <div className="flex flex-wrap gap-2">
                  {(course.styles?.length ?? 0) > 0 ? course.styles?.map(style => (
                    <Badge key={style} variant="secondary">{style}</Badge>
                  )) : <p className="text-gray-600">No style information</p>}
                </div>
              </div>

              {/* Communication Styles */}
              <div>
                <h4 className="font-medium mb-2">Communication Styles</h4>
                <div className="flex flex-wrap gap-2">
                  {(course.comm_styles?.length ?? 0) > 0 ? course.comm_styles?.map(style => (
                    <Badge key={style} variant="secondary">{style}</Badge>
                  )) : <p className="text-gray-600">No communication style information</p>}
                </div>
              </div>

              {/* Training Intensity */}
              <div>
                <h4 className="font-medium mb-2">Training Intensity</h4>
                <div className="flex flex-wrap gap-2">
                  {(course.pace_intensities?.length ?? 0) > 0 ? course.pace_intensities?.map(intensity => (
                    <Badge key={intensity} variant="secondary">{intensity}</Badge>
                  )) : <p className="text-gray-600">No intensity information</p>}
                </div>
              </div>

              {/* Preferred Students */}
              <div>
                <h4 className="font-medium mb-2">Preferred Students</h4>
                <div className="flex flex-wrap gap-2">
                  {(course.prefer_students?.length ?? 0) > 0 ? course.prefer_students?.map(student => (
                    <Badge key={student} variant="secondary">{student}</Badge>
                  )) : <p className="text-gray-600">No student preference information</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading...
              </div>
            ) : (
            <SessionAvailabilityList
              events={events}
              onSelectAvailability={handleSelectAvailability}
              onBookSession={handleBookSession}
              onCancelBooking={handleCancelBooking}
              onBookingSuccess={handleBookingSuccess}
              courseId={course?.course_id}
            />
            )}
          </TabsContent>

          <TabsContent value="coach" className="mt-4">
            <div className="space-y-4">
              <p className="text-gray-600">Coach information to be completed</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Availability Booking Dialog */}
        <AvailabilityBookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          availability={selectedAvailability}
          courseId={course.course_id}
          onBookingSuccess={handleBookingSuccess}
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
            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold transition-all duration-200 hover:scale-105 transform"
          >
            Request Time
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}