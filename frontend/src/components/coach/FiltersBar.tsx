import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter } from 'lucide-react';
import type { CoachCourse } from '@/api/coachCalendar';

interface FiltersBarProps {
  filters: {
    courseId: string;
    kinds: string[];
    locationKeyword: string;
  };
  onFiltersChange: (filters: {
    courseId: string;
    kinds: string[];
    locationKeyword: string;
  }) => void;
  onNewEvent: (kind: 'session' | 'availability') => void;
  courses: CoachCourse[];
}

export default function FiltersBar({ filters, onFiltersChange, onNewEvent, courses }: FiltersBarProps) {
  const handleKindToggle = (kind: string) => {
    const newKinds = filters.kinds.includes(kind)
      ? filters.kinds.filter(k => k !== kind)
      : [...filters.kinds, kind];
    
    onFiltersChange({
      ...filters,
      kinds: newKinds
    });
  };

  const handleLocationChange = (value: string) => {
    onFiltersChange({
      ...filters,
      locationKeyword: value
    });
  };

  const handleCourseChange = (value: string) => {
    onFiltersChange({
      ...filters,
      courseId: value === 'all' ? '' : value
    });
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters:</span>
          </div>

          {/* Course Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Course:</span>
            <Select value={filters.courseId || 'all'} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-white hover:bg-gray-700">All courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="text-white hover:bg-gray-700">
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter - Multi-select as checkboxes */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Type:</span>
            <div className="flex items-center space-x-2">
              {['Session', 'Availability'].map((kind) => (
                <Button
                  key={kind}
                  variant={filters.kinds.includes(kind) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleKindToggle(kind)}
                  className={`h-8 ${filters.kinds.includes(kind) ? 'bg-white text-black' : 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500'}`}
                >
                  {kind}
                  {filters.kinds.includes(kind) && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-gray-200 text-gray-800">
                      ✓
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Location:</span>
            <Input
              placeholder="Search location..."
              value={filters.locationKeyword}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-48 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right side - New Event Button */}
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center space-x-2 bg-white hover:bg-gray-100 text-black">
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem onClick={() => onNewEvent('session')} className="text-white hover:bg-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Session</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNewEvent('availability')} className="text-white hover:bg-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Availability</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.courseId || filters.kinds.length > 0 || filters.locationKeyword) && (
        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-600">
          <span className="text-sm text-gray-400">Active filters:</span>
          
          {filters.courseId && (
            <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
              Course: {filters.courseId}
            </Badge>
          )}
          
          {filters.kinds.map((kind) => (
            <Badge key={kind} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
              {kind}
            </Badge>
          ))}
          
          {filters.locationKeyword && (
            <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
              Location: {filters.locationKeyword}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({ courseId: '', kinds: [], locationKeyword: '' })}
            className="text-xs h-6 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
