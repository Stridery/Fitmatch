import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getSports, getUserEventGroups, createEvent, updateEvent, getEvent } from '@/api/events';
import type { Sport, EventGroupDTO } from '@/api/events';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toUTCFromLocal, toLocalFromUTC } from '@/utils/datetime';

interface FormValues {
  title: string;
  sport_id: string;
  start_at: string;
  end_at: string;
  city_text: string;
  location_text: string;
  capacity_unit: string;
  is_listed: boolean;
  rsvp_deadline: string;
  group_id: string;
  skill_level: string | null;
  age_bracket: string | null;
  gender_policy: string | null;
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sports, setSports] = useState<Sport[]>([]);
  const [userSeries, setUserSeries] = useState<EventGroupDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [formValues, setFormValues] = useState<FormValues>({
    title: '',
    sport_id: '',
    start_at: '',
    end_at: '',
    city_text: '',
    location_text: '',
    capacity_unit: '',
    is_listed: true,
    rsvp_deadline: '',
    group_id: '',
    skill_level: null,
    age_bracket: null,
    gender_policy: null,
  });

  // Load sports list on mount and when combobox opens
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

  // Load user's event groups (series) on mount
  useEffect(() => {
    const loadUserSeries = async () => {
      try {
        const seriesData = await getUserEventGroups();
        setUserSeries(seriesData);
      } catch (err) {
        console.error('Error loading user series:', err);
      }
    };

    loadUserSeries();
  }, []);

  // Load event data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadEventData = async () => {
        setLoadingData(true);
        try {
          const eventData = await getEvent(id);
          if (eventData) {
            setFormValues({
              title: eventData.title || '',
              sport_id: eventData.sport_id || '',
              start_at: toLocalFromUTC(eventData.start_at),
              end_at: toLocalFromUTC(eventData.end_at),
              city_text: eventData.city_text || '',
              location_text: eventData.location_text || '',
              capacity_unit: eventData.capacity_unit.toString(),
              is_listed: eventData.is_listed,
              rsvp_deadline: eventData.rsvp_deadline ? toLocalFromUTC(eventData.rsvp_deadline) : '',
              group_id: eventData.group_id || '',
              skill_level: eventData.skill_level || null,
              age_bracket: eventData.age_bracket || null,
              gender_policy: eventData.gender_policy || null,
            });
          } else {
            alert('Event not found');
            navigate('/home/community/events');
          }
        } catch (err: any) {
          console.error('Error loading event:', err);
          alert(err?.message || 'Failed to load event');
          navigate('/home/community/events');
        } finally {
          setLoadingData(false);
        }
      };

      loadEventData();
    }
  }, [isEditMode, id, navigate]);

  // Handle search in combobox - load sports with search query
  const handleSportSearch = async (searchQuery: string) => {
    try {
      const sportsData = await getSports(searchQuery);
      setSports(sportsData);
    } catch (err) {
      console.error('Error searching sports:', err);
    }
  };

  // Handle series selection - auto-fill skill_level, age_bracket, gender_policy
  const handleSeriesChange = (seriesId: string) => {
    const selectedSeries = userSeries.find(s => s.id === seriesId);
    if (selectedSeries) {
      setFormValues({
        ...formValues,
        group_id: seriesId,
        skill_level: selectedSeries.skill_level || null,
        age_bracket: selectedSeries.age_bracket || null,
        gender_policy: selectedSeries.gender_policy || null,
      });
    } else {
      // Clear if no series selected
      setFormValues({
        ...formValues,
        group_id: '',
        skill_level: null,
        age_bracket: null,
        gender_policy: null,
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formValues.sport_id) {
      newErrors.sport_id = 'Sport is required';
    }

    if (!formValues.start_at) {
      newErrors.start_at = 'Start time is required';
    }

    if (!formValues.end_at) {
      newErrors.end_at = 'End time is required';
    }

    if (formValues.start_at && formValues.end_at) {
      const startUTC = toUTCFromLocal(formValues.start_at);
      const endUTC = toUTCFromLocal(formValues.end_at);
      if (endUTC <= startUTC) {
        newErrors.end_at = 'End time must be after start time';
      }
    }

    if (!formValues.location_text.trim()) {
      newErrors.location_text = 'Location is required';
    }

    if (!formValues.capacity_unit) {
      newErrors.capacity_unit = 'Capacity is required';
    } else {
      const capacity = parseInt(formValues.capacity_unit);
      if (isNaN(capacity) || capacity <= 0) {
        newErrors.capacity_unit = 'Capacity must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (isEditMode && id) {
        // Update existing event
        await updateEvent(id, {
          title: formValues.title.trim(),
          sport_id: formValues.sport_id,
          start_at: toUTCFromLocal(formValues.start_at),
          end_at: toUTCFromLocal(formValues.end_at),
          city_text: formValues.city_text.trim() || null,
          location_text: formValues.location_text.trim(),
          capacity_unit: parseInt(formValues.capacity_unit),
          is_listed: formValues.is_listed,
          rsvp_deadline: formValues.rsvp_deadline
            ? toUTCFromLocal(formValues.rsvp_deadline)
            : null,
          group_id: formValues.group_id || null,
          skill_level: formValues.skill_level || null,
          age_bracket: formValues.age_bracket || null,
          gender_policy: formValues.gender_policy || null,
        });

        // Show success message
        alert('Event updated successfully!');
      } else {
        // Create new event
        await createEvent({
          title: formValues.title.trim(),
          sport_id: formValues.sport_id,
          start_at: toUTCFromLocal(formValues.start_at),
          end_at: toUTCFromLocal(formValues.end_at),
          city_text: formValues.city_text.trim() || null,
          location_text: formValues.location_text.trim(),
          capacity_unit: parseInt(formValues.capacity_unit),
          is_listed: formValues.is_listed,
          rsvp_deadline: formValues.rsvp_deadline
            ? toUTCFromLocal(formValues.rsvp_deadline)
            : null,
          group_id: formValues.group_id || null,
          skill_level: formValues.skill_level || null,
          age_bracket: formValues.age_bracket || null,
          gender_policy: formValues.gender_policy || null,
        });

        // Show success message
        alert('Event created successfully!');
      }

      // Navigate back to events list
      navigate('/home/community/events');
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, err);
      setErrors({
        submit: err?.message || `Failed to ${isEditMode ? 'update' : 'create'} event. Please try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/home/community/events')}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
          <Button
            onClick={() => navigate('/home/community/events/series/new')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Create Series
          </Button>
        </div>
      </div>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              {isEditMode ? 'Edit Event' : 'Create New Event'}
            </CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-gray-300 mb-2 block">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                id="title"
                value={formValues.title}
                onChange={(e) =>
                  setFormValues({ ...formValues, title: e.target.value })
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sport" className="text-gray-300 mb-2 block">
                Sport <span className="text-red-400">*</span>
              </Label>
              <Combobox
                options={sports.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                value={formValues.sport_id}
                onChange={(value) => {
                  setFormValues({ ...formValues, sport_id: value });
                }}
                onSearch={handleSportSearch}
                placeholder="Search and select a sport..."
              />
              {errors.sport_id && (
                <p className="text-red-400 text-sm mt-1">{errors.sport_id}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_at" className="text-gray-300 mb-2 block">
                  Start Time <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="start_at"
                  type="datetime-local"
                  value={formValues.start_at}
                  onChange={(e) =>
                    setFormValues({ ...formValues, start_at: e.target.value })
                  }
                  className="bg-gray-700 border-gray-600 text-white"
                />
                {errors.start_at && (
                  <p className="text-red-400 text-sm mt-1">{errors.start_at}</p>
                )}
              </div>

              <div>
                <Label htmlFor="end_at" className="text-gray-300 mb-2 block">
                  End Time <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="end_at"
                  type="datetime-local"
                  value={formValues.end_at}
                  onChange={(e) =>
                    setFormValues({ ...formValues, end_at: e.target.value })
                  }
                  className="bg-gray-700 border-gray-600 text-white"
                />
                {errors.end_at && (
                  <p className="text-red-400 text-sm mt-1">{errors.end_at}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="city_text" className="text-gray-300 mb-2 block">
                City
              </Label>
              <Input
                id="city_text"
                type="text"
                value={formValues.city_text}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    city_text: e.target.value,
                  })
                }
                placeholder="Enter city name..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label
                htmlFor="location_text"
                className="text-gray-300 mb-2 block"
              >
                Location <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="location_text"
                value={formValues.location_text}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    location_text: e.target.value,
                  })
                }
                className="bg-gray-700 border-gray-600 text-white"
                rows={2}
              />
              {errors.location_text && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.location_text}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="series" className="text-gray-300 mb-2 block">
                Series (Optional)
              </Label>
              <Combobox
                options={userSeries.map((s) => ({
                  value: s.id,
                  label: `${s.title} (${s.group_type})`,
                }))}
                value={formValues.group_id}
                onChange={handleSeriesChange}
                placeholder="Select a series to link this event to..."
              />
              <p className="text-gray-400 text-xs mt-1">
                Selecting a series will auto-fill skill level, age bracket, and gender policy
              </p>
            </div>

            <div>
              <Label className="text-gray-300 mb-2 block">Skill Level</Label>
              <ToggleGroup
                type="single"
                value={formValues.skill_level || ''}
                onValueChange={(value) => {
                  setFormValues({
                    ...formValues,
                    skill_level: value || null,
                  });
                }}
                className="justify-start gap-2"
              >
                <ToggleGroupItem
                  value=""
                  aria-label="None"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  None
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="BEGINNER"
                  aria-label="BEGINNER"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  BEGINNER
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="INTERMEDIATE"
                  aria-label="INTERMEDIATE"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  INTERMEDIATE
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="ADVANCED"
                  aria-label="ADVANCED"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  ADVANCED
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
              <Label className="text-gray-300 mb-2 block">Age Bracket</Label>
              <ToggleGroup
                type="single"
                value={formValues.age_bracket || ''}
                onValueChange={(value) => {
                  setFormValues({
                    ...formValues,
                    age_bracket: value || null,
                  });
                }}
                className="justify-start gap-2"
              >
                <ToggleGroupItem
                  value=""
                  aria-label="None"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  None
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="ALL_AGES"
                  aria-label="ALL_AGES"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  ALL_AGES
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="CHILDREN"
                  aria-label="CHILDREN"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  CHILDREN
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="FORTY_PLUS"
                  aria-label="FORTY_PLUS"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  FORTY_PLUS
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
              <Label className="text-gray-300 mb-2 block">Gender Policy</Label>
              <ToggleGroup
                type="single"
                value={formValues.gender_policy || ''}
                onValueChange={(value) => {
                  setFormValues({
                    ...formValues,
                    gender_policy: value || null,
                  });
                }}
                className="justify-start gap-2"
              >
                <ToggleGroupItem
                  value=""
                  aria-label="None"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  None
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="MALE"
                  aria-label="MALE"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  MALE
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="FEMALE"
                  aria-label="FEMALE"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  FEMALE
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="COED"
                  aria-label="COED"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  COED
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {errors.submit && (
              <div className="text-red-400 text-sm mt-2">{errors.submit}</div>
            )}

            <div>
              <Label
                htmlFor="capacity_unit"
                className="text-gray-300 mb-2 block"
              >
                Capacity <span className="text-red-400">*</span>
              </Label>
              <Input
                id="capacity_unit"
                type="number"
                min="1"
                value={formValues.capacity_unit}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    capacity_unit: e.target.value,
                  })
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
              {errors.capacity_unit && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.capacity_unit}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="rsvp_deadline" className="text-gray-300 mb-2 block">
                RSVP Deadline (Optional)
              </Label>
              <Input
                id="rsvp_deadline"
                type="datetime-local"
                value={formValues.rsvp_deadline}
                onChange={(e) =>
                  setFormValues({ ...formValues, rsvp_deadline: e.target.value })
                }
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_listed"
                checked={formValues.is_listed}
                onChange={(e) =>
                  setFormValues({
                    ...formValues,
                    is_listed: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="is_listed" className="text-gray-300 cursor-pointer">
                List this event publicly
              </Label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/home/community/events')}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditMode ? 'Update Event' : 'Create Event'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

