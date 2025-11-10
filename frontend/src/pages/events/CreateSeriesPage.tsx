import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getSports, createEventGroup, updateEventGroup, getEventGroup } from '@/api/events';
import type { Sport } from '@/api/events';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface FormValues {
  title: string;
  sport_id: string;
  group_type: 'SERIES' | 'COMPETITION';
  description: string;
  city: string;
  location: string;
  skill_level: string | null;
  age_bracket: string | null;
  gender_policy: string | null;
}

export default function CreateSeriesPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [formValues, setFormValues] = useState<FormValues>({
    title: '',
    sport_id: '',
    group_type: 'SERIES',
    description: '',
    city: '',
    location: '',
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

  // Load series data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadSeriesData = async () => {
        setLoadingData(true);
        try {
          const seriesData = await getEventGroup(id);
          if (seriesData) {
            setFormValues({
              title: seriesData.title || '',
              sport_id: seriesData.sport_id || '',
              group_type: seriesData.group_type || 'SERIES',
              description: seriesData.description || '',
              city: seriesData.city || '',
              location: seriesData.location || '',
              skill_level: seriesData.skill_level || null,
              age_bracket: seriesData.age_bracket || null,
              gender_policy: seriesData.gender_policy || null,
            });
          } else {
            alert('Series not found');
            navigate('/home/community/series');
          }
        } catch (err: any) {
          console.error('Error loading series:', err);
          alert(err?.message || 'Failed to load series');
          navigate('/home/community/series');
        } finally {
          setLoadingData(false);
        }
      };

      loadSeriesData();
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formValues.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formValues.sport_id) {
      newErrors.sport_id = 'Sport is required';
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
        // Update existing series
        await updateEventGroup(id, {
          title: formValues.title.trim(),
          sport_id: formValues.sport_id,
          group_type: formValues.group_type,
          description: formValues.description.trim() || null,
          city: formValues.city.trim() || null,
          location: formValues.location.trim() || null,
          skill_level: formValues.skill_level || null,
          age_bracket: formValues.age_bracket || null,
          gender_policy: formValues.gender_policy || null,
        });

        // Show success message
        alert(`${formValues.group_type === 'SERIES' ? 'Series' : 'Competition'} updated successfully!`);
      } else {
        // Create new series
        await createEventGroup({
          title: formValues.title.trim(),
          sport_id: formValues.sport_id,
          group_type: formValues.group_type,
          description: formValues.description.trim() || null,
          city: formValues.city.trim() || null,
          location: formValues.location.trim() || null,
          skill_level: formValues.skill_level || null,
          age_bracket: formValues.age_bracket || null,
          gender_policy: formValues.gender_policy || null,
        });

        // Show success message
        alert(`${formValues.group_type === 'SERIES' ? 'Series' : 'Competition'} created successfully!`);
      }

      // Navigate back to series list
      navigate('/home/community/series');
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event group:`, err);
      setErrors({
        submit: err?.message || `Failed to ${isEditMode ? 'update' : 'create'} event group. Please try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/home/community/series')}
        className="mb-6 text-gray-300 hover:text-white hover:bg-gray-800"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Series
      </Button>

      {loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              {isEditMode ? 'Edit Series/Competition' : 'Create New Series/Competition'}
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
                placeholder="Enter series or competition title..."
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

            <div>
              <Label className="text-gray-300 mb-2 block">
                Type <span className="text-red-400">*</span>
              </Label>
              <ToggleGroup
                type="single"
                value={formValues.group_type}
                onValueChange={(value) => {
                  if (value === 'SERIES' || value === 'COMPETITION') {
                    setFormValues({ ...formValues, group_type: value });
                  }
                }}
                className="justify-start gap-2"
              >
                <ToggleGroupItem
                  value="SERIES"
                  aria-label="Series"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  Series
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="COMPETITION"
                  aria-label="Competition"
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-gray-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-500 hover:bg-gray-600 hover:text-white"
                >
                  Competition
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-300 mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={formValues.description}
                onChange={(e) =>
                  setFormValues({ ...formValues, description: e.target.value })
                }
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Enter series or competition description..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-gray-300 mb-2 block">
                  City
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formValues.city}
                  onChange={(e) =>
                    setFormValues({ ...formValues, city: e.target.value })
                  }
                  placeholder="Enter city name..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-gray-300 mb-2 block">
                  Location
                </Label>
                <Input
                  id="location"
                  type="text"
                  value={formValues.location}
                  onChange={(e) =>
                    setFormValues({ ...formValues, location: e.target.value })
                  }
                  placeholder="Enter location..."
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
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

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/home/community/series')}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                disabled={loading}
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
                  isEditMode
                    ? `Update ${formValues.group_type === 'SERIES' ? 'Series' : 'Competition'}`
                    : `Create ${formValues.group_type === 'SERIES' ? 'Series' : 'Competition'}`
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

