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
import { createAvailability, updateAvailability, deleteAvailability } from '@/api/availability';
import type { CoachCalendarEvent, CoachCourse } from '@/api/coachCalendar';
import { supabase } from '@/lib/supabase';
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
function convertDbEventToUI(dbEvent: CoachCalendarEvent) {
  // Parse UTC timestamp from database and convert to local Date object
  const startDate = new Date(dbEvent.start_ts);
  const endDate = new Date(dbEvent.end_ts);
  
  const uiEvent = {
    id: dbEvent.id,
    kind: dbEvent.kind,
    title: dbEvent.title || '',
    course: dbEvent.course_id || '',
    courses: [] as string[], // 新增：多选课程数组
    location: dbEvent.location || '',
    startTime: formatDateTimeLocal(startDate), // Format for datetime-local input (local time)
    endTime: formatDateTimeLocal(endDate), // Format for datetime-local input (local time)
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
  // Convert local datetime to UTC for database storage
  const startDate = new Date(uiEvent.startTime);
  const endDate = new Date(uiEvent.endTime);
  
  const dbEvent = {
    coach_id: coachId,
    kind: uiEvent.kind,
    course_id: uiEvent.kind === 'session' ? (uiEvent.course || null) : null, // Session使用course_id，availability设为null
    title: uiEvent.title || null,
    location: uiEvent.location || null,
    start_ts: startDate.toISOString(),
    end_ts: endDate.toISOString(),
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
  const [coachId, setCoachId] = useState<string>('');
  const [courses, setCourses] = useState<CoachCourse[]>([]);
  
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
    if (!coachId) return;
    
    setLoading(true);
    try {
      const dbEvents = await getCoachCalendarEventsForWeek(coachId, weekStart);
      const uiEvents = dbEvents.map(convertDbEventToUI);
      setEvents(uiEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load coach courses (only 1v1 courses for availability)
  const loadCourses = async () => {
    if (!coachId) return;
    
    try {
      const coachCourses = await getCoachCourses(coachId);
      // 过滤出只支持1v1的课程（MVP阶段限制）
      const oneOnOneCourses = coachCourses.filter(course => 
        course.training_modes?.includes('1v1')
      );
      setCourses(oneOnOneCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Load coach ID and events on component mount and week change
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCoachId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (coachId) {
      loadEvents();
      loadCourses();
    }
  }, [coachId, weekStart]);

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
    if (!coachId) return;
    
    try {
      if (newDialogKind === 'availability') {
        // 使用后端API创建availability
        const availabilityRequest = {
          coachId: coachId,
          title: eventData.title,
          location: eventData.location,
          // 修复时区问题：将本地时间当作UTC时间发送
          startTs: eventData.startTime + ":00.000Z", // 添加秒和毫秒，标记为UTC
          endTs: eventData.endTime + ":00.000Z",     // 添加秒和毫秒，标记为UTC
          courseIds: eventData.courses || []
        };
        
        await createAvailability(availabilityRequest);
      } else {
        // 使用Supabase API创建session
        const dbEventData = convertUIEventToDb({
          ...eventData,
          kind: newDialogKind!
        }, coachId);
        
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
    if (!editingEvent || !coachId) return;
    
    try {
      if (editingEvent.kind === 'availability') {
        // 使用后端API更新availability
        const availabilityRequest = {
          availabilityId: editingEvent.id,
          coachId: coachId,
          title: eventData.title,
          location: eventData.location,
          // 修复时区问题：将本地时间当作UTC时间发送
          startTs: eventData.startTime + ":00.000Z", // 添加秒和毫秒，标记为UTC
          endTs: eventData.endTime + ":00.000Z",     // 添加秒和毫秒，标记为UTC
          courseIds: eventData.courses || []
        };
        
        await updateAvailability(availabilityRequest);
      } else {
        // 使用Supabase API更新session
        const dbEventData = convertUIEventToDb(eventData, coachId);
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
    if (!coachId) return;
    
    try {
      // 查找要删除的事件
      const eventToDelete = events.find(e => e.id === eventId);
      
      if (eventToDelete?.kind === 'availability') {
        // 使用后端API删除availability
        await deleteAvailability(eventId, coachId);
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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Sessions
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Week-by-week schedule (30-min grid)
            </p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            All times in <span className="font-medium">{timezoneLabel}</span>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {weekRangeLabel}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev Week</span>
            </Button>


            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="flex items-center space-x-1"
            >
              <span>Next Week</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Jump to Week</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={weekStart}
                  onSelect={(date) => date && handleJumpToWeek(date)}
                  initialFocus
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
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <TabsList className="grid w-64 grid-cols-2">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-500 dark:text-gray-400">Loading events...</div>
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
        courses={courses}
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
        courses={courses}
      />
    </div>
  );
}
