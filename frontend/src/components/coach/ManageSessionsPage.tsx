import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  startOfWeekMonday, 
  endOfWeekSunday, 
  formatRangeLabel, 
  addDays,
  getBrowserTimezoneLabel 
} from '@/lib/timeGrid';
import { 
  getCoachCalendarEventsForWeek, 
  createCoachCalendarEvent, 
  updateCoachCalendarEvent, 
  deleteCoachCalendarEvent,
  getCoachCourses 
} from '@/api/coachCalendar';
import { createAvailability, updateAvailability, deleteAvailability, getCoachAvailabilities } from '@/api/availability';
import type { CoachCalendarEvent, CoachCourse } from '@/api/coachCalendar';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import WeekView from './WeekView';
import ListView from './ListView';
import FiltersBar from './FiltersBar';
import NewEventDialog from './NewEventDialog';

// Helper function to format date for datetime-local input (keeps local timezone)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Convert database event to UI event format
function convertDbEventToUI(dbEvent: any) {
  // 处理不同的字段名：Supabase使用start_ts/end_ts，availability API使用startTs/endTs
  const startTs = dbEvent.start_ts || dbEvent.startTs;
  const endTs = dbEvent.end_ts || dbEvent.endTs;
  
  // 将UTC时间字符串转换为本地时间字符串，用于datetime-local输入
  const formatUtcToLocal = (utcString: string) => {
    // 确保时间字符串格式正确，处理不同的时间格式
    let timeStr = utcString;
    
    // 如果时间字符串没有Z后缀，添加Z表示UTC时间
    if (timeStr && !timeStr.endsWith('Z') && !timeStr.includes('+')) {
      timeStr = timeStr + 'Z';
    }
    
    const date = new Date(timeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const uiEvent = {
    id: dbEvent.id,
    kind: dbEvent.kind,
    title: dbEvent.title || '',
    course: dbEvent.course_id || dbEvent.courseId || '',
    courses: [] as string[], // 新增：多选课程数组
    location: dbEvent.location || '',
    startTime: formatUtcToLocal(startTs), // 将UTC时间转换为本地时间字符串
    endTime: formatUtcToLocal(endTs),     // 将UTC时间转换为本地时间字符串
    capacity: dbEvent.capacity?.toString() || ''
  };

  // 对于availability，如果有courses数据则添加
  if (dbEvent.kind === 'availability' && (dbEvent as any).courses) {
    uiEvent.courses = (dbEvent as any).courses;
  }

  return uiEvent;
}

// Convert UI event to database format
function convertUIEventToDb(uiEvent: any, coachId: string) {
  // 修复时区问题：将datetime-local格式当作本地时间处理
  // datetime-local格式：2024-01-15T14:30 (本地时间)
  // 直接使用ISO字符串，避免双重时区转换
  const startDate = new Date(uiEvent.startTime + ':00'); // 添加秒数
  const endDate = new Date(uiEvent.endTime + ':00');     // 添加秒数
  
  const dbEvent = {
    coach_id: coachId,
    kind: uiEvent.kind,
    course_id: uiEvent.kind === 'session' ? (uiEvent.course || null) : null, // Session使用course_id，availability设为null
    title: uiEvent.title || null,
    location: uiEvent.location || null,
    start_ts: startDate.toISOString(), // 转换为UTC时间字符串
    end_ts: endDate.toISOString(),     // 转换为UTC时间字符串
    capacity: uiEvent.capacity ? parseInt(uiEvent.capacity) : null
  };

  // 暂时注释掉courses字段，避免Supabase错误
  // TODO: 切换到后端API后启用
  // if (uiEvent.kind === 'availability' && uiEvent.courses) {
  //   (dbEvent as any).courses = uiEvent.courses;
  // }

  return dbEvent;
}

export default function ManageSessionsPage() {
  const { user } = useUser(); // 使用UserContext获取用户信息
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [activeTab, setActiveTab] = useState<'week' | 'list'>('week');
  const [filters, setFilters] = useState({
    courseId: '',
    kinds: [] as string[],
    locationKeyword: ''
  });
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newDialogKind, setNewDialogKind] = useState<'session' | 'availability' | null>(null);
  const [newDialogDefaults, setNewDialogDefaults] = useState<{ startTs: string; endTs: string }>({
    startTs: '',
    endTs: ''
  });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CoachCourse[]>([]);
  const [allCourses, setAllCourses] = useState<CoachCourse[]>([]); // 所有课程（用于Session）
  const [oneOnOneCourses, setOneOnOneCourses] = useState<CoachCourse[]>([]); // 1v1课程（用于Availability）
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  // Cleanup function
  const cleanupModalStyles = () => {
    // Remove stuck pointer-events: none
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.pointerEvents = '';
    }
    
    // Remove stuck overflow: hidden
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
    
    // Remove modal-related classes
    const modalClasses = ['overflow-hidden', 'fixed', 'inset-0'];
    modalClasses.forEach(className => {
      if (document.body.classList.contains(className)) {
        document.body.classList.remove(className);
      }
    });
  };

  // Cleanup on component unmount
  React.useEffect(() => {
    return () => {
      cleanupModalStyles();
    };
  }, []);

  // Fix: Clean up stuck modal styles when dialog closes
  React.useEffect(() => {
    if (!newDialogOpen) {
      // Try immediate cleanup
      cleanupModalStyles();
      
      // Also try delayed cleanup in case the dialog component hasn't finished yet
      setTimeout(cleanupModalStyles, 50);
      setTimeout(cleanupModalStyles, 100);
      setTimeout(cleanupModalStyles, 200);
    }
  }, [newDialogOpen]);

  const weekEnd = endOfWeekSunday(weekStart);
  const weekRangeLabel = formatRangeLabel(weekStart, weekEnd);
  const timezoneLabel = getBrowserTimezoneLabel();

  // Load events from database
  const loadEvents = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // 计算当前周的结束时间
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
            // 并行加载session和availability数据，都按周过滤
            const [sessionEvents, availabilityEvents] = await Promise.all([
              getCoachCalendarEventsForWeek(user.id, weekStart),
              getCoachAvailabilities(user.id, weekStart.toISOString(), weekEnd.toISOString())
            ]);
      
      console.log('Loaded events:', {
        sessionCount: sessionEvents.length,
        availabilityCount: availabilityEvents.length,
        sessionEvents: sessionEvents.map(e => ({ id: e.id, kind: e.kind, title: e.title })),
        availabilityEvents: availabilityEvents.map(e => ({ id: e.id, kind: e.kind, title: e.title }))
      });
      
      // 合并所有事件
      const allDbEvents = [...sessionEvents, ...availabilityEvents];
      
      // 转换为UI格式
      const uiEvents = allDbEvents.map(convertDbEventToUI);
      setEvents(uiEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load coach courses
  const loadCourses = async () => {
    if (!user?.id) return;
    
    console.log('loadCourses: loading courses for user', user.id);
    try {
      const coachCourses = await getCoachCourses(user.id);
      console.log('loadCourses: loaded courses', coachCourses.length, coachCourses);
      
      // 存储所有课程（用于Session）
      setAllCourses(coachCourses);
      
      // 过滤出只支持1v1的课程（用于Availability）
      const oneOnOneCourses = coachCourses.filter(course => 
        course.training_modes?.includes('1v1')
      );
      setOneOnOneCourses(oneOnOneCourses);
      
      // 保持向后兼容，默认使用1v1课程
      setCourses(oneOnOneCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Load events and courses when user changes
  useEffect(() => {
    console.log('ManageSessionsPage: user changed', user?.id, user?.email);
    if (user?.id) {
      loadEvents();
      loadCourses();
    }
  }, [user?.id, weekStart]);

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const handleThisWeek = () => {
    setWeekStart(startOfWeekMonday(new Date()));
  };

  const handleJumpToWeek = (date: Date) => {
    setWeekStart(startOfWeekMonday(date));
  };

  const handleNewEvent = (kind: 'session' | 'availability', startTs: string, endTs: string) => {
    setNewDialogKind(kind);
    setNewDialogDefaults({ startTs, endTs });
    setNewDialogOpen(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    if (!user?.id) return;
    
    try {
      if (newDialogKind === 'availability') {
        // 对于availability，使用与session相同的时区转换逻辑
        // 使用convertUIEventToDb统一处理时间转换
        const dbEventData = convertUIEventToDb({
          ...eventData,
          kind: 'availability'
        }, user.id);
        
        const availabilityRequest = {
          coachId: user.id,
          title: dbEventData.title,
          startTs: dbEventData.start_ts, // 使用convertUIEventToDb转换后的UTC时间
          endTs: dbEventData.end_ts,     // 使用convertUIEventToDb转换后的UTC时间
          location: dbEventData.location,
          courseIds: eventData.courses || []
        };
        
        console.log('Availability time (Local -> UTC):', {
          localStart: eventData.startTime,
          localEnd: eventData.endTime,
          utcStart: dbEventData.start_ts,
          utcEnd: dbEventData.end_ts,
          request: availabilityRequest
        });
        
        await createAvailability(availabilityRequest);
      } else {
        // 使用Supabase API创建session
        const dbEventData = convertUIEventToDb({
          ...eventData,
          kind: newDialogKind!
        }, user.id);
        
        await createCoachCalendarEvent(dbEventData);
      }
      
      await loadEvents(); // Reload events from database
      
      setNewDialogOpen(false);
      setNewDialogKind(null);
      setNewDialogDefaults({ startTs: '', endTs: '' });
    } catch (error) {
      console.error('Error saving event:', error);
      // You could add a toast notification here
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
  };

  const handleUpdateEvent = async (eventData: any) => {
    if (!editingEvent || !user?.id) return;
    
    try {
      if (editingEvent.kind === 'availability') {
        // 使用和session一样的数据格式更新availability
        const dbEventData = convertUIEventToDb({
          ...eventData,
          kind: 'availability'
        }, user.id);
        
        // 转换为后端API格式
        const availabilityRequest = {
          availabilityId: editingEvent.id,
          coachId: user.id,
          title: dbEventData.title,
          location: dbEventData.location,
          startTs: dbEventData.start_ts,
          endTs: dbEventData.end_ts,
          courseIds: eventData.courses || []
        };
        
        await updateAvailability(availabilityRequest);
      } else {
        // 使用Supabase API更新session
        const dbEventData = convertUIEventToDb(eventData, user.id);
        await updateCoachCalendarEvent(editingEvent.id, dbEventData);
      }
      
      await loadEvents(); // Reload events from database
      
      setEditDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      // You could add a toast notification here
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user?.id) return;
    
    try {
      // 查找要删除的事件
      const eventToDelete = events.find(e => e.id === eventId);
      
      if (eventToDelete?.kind === 'availability') {
        // 使用后端API删除availability
        await deleteAvailability(eventId, user.id);
      } else {
        // 使用Supabase API删除session
        await deleteCoachCalendarEvent(eventId);
      }
      
      await loadEvents(); // Reload events from database
      
      setEditDialogOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      // You could add a toast notification here
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Manage Sessions
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Week-by-week schedule (30-min grid)
            </p>
          </div>
          <div className="text-sm text-gray-400">
            All times in <span className="font-medium">{timezoneLabel}</span>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-white">
              {weekRangeLabel}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              className="flex items-center space-x-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev Week</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="flex items-center space-x-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
            >
              <span>Next Week</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Jump to Week</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="end">
                <Calendar
                  mode="single"
                  selected={weekStart}
                  onSelect={(date) => date && handleJumpToWeek(date)}
                  initialFocus
                  className="[&_button]:text-white [&_button]:hover:bg-gray-700"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <FiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        onNewEvent={(kind) => {
          setNewDialogKind(kind);
          setNewDialogDefaults({ startTs: '', endTs: '' });
          setNewDialogOpen(true);
        }}
        courses={courses}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'week' | 'list')} className="h-full">
          <div className="px-6 py-4 border-b border-gray-700">
            <TabsList className="grid w-64 grid-cols-2 bg-gray-800 border-gray-700">
              <TabsTrigger value="week" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">Week</TabsTrigger>
              <TabsTrigger value="list" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-700">List</TabsTrigger>
            </TabsList>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-400">Loading events...</div>
            </div>
          ) : (
            <>
              <TabsContent value="week" className="h-full m-0">
                <WeekView
                  weekStart={weekStart}
                  events={events}
                  onNewEvent={handleNewEvent}
                  onEditEvent={handleEditEvent}
                />
              </TabsContent>

              <TabsContent value="list" className="h-full m-0">
                <ListView weekStart={weekStart} events={events} onEditEvent={handleEditEvent} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* New Event Dialog */}
      <NewEventDialog
        open={newDialogOpen}
        onOpenChange={(open) => {
          setNewDialogOpen(open);
          if (!open) {
            // Reset dialog state when closing
            setNewDialogKind(null);
            setNewDialogDefaults({ startTs: '', endTs: '' });
          }
        }}
        kind={newDialogKind}
        defaults={newDialogDefaults}
        onSave={handleSaveEvent}
        courses={newDialogKind === 'session' ? allCourses : oneOnOneCourses}
      />

      {/* Edit Event Dialog */}
      <NewEventDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingEvent(null);
          }
        }}
        kind={editingEvent?.kind || null}
        defaults={{
          startTs: editingEvent?.startTime || '',
          endTs: editingEvent?.endTime || ''
        }}
        onSave={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        editingEvent={editingEvent}
        courses={editingEvent?.kind === 'session' ? allCourses : oneOnOneCourses}
      />
    </div>
  );
}
