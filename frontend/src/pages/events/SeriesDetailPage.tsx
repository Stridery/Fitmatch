import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/events/ErrorState';
import { EventMiniCard } from '@/components/events/EventMiniCard';
import { getEventGroup, getEventsByGroupId } from '@/api/events';
import type { EventGroupDTO } from '@/api/events';
import type { EventDTO } from '@/types/events';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [series, setSeries] = useState<EventGroupDTO | null>(null);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load series data
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [seriesData, eventsData] = await Promise.all([
          getEventGroup(id),
          getEventsByGroupId(id).catch(() => []), // Don't fail if this errors
        ]);

        if (!seriesData) {
          setError('Series not found');
          return;
        }

        setSeries(seriesData);
        setEvents(eventsData);
      } catch (err: any) {
        console.error('Error loading series:', err);
        setError(err?.message || 'Failed to load series');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const getGroupTypeBadge = () => {
    if (!series) return null;
    if (series.group_type === 'SERIES') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
          SERIES
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
          COMPETITION
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            setLoading(true);
            if (id) {
              getEventGroup(id)
                .then((data) => {
                  if (data) {
                    setSeries(data);
                    getEventsByGroupId(id).then(setEvents).catch(() => setEvents([]));
                  } else {
                    setError('Series not found');
                  }
                })
                .catch((err) => setError(err?.message || 'Failed to load series'))
                .finally(() => setLoading(false));
            }
          }}
        />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <ErrorState
          message="Series not found"
          onRetry={() => navigate('/home/community/series')}
        />
      </div>
    );
  }

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

      <Card className="bg-gray-800 border-gray-700 text-white mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-2xl font-bold text-white pr-4">
              {series.title}
            </CardTitle>
            {getGroupTypeBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {series.description && (
            <div>
              <div className="text-sm text-gray-400 mb-2">Description</div>
              <div className="text-white whitespace-pre-wrap">{series.description}</div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {series.sport && (
              <div>
                <div className="text-sm text-gray-400">Sport</div>
                <div className="text-white font-medium">{series.sport.name}</div>
              </div>
            )}
          </div>

          {/* Enum Fields */}
          {(series.skill_level || series.age_bracket || series.gender_policy) && (
            <div className="border-t border-gray-700 pt-4">
              <div className="text-sm text-gray-400 mb-2">Details</div>
              <div className="flex flex-wrap gap-2">
                {series.skill_level && (
                  <Badge variant="outline" className="bg-gray-700 border-gray-600 text-gray-300">
                    {series.skill_level}
                  </Badge>
                )}
                {series.age_bracket && (
                  <Badge variant="outline" className="bg-gray-700 border-gray-600 text-gray-300">
                    {series.age_bracket}
                  </Badge>
                )}
                {series.gender_policy && (
                  <Badge variant="outline" className="bg-gray-700 border-gray-600 text-gray-300">
                    {series.gender_policy}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Created Info */}
          <div className="border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400">
              Created: {new Date(series.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events in this Series */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Events in this {series.group_type === 'SERIES' ? 'Series' : 'Competition'} ({events.length})
        </h2>
        {events.length === 0 ? (
          <div className="text-gray-400 text-sm py-4">
            No events found in this {series.group_type === 'SERIES' ? 'series' : 'competition'}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventMiniCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

