import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface UserProfile {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  gender: string | null;
  birthday: string | null;
  country: string | null;
  city: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  current_training_frequency: string | null;
  mbti_type: string | null;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  userId,
}: UserProfileDialogProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('user_profile')
          .select('user_id, nickname, avatar_url, gender, birthday, country, city, height_cm, weight_kg, current_training_frequency, mbti_type')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          setError('User profile not found');
          return;
        }

        setProfile(data);
      } catch (err: any) {
        console.error('Error loading user profile:', err);
        setError(err?.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [open, userId]);

  const getInitials = (nickname: string | null) => {
    if (!nickname) return 'U';
    return nickname
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">User Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm py-4">{error}</div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Avatar and Nickname */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-gray-700 text-gray-300">
                  {getInitials(profile.nickname)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold text-white">
                  {profile.nickname || 'Anonymous User'}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-3 pt-4 border-t border-gray-700">
              {profile.gender && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Gender</span>
                  <span className="text-white">{profile.gender}</span>
                </div>
              )}

              {profile.birthday && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Birthday</span>
                  <span className="text-white">{formatDate(profile.birthday)}</span>
                </div>
              )}

              {profile.country && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Country</span>
                  <span className="text-white">{profile.country}</span>
                </div>
              )}

              {profile.city && (
                <div className="flex justify-between">
                  <span className="text-gray-400">City</span>
                  <span className="text-white">{profile.city}</span>
                </div>
              )}

              {(profile.height_cm || profile.weight_kg) && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Physical Stats</span>
                  <span className="text-white">
                    {profile.height_cm && `${profile.height_cm} cm`}
                    {profile.height_cm && profile.weight_kg && ' • '}
                    {profile.weight_kg && `${profile.weight_kg} kg`}
                  </span>
                </div>
              )}

              {profile.current_training_frequency && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Training Frequency</span>
                  <span className="text-white">{profile.current_training_frequency}</span>
                </div>
              )}

              {profile.mbti_type && (
                <div className="flex justify-between">
                  <span className="text-gray-400">MBTI Type</span>
                  <span className="text-white">{profile.mbti_type}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm py-4">No profile found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

