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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, AlertCircle, Package } from 'lucide-react';
import type { CoachCalendarEvent } from '@/api/coachCalendar';
import { getPackagesByCourseId } from '@/api/courses';
import type { CoursePackagePrice } from '@/api/courses';

interface AvailabilityBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availability: CoachCalendarEvent | null;
  courseId: string;
  onConfirm: (startTime: string, endTime: string, packageId: string) => void;
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
  courseId,
  onConfirm
}: AvailabilityBookingDialogProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [packages, setPackages] = useState<CoursePackagePrice[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [error, setError] = useState('');

  // Load packages when dialog opens
  useEffect(() => {
    if (open && courseId) {
      setLoadingPackages(true);
      getPackagesByCourseId(courseId)
        .then((data) => {
          setPackages(data);
          // Auto-select first package if available
          if (data.length > 0) {
            setSelectedPackageId(data[0].id);
          }
        })
        .catch((err) => {
          console.error('Failed to load packages:', err);
          setPackages([]);
        })
        .finally(() => {
          setLoadingPackages(false);
        });
    }
  }, [open, courseId]);

  useEffect(() => {
    if (availability && open) {
      // Set default values to availability's time range
      setStartTime(formatDateTimeLocal(availability.start_ts));
      setEndTime(formatDateTimeLocal(availability.end_ts));
      setError('');
    }
  }, [availability, open]);

  // Auto-adjust end time when package is selected
  useEffect(() => {
    if (selectedPackageId && startTime && packages.length > 0) {
      const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);
      if (selectedPackage) {
        const start = new Date(startTime);
        const newEnd = new Date(start.getTime() + selectedPackage.lessonDurationMinutes * 60000);
        
        // Check if the new end time is within availability range
        const availabilityEnd = availability ? new Date(availability.end_ts) : null;
        if (availabilityEnd && newEnd <= availabilityEnd) {
          setEndTime(formatDateTimeLocal(newEnd.toISOString()));
          setError('');
        } else if (availabilityEnd) {
          setError(`套餐时长（${selectedPackage.lessonDurationMinutes}分钟）超出可用时段，请选择其他套餐或调整开始时间`);
        }
      }
    }
  }, [selectedPackageId, startTime, packages, availability]);

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
    const selectedDurationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (selectedDurationMinutes < 30) {
      setError('课程时长至少需要30分钟');
      return;
    }

    // Check if package is selected
    if (!selectedPackageId) {
      setError('请选择课程套餐');
      return;
    }

    // Check if selected duration matches package duration
    const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);
    if (selectedPackage) {
      const packageDuration = selectedPackage.lessonDurationMinutes;
      if (selectedDurationMinutes !== packageDuration) {
        setError(`所选时间长度（${selectedDurationMinutes}分钟）与套餐课程时长（${packageDuration}分钟）不一致，请调整时间`);
        return;
      }
    }

    setError('');
    onConfirm(startTime, endTime, selectedPackageId);
    onOpenChange(false);
  };

  // Format package display
  const formatPackageDisplay = (pkg: CoursePackagePrice) => {
    const mode = pkg.trainingMode || '1v1';
    const lessons = pkg.lessonsCount;
    const duration = pkg.lessonDurationMinutes;
    const price = pkg.price;
    return `${mode} · ${lessons}节课 · ${duration}分钟/课 · ¥${price}`;
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

          {/* Package selector */}
          <div className="space-y-2">
            <Label htmlFor="package-select">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>选择课程套餐</span>
              </div>
            </Label>
            {loadingPackages ? (
              <div className="text-sm text-gray-500">加载中...</div>
            ) : packages.length === 0 ? (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                该课程暂无可用套餐
              </div>
            ) : (
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger id="package-select">
                  <SelectValue placeholder="请选择套餐" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {formatPackageDisplay(pkg)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

