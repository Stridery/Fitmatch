import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import type { CoachCourse } from '@/api/coachCalendar';

interface NewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'session' | 'availability' | null;
  defaults: {
    startTs: string;
    endTs: string;
  };
  onSave?: (eventData: any) => void;
  onDelete?: (eventId: string) => void;
  editingEvent?: any;
  courses?: CoachCourse[];
}

export default function NewEventDialog({ open, onOpenChange, kind, defaults, onSave, onDelete, editingEvent, courses = [] }: NewEventDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    reason: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Reset form data when dialog opens/closes or kind changes
    const resetFormData = () => ({
      title: '',
      course: '',
      location: '',
      startTime: '',
      endTime: '',
      capacity: '',
      reason: ''
    });

    if (editingEvent) {
      // Pre-fill form with editing event data
      setFormData({
        title: editingEvent.title || '',
        course: editingEvent.course || '',
        location: editingEvent.location || '',
        startTime: format(new Date(editingEvent.startTime), 'yyyy-MM-dd\'T\'HH:mm'),
        endTime: format(new Date(editingEvent.endTime), 'yyyy-MM-dd\'T\'HH:mm'),
        capacity: editingEvent.capacity || '',
        reason: ''
      });
    } else {
      // Reset form for new event
      const newFormData = resetFormData();
      
      // Set default title based on kind
      if (kind === 'availability') {
        newFormData.title = 'Available';
      }
      
      if (defaults.startTs && defaults.endTs) {
        // Pre-fill with defaults for new event
        const startDate = new Date(defaults.startTs);
        const endDate = new Date(defaults.endTs);
        
        newFormData.startTime = format(startDate, 'yyyy-MM-dd\'T\'HH:mm');
        newFormData.endTime = format(endDate, 'yyyy-MM-dd\'T\'HH:mm');
      }
      
      setFormData(newFormData);
    }
    
    // Clear errors when dialog opens
    setErrors({});
  }, [defaults, editingEvent, open, kind]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    const now = new Date();
    
    // Validate start time
    if (formData.startTime) {
      const startDate = new Date(formData.startTime);
      if (startDate < now) {
        newErrors.startTime = 'Start time cannot be in the past';
      }
    }
    
    // Validate end time
    if (formData.endTime) {
      const endDate = new Date(formData.endTime);
      if (formData.startTime) {
        const startDate = new Date(formData.startTime);
        if (endDate <= startDate) {
          newErrors.endTime = 'End time must be after start time';
        }
      }
    }
    
    // Validate required fields based on kind
    if (kind === 'session') {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
    }
    
    if (kind === 'availability') {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      }
    }
    
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return; // Don't save if validation fails
    }
    
    if (onSave) {
      onSave(formData);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      onDelete(editingEvent.id);
    }
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    const prefix = editingEvent ? 'Edit' : 'New';
    switch (kind) {
      case 'session':
        return `${prefix} Session`;
      case 'availability':
        return `${prefix} Availability`;
      default:
        return `${prefix} Event`;
    }
  };

  const getKindColor = () => {
    switch (kind) {
      case 'session':
        return 'bg-green-500';
      case 'availability':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getKindLabel = () => {
    switch (kind) {
      case 'session':
        return 'Session';
      case 'availability':
        return 'Availability';
      default:
        return 'Event';
    }
  };

  if (!kind) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getKindColor()}`}></div>
            <span>{getDialogTitle()}</span>
            <Badge variant="secondary" className="ml-2">
              {getKindLabel()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {editingEvent ? (
              <>
                {kind === 'session' && 'Update the training session details.'}
                {kind === 'availability' && 'Update your available time slot.'}
              </>
            ) : (
              <>
                {kind === 'session' && 'Create a new training session with course, location, and capacity details.'}
                {kind === 'availability' && 'Set your available time slots for potential sessions.'}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Start Time</span>
              </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>
                )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>End Time</span>
              </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={errors.endTime ? 'border-red-500' : ''}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>
                )}
            </div>
          </div>

          {/* Session-specific fields */}
          {kind === 'session' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="course" className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Course</span>
                </Label>
                <Select value={formData.course} onValueChange={(value) => handleInputChange('course', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none">No courses available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Session title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </Label>
                <Input
                  id="location"
                  placeholder="Location..."
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && (
                  <p className="text-sm text-red-500 mt-1">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Capacity</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Max participants"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
            </>
          )}

          {/* Availability-specific fields */}
          {kind === 'availability' && (
            <div className="space-y-2">
              <Label htmlFor="course" className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>Course (Optional)</span>
              </Label>
              <Select value={formData.course} onValueChange={(value) => handleInputChange('course', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {editingEvent && (
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingEvent ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
