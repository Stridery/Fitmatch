import React, { useState } from 'react';
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
import WeekView from './WeekView';
import ListView from './ListView';
import FiltersBar from './FiltersBar';
import NewEventDialog from './NewEventDialog';

interface EventData {
  id: string;
  kind: 'session' | 'availability';
  title: string;
  course?: string;
  location?: string;
  startTime: string;
  endTime: string;
  capacity?: string;
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
  const [events, setEvents] = useState<EventData[]>([]);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);

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

  const handleSaveEvent = (eventData: any) => {
    const newEvent: EventData = {
      id: Date.now().toString(),
      kind: newDialogKind!,
      title: eventData.title || 'Untitled Event',
      course: eventData.course,
      location: eventData.location,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      capacity: eventData.capacity
    };
    
    setEvents(prev => [...prev, newEvent]);
    setNewDialogOpen(false);
    setNewDialogKind(null);
    setNewDialogDefaults({ startTs: '', endTs: '' });
  };

  const handleEditEvent = (event: EventData) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
  };

  const handleUpdateEvent = (eventData: any) => {
    if (!editingEvent) return;
    
    const updatedEvent: EventData = {
      ...editingEvent,
      title: eventData.title || 'Untitled Event',
      course: eventData.course,
      location: eventData.location,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      capacity: eventData.capacity
    };
    
    setEvents(prev => prev.map(event => 
      event.id === editingEvent.id ? updatedEvent : event
    ));
    setEditDialogOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setEditDialogOpen(false);
    setEditingEvent(null);
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
      />
    </div>
  );
}
