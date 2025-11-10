import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/events/ErrorState';
import { formatZonedNY } from '@/utils/datetime';
import { isOnlyOpen } from '@/utils/events';
import {
  getEvent,
  getEventCounters,
  getUserRegistration,
  getEnrolledUsers,
  rpcJoinEvent,
  rpcCancelEvent,
  mapRpcErrorToMessage,
  type EnrolledUser,
} from '@/api/events';
import type { EventDTO, RegistrationDTO } from '@/types/events';
import { ArrowLeft, Clock, MapPin, Users, Calendar, Loader2, Building2, ExternalLink } from 'lucide-react';
import { UserProfileDialog } from '@/components/events/UserProfileDialog';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const nowUTC = new Date().toISOString();

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [counters, setCounters] = useState({ enrolled_count: 0, waitlist_count: 0 });
  const [userRegistration, setUserRegistration] = useState<RegistrationDTO | null>(null);
  const [enrolledUsers, setEnrolledUsers] = useState<EnrolledUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Load event data
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eventData, countersData, registrationData, enrolledUsersData] = await Promise.all([
          getEvent(id),
          getEventCounters(id),
          getUserRegistration(id),
          getEnrolledUsers(id).catch(() => []), // Don't fail if this errors
        ]);

        if (!eventData) {
          setError('Event not found');
          return;
        }

        setEvent(eventData);
        setCounters(countersData);
        setUserRegistration(registrationData);
        setEnrolledUsers(enrolledUsersData);
      } catch (err: any) {
        console.error('Error loading event:', err);
        setError(err?.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Refresh counters after action
  const refreshCounters = async () => {
    if (!id) return;
    try {
      const [countersData, enrolledUsersData] = await Promise.all([
        getEventCounters(id),
        getEnrolledUsers(id).catch(() => []),
      ]);
      setCounters(countersData);
      setEnrolledUsers(enrolledUsersData);
    } catch (err) {
      console.error('Error refreshing counters:', err);
    }
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setProfileDialogOpen(true);
  };

  // Refresh user registration after action
  const refreshUserRegistration = async () => {
    if (!id) return;
    try {
      const registrationData = await getUserRegistration(id);
      setUserRegistration(registrationData);
    } catch (err) {
      console.error('Error refreshing registration:', err);
    }
  };

  const handleJoin = async () => {
    if (!id || !event) return;

    setActionLoading(true);
    try {
      const result = await rpcJoinEvent(id);
      
      // Refresh data
      await Promise.all([refreshCounters(), refreshUserRegistration()]);

      // Show success message
      if (result.status === 'ENROLLED') {
        alert('Enrolled successfully');
      } else {
        alert('Added to waitlist');
      }
    } catch (err: any) {
      console.error('Error joining event:', err);
      const errorMsg = mapRpcErrorToMessage(err);
      alert(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !event) return;

    if (!confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await rpcCancelEvent(id);
      
      // Refresh data
      await Promise.all([refreshCounters(), refreshUserRegistration()]);

      // Show success message
      if (result.promoted_user) {
        alert('Cancelled successfully, waitlist user promoted');
      } else {
        alert('Cancelled successfully');
      }
    } catch (err: any) {
      console.error('Error cancelling event:', err);
      const errorMsg = mapRpcErrorToMessage(err);
      alert(errorMsg);
    } finally {
      setActionLoading(false);
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

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <ErrorState message={error || 'Event not found'} />
      </div>
    );
  }

  const remaining = Math.max(0, event.capacity_unit - counters.enrolled_count);
  const isOpen = isOnlyOpen(event, counters, nowUTC);
  const isUserEnrolled = userRegistration?.status === 'ENROLLED';
  const isUserWaitlisted = userRegistration?.status === 'WAITLIST';
  const isUserCancelled = userRegistration?.status === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto py-6">

      <Button
        variant="ghost"
        onClick={() => navigate('/home/community/events')}
        className="mb-6 text-gray-300 hover:text-white hover:bg-gray-800"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </Button>

      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-2xl font-bold text-white pr-4">
              {event.title}
            </CardTitle>
            {isUserEnrolled && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                Enrolled
              </Badge>
            )}
            {isUserWaitlisted && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                Waitlist #{userRegistration.waitlist_pos}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">Start Time</div>
                <div className="text-white font-medium">
                  {formatZonedNY(event.start_at)}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">End Time</div>
                <div className="text-white font-medium">
                  {formatZonedNY(event.end_at)}
                </div>
              </div>
            </div>

            {event.city_text && (
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-400">City</div>
                  <div className="text-white font-medium">
                    {event.city_text}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">Location</div>
                <div className="text-white font-medium">
                  {event.location_text}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-400">Sport</div>
                <div className="text-white font-medium">
                  {event.sport?.name || 'Unknown'}
                </div>
              </div>
            </div>
          </div>

          {/* Capacity & Registration */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-start space-x-3 mb-4">
              <Users className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">Capacity</div>
                <div className="text-white font-medium mb-2">
                  {counters.enrolled_count} / {event.capacity_unit} enrolled
                  {counters.waitlist_count > 0 && (
                    <span className="text-gray-400 ml-2">
                      ({counters.waitlist_count} on waitlist)
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  {remaining > 0 ? `${remaining} spots remaining` : 'Full'}
                </div>
                
                {/* Show waitlist position if user is waitlisted */}
                {isUserWaitlisted && userRegistration.waitlist_pos && (
                  <div className="text-sm text-blue-400 mb-3">
                    Your waitlist position: #{userRegistration.waitlist_pos}
                  </div>
                )}
                
                {/* Enrolled Users List */}
                {enrolledUsers.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-400 mb-2">Enrolled Users:</div>
                    <div className="flex flex-wrap gap-2">
                      {enrolledUsers.map((user) => (
                        <button
                          key={user.user_id}
                          onClick={() => handleUserClick(user.user_id)}
                          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors cursor-pointer"
                        >
                          {user.nickname || 'Anonymous'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t border-gray-700 pt-4 space-y-2">
            {event.rsvp_deadline && (
              <div className="text-sm">
                <span className="text-gray-400">RSVP Deadline: </span>
                <span className="text-white">
                  {formatZonedNY(event.rsvp_deadline)}
                </span>
              </div>
            )}
            {event.group_type !== 'SINGLE' && (
              <div className="text-sm">
                <span className="text-gray-400">Group Type: </span>
                <span className="text-white">{event.group_type}</span>
                {event.group_id && (
                  <span className="text-gray-400 ml-2">
                    (Group ID: {event.group_id})
                  </span>
                )}
              </div>
            )}
          </div>

              {/* CTA Area */}
              <div className="border-t border-gray-700 pt-4">
                {isUserEnrolled ? (
              <div className="text-center py-4 space-y-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50 mb-2">
                  已报名
                </Badge>
                <div>
                  <Button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Cancel Registration'
                    )}
                  </Button>
                </div>
              </div>
            ) : isUserWaitlisted ? (
              <div className="text-center py-4 space-y-2">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 mb-2">
                  候补中
                </Badge>
                <div>
                  <Button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    variant="outline"
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Exit Waitlist'
                    )}
                  </Button>
                </div>
              </div>
            ) : isOpen ? (
              <div className="text-center py-4">
                <Button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : remaining > 0 ? (
                    'Join Event'
                  ) : (
                    'Join Waitlist'
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400">
                  {remaining === 0
                    ? 'Event is full'
                    : event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date(nowUTC)
                    ? 'RSVP deadline has passed'
                    : 'Registration is not available'}
                </p>
              </div>
            )}
          </div>

          {/* View Series Button */}
          {event.group_id && (
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/home/community/series/${event.group_id}`)}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Series
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Profile Dialog */}
      {selectedUserId && (
        <UserProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          userId={selectedUserId}
        />
      )}
    </div>
  );
}

