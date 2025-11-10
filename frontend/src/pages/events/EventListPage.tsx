import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/components/events/EventCard';
import { EmptyState } from '@/components/events/EmptyState';
import { ErrorState } from '@/components/events/ErrorState';
import { getEvents, getEventCounters, getSports, getUserEvents, deleteEvent } from '@/api/events';
import type { Sport } from '@/api/events';
import { toUTCFromLocal } from '@/utils/datetime';
import { isOnlyOpen } from '@/utils/events';
import type { EventDTO } from '@/types/events';
import { formatZonedNY } from '@/utils/datetime';
import { Plus, Loader2, RotateCcw, Search, Settings, Edit, Trash2, Clock, MapPin, Users } from 'lucide-react';
import { EventAdvancedFilters } from './components/EventAdvancedFilters';

export default function EventListPage() {
  const navigate = useNavigate();
  const [sportId, setSportId] = useState<string>('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [from, setFrom] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  // Advanced filter fields
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [ageBracket, setAgeBracket] = useState<string | null>(null);
  const [genderPolicy, setGenderPolicy] = useState<string | null>(null);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [userEvents, setUserEvents] = useState<EventDTO[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load sports list on mount
  useEffect(() => {
    const loadSports = async () => {
      try {
        const sportsData = await getSports();
        setSports(sportsData);
      } catch (err) {
        console.error('Error loading sports:', err);
      }
    };

    loadSports();
  }, []);

  // Reset all filters
  const handleReset = () => {
    setSportId('');
    setFrom('');
    setCity('');
    setLocation('');
    setOnlyOpen(false);
    setSkillLevel(null);
    setAgeBracket(null);
    setGenderPolicy(null);
  };

  // Search events manually
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: {
        sport_id?: string;
        from?: string;
        city?: string;
        location?: string;
        onlyOpen?: boolean;
        skill_level?: string | null;
        age_bracket?: string | null;
        gender_policy?: string | null;
      } = {};

      if (sportId) {
        filters.sport_id = sportId;
      }
      if (from) {
        filters.from = toUTCFromLocal(from);
      }
      if (city.trim()) {
        filters.city = city.trim();
      }
      if (location.trim()) {
        filters.location = location.trim();
      }
      if (onlyOpen) {
        filters.onlyOpen = true;
      }
      // Advanced filters - pass null to search all, or specific value to filter
      filters.skill_level = skillLevel;
      filters.age_bracket = ageBracket;
      filters.gender_policy = genderPolicy;

      const eventsData = await getEvents(filters);
      setEvents(eventsData);
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Load initial events on mount
  useEffect(() => {
    const loadInitialEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const eventsData = await getEvents({});
        setEvents(eventsData);
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError(err?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    loadInitialEvents();
  }, []);

  // Load user's events when manage dialog opens
  const loadUserEvents = async () => {
    setManageLoading(true);
    try {
      const eventsData = await getUserEvents();
      setUserEvents(eventsData);
    } catch (err: any) {
      console.error('Error loading user events:', err);
      alert(err?.message || 'Failed to load your events');
    } finally {
      setManageLoading(false);
    }
  };

  useEffect(() => {
    if (manageDialogOpen) {
      loadUserEvents();
    }
  }, [manageDialogOpen]);

  const handleEdit = (eventId: string) => {
    setManageDialogOpen(false);
    navigate(`/home/community/events/edit/${eventId}`);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setDeletingId(eventId);
    try {
      await deleteEvent(eventId);
      // Reload user events
      await loadUserEvents();
      // Also reload main events list
      handleSearch();
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert(err?.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6">
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            setLoading(true);
            // Trigger reload
            const filters: any = {};
            if (sportId) filters.sport_id = sportId;
            if (from) filters.from = toUTCFromLocal(from);
            if (city.trim()) filters.city = city.trim();
            if (location.trim()) filters.location = location.trim();
            if (onlyOpen) filters.onlyOpen = true;
            getEvents(filters)
              .then(setEvents)
              .catch((err) => setError(err?.message || 'Failed to load events'))
              .finally(() => setLoading(false));
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setManageDialogOpen(true)}
            variant="outline"
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Events
          </Button>
          <Button
            onClick={() => navigate('/home/community/events/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <div className="flex items-center gap-2">
            <EventAdvancedFilters
              field1={skillLevel}
              field2={ageBracket}
              field3={genderPolicy}
              onField1Change={setSkillLevel}
              onField2Change={setAgeBracket}
              onField3Change={setGenderPolicy}
              onSubmit={handleSearch}
              onReset={() => {
                setSkillLevel(null);
                setAgeBracket(null);
                setGenderPolicy(null);
              }}
              field1Config={{
                label: 'Skill Level',
                options: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
              }}
              field2Config={{
                label: 'Age Bracket',
                options: ['ALL_AGES', 'CHILDREN', 'FORTY_PLUS'],
              }}
              field3Config={{
                label: 'Gender Policy',
                options: ['MALE', 'FEMALE', 'COED'],
              }}
            />
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSearch}
              disabled={loading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="sport" className="text-gray-300 mb-2 block">
              Sport
            </Label>
            <Combobox
              options={sports.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              value={sportId}
              onChange={(value) => setSportId(value)}
              placeholder="Select a sport..."
            />
          </div>

          <div>
            <Label htmlFor="from" className="text-gray-300 mb-2 block">
              From
            </Label>
            <Input
              id="from"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="city" className="text-gray-300 mb-2 block">
              City
            </Label>
            <Input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search by city..."
              className="bg-gray-700 border-gray-600 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="location" className="text-gray-300 mb-2 block">
              Location
            </Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Search by location..."
              className="bg-gray-700 border-gray-600 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>

          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <Switch
                id="only-open"
                checked={onlyOpen}
                onCheckedChange={setOnlyOpen}
                className="data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="only-open" className="text-gray-300 cursor-pointer">
                Only Open Events
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Event List */}
      {events.length === 0 ? (
        <EmptyState
          message="No events found"
          description="Try adjusting your filters to see more events."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}

      {/* Manage Events Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Your Events</DialogTitle>
            <DialogDescription className="text-gray-400">
              Edit or delete your events
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            {manageLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : userEvents.length === 0 ? (
              <EmptyState
                message="No events found"
                description="You haven't created any events yet."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="bg-gray-700 border-gray-600 text-white"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-white pr-4">
                          {event.title}
                        </CardTitle>
                        {event.group_id && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">
                            In Series
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {event.sport && (
                        <div className="text-sm text-gray-300">
                          <span className="font-medium">Sport: </span>
                          {event.sport.name}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-300">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        <span>{formatZonedNY(event.start_at)}</span>
                      </div>
                      {event.city_text && (
                        <div className="text-sm text-gray-300">
                          <span className="font-medium">City: </span>
                          {event.city_text}
                        </div>
                      )}
                      {event.location_text && (
                        <div className="flex items-start text-sm text-gray-300">
                          <MapPin className="h-3 w-3 mr-1 text-gray-400 mt-0.5" />
                          <span className="line-clamp-2">{event.location_text}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-300">
                        <Users className="h-3 w-3 mr-1 text-gray-400" />
                        <span>Capacity: {event.capacity_unit}</span>
                      </div>
                      {(event.skill_level || event.age_bracket || event.gender_policy) && (
                        <div className="flex flex-wrap gap-2">
                          {event.skill_level && (
                            <Badge variant="outline" className="text-xs bg-gray-600 border-gray-500 text-gray-300">
                              {event.skill_level}
                            </Badge>
                          )}
                          {event.age_bracket && (
                            <Badge variant="outline" className="text-xs bg-gray-600 border-gray-500 text-gray-300">
                              {event.age_bracket}
                            </Badge>
                          )}
                          {event.gender_policy && (
                            <Badge variant="outline" className="text-xs bg-gray-600 border-gray-500 text-gray-300">
                              {event.gender_policy}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 border-t border-gray-600">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(event.id)}
                          className="flex-1 bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/30"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(event.id)}
                          disabled={deletingId === event.id}
                          className="flex-1 bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 disabled:opacity-50"
                        >
                          {deletingId === event.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

