import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, AlertCircle } from 'lucide-react';
import type { CoachCalendarEvent } from '@/api/coachCalendar';

interface AvailabilityBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availability: CoachCalendarEvent | null;
  onConfirm: (startTime: string, endTime: string) => void;
}

function formatDateTimeLocal(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDisplayDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AvailabilityBookingDialog({
  open,
  onOpenChange,
  availability,
  onConfirm
}: AvailabilityBookingDialogProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (availability && open) {
      // Set default values to availability's time range
      setStartTime(formatDateTimeLocal(availability.start_ts));
      setEndTime(formatDateTimeLocal(availability.end_ts));
      setError('');
    }
  }, [availability, open]);

  const handleConfirm = () => {
    if (!availability) return;

    // Validation
    const start = new Date(startTime);
    const end = new Date(endTime);
    const availabilityStart = new Date(availability.start_ts);
    const availabilityEnd = new Date(availability.end_ts);

    // Check if times are valid
    if (start >= end) {
      setError('结束时间必须晚于开始时间');
      return;
    }

    // Check if within availability range
    if (start < availabilityStart || end > availabilityEnd) {
      setError('选择的时间必须在可预约时段内');
      return;
    }

    // Check minimum duration (e.g., 30 minutes)
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (durationMinutes < 30) {
      setError('课程时长至少需要30分钟');
      return;
    }

    setError('');
    onConfirm(startTime, endTime);
    onOpenChange(false);
  };

  if (!availability) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>选择上课时间</DialogTitle>
          <DialogDescription>
            在教练的可用时段内选择您想上课的具体时间
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Display availability time range */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">教练可用时段</p>
                <p className="text-blue-700">
                  {formatDisplayDateTime(availability.start_ts)}
                  <br />
                  至 {formatDisplayDateTime(availability.end_ts)}
                </p>
              </div>
            </div>
          </div>

          {/* Start time input */}
          <div className="space-y-2">
            <Label htmlFor="start-time">开始时间</Label>
            <Input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={formatDateTimeLocal(availability.start_ts)}
              max={formatDateTimeLocal(availability.end_ts)}
            />
          </div>

          {/* End time input */}
          <div className="space-y-2">
            <Label htmlFor="end-time">结束时间</Label>
            <Input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={formatDateTimeLocal(availability.start_ts)}
              max={formatDateTimeLocal(availability.end_ts)}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Duration display */}
          {startTime && endTime && !error && (
            <div className="text-sm text-gray-600">
              <p>
                课程时长: {Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)} 分钟
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            确认时间
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

