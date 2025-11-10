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
import { SeriesCard } from '@/components/events/SeriesCard';
import { EmptyState } from '@/components/events/EmptyState';
import { ErrorState } from '@/components/events/ErrorState';
import { getSports, getEventGroups, getUserEventGroups, deleteEventGroup } from '@/api/events';
import type { Sport, EventGroupDTO } from '@/api/events';
import { Plus, Loader2, RotateCcw, Search, Settings, Edit, Trash2 } from 'lucide-react';
import { EventAdvancedFilters } from './components/EventAdvancedFilters';

export default function SeriesListPage() {
  const navigate = useNavigate();
  const [sportId, setSportId] = useState<string>('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  // Advanced filter fields
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [ageBracket, setAgeBracket] = useState<string | null>(null);
  const [genderPolicy, setGenderPolicy] = useState<string | null>(null);
  const [series, setSeries] = useState<EventGroupDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [userSeries, setUserSeries] = useState<EventGroupDTO[]>([]);
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
    setCity('');
    setLocation('');
    setOnlyOpen(false);
    setSkillLevel(null);
    setAgeBracket(null);
    setGenderPolicy(null);
  };

  // Search series manually
  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: {
        sport_id?: string;
        city?: string;
        location?: string;
        skill_level?: string | null;
        age_bracket?: string | null;
        gender_policy?: string | null;
        onlyOpen?: boolean;
      } = {};

      if (sportId) {
        filters.sport_id = sportId;
      }
      if (city.trim()) {
        filters.city = city.trim();
      }
      if (location.trim()) {
        filters.location = location.trim();
      }
      if (skillLevel) {
        filters.skill_level = skillLevel;
      }
      if (ageBracket) {
        filters.age_bracket = ageBracket;
      }
      if (genderPolicy) {
        filters.gender_policy = genderPolicy;
      }
      if (onlyOpen) {
        filters.onlyOpen = true;
      }

      const seriesData = await getEventGroups(filters);
      setSeries(seriesData);
    } catch (err: any) {
      console.error('Error loading series:', err);
      setError(err?.message || 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  // Load initial series on mount
  useEffect(() => {
    const loadInitialSeries = async () => {
      setLoading(true);
      setError(null);
      try {
        const seriesData = await getEventGroups({});
        setSeries(seriesData);
      } catch (err: any) {
        console.error('Error loading series:', err);
        setError(err?.message || 'Failed to load series');
      } finally {
        setLoading(false);
      }
    };
    loadInitialSeries();
  }, []);

  // Load user's series when manage dialog opens
  const loadUserSeries = async () => {
    setManageLoading(true);
    try {
      const seriesData = await getUserEventGroups();
      setUserSeries(seriesData);
    } catch (err: any) {
      console.error('Error loading user series:', err);
      alert(err?.message || 'Failed to load your series');
    } finally {
      setManageLoading(false);
    }
  };

  useEffect(() => {
    if (manageDialogOpen) {
      loadUserSeries();
    }
  }, [manageDialogOpen]);

  const handleEdit = (seriesId: string) => {
    setManageDialogOpen(false);
    navigate(`/home/community/events/series/edit/${seriesId}`);
  };

  const handleDelete = async (seriesId: string) => {
    if (!confirm('Are you sure you want to delete this series? This action cannot be undone.')) {
      return;
    }

    setDeletingId(seriesId);
    try {
      await deleteEventGroup(seriesId);
      // Reload user series
      await loadUserSeries();
      // Also reload main series list
      handleSearch();
    } catch (err: any) {
      console.error('Error deleting series:', err);
      alert(err?.message || 'Failed to delete series');
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
            handleSearch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Series</h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setManageDialogOpen(true)}
            variant="outline"
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Series
          </Button>
          <Button
            onClick={() => navigate('/home/community/events/series/new')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Series
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Only Open Series
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Series List */}
      {series.length === 0 ? (
        <EmptyState
          message="No series found"
          description="Try adjusting your filters to see more series."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.map((s) => (
            <SeriesCard
              key={s.id}
              series={s}
            />
          ))}
        </div>
      )}

      {/* Manage Series Dialog */}
      <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Manage Your Series</DialogTitle>
            <DialogDescription className="text-gray-400">
              Edit or delete your series and competitions
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            {manageLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : userSeries.length === 0 ? (
              <EmptyState
                message="No series found"
                description="You haven't created any series yet."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSeries.map((s) => (
                  <Card
                    key={s.id}
                    className="bg-gray-700 border-gray-600 text-white"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-white pr-4">
                          {s.title}
                        </CardTitle>
                        <Badge
                          className={
                            s.group_type === 'SERIES'
                              ? 'bg-green-500/20 text-green-400 border-green-500/50'
                              : 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                          }
                        >
                          {s.group_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {s.sport && (
                        <div className="text-sm text-gray-300">
                          <span className="font-medium">Sport: </span>
                          {s.sport.name}
                        </div>
                      )}
                      {(s.skill_level || s.age_bracket || s.gender_policy) && (
                        <div className="flex flex-wrap gap-2">
                          {s.skill_level && (
                            <Badge variant="outline" className="text-xs bg-gray-600 border-gray-500 text-gray-300">
                              {s.skill_level}
                            </Badge>
                          )}
                          {s.age_bracket && (
                            <Badge variant="outline" className="text-xs bg-gray-600 border-gray-500 text-gray-300">
                              {s.age_bracket}
                            </Badge>
                          )}
                          {s.gender_policy && (
                            <Badge variant="outline" className="text-xs bg-gray-600 border-gray-500 text-gray-300">
                              {s.gender_policy}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 border-t border-gray-600">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(s.id)}
                          className="flex-1 bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/30"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          className="flex-1 bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 disabled:opacity-50"
                        >
                          {deletingId === s.id ? (
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

