import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar } from 'lucide-react';

interface DeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventType?: 'session' | 'availability';
  eventTitle?: string;
  eventTime?: string;
}

export default function DeleteConfirm({ 
  open, 
  onOpenChange, 
  eventId, 
  eventType = 'session',
  eventTitle = 'Untitled Event',
  eventTime 
}: DeleteConfirmProps) {
  const handleDelete = () => {
    // Placeholder - no actual deletion
    console.log('Delete event:', { eventId, eventType, eventTitle });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getKindColor = () => {
    switch (eventType) {
      case 'session':
        return 'bg-green-500';
      case 'availability':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getKindLabel = () => {
    switch (eventType) {
      case 'session':
        return 'Session';
      case 'availability':
        return 'Availability';
      default:
        return 'Event';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Delete Event</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <p className="text-gray-900 dark:text-white font-medium mb-2">
              Are you sure you want to delete this event?
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getKindColor()}`}></div>
                <Badge variant="secondary">{getKindLabel()}</Badge>
              </div>
              <p className="font-medium text-gray-900 dark:text-white">{eventTitle}</p>
              {eventTime && (
                <div className="flex items-center justify-center space-x-1 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{eventTime}</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone. All associated data will be permanently removed.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled>
            Delete Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
