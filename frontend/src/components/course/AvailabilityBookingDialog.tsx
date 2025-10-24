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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertCircle, Package, Users, ShoppingCart } from 'lucide-react';
import type { CoachCalendarEvent } from '@/api/coachCalendar';
import { getPackagesByCourseId } from '@/api/courses';
import type { CoursePackagePrice } from '@/api/courses';
import { getUserPackagesByCourse, purchasePackage as purchasePackageAPI } from '@/api/userPackage';
import type { UserCoursePackage } from '@/api/userPackage';
import { bookAvailability, type AvailabilityBookingRequest } from '@/api/availability';
import { useUser } from '@/contexts/UserContext';

interface AvailabilityBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availability: CoachCalendarEvent | null;
  courseId: string;
  onBookingSuccess?: () => void;
}

// 模拟用户课包数据（当API不可用时使用）
const mockUserPackages: UserCoursePackage[] = [
  {
    id: 'user-package-1',
    userId: 'user-1',
    coachId: 'coach-1',
    courseId: 'course-1',
    packagePriceId: 'package-1',
    remainingCredits: 3,
    totalCredits: 10,
    status: 'ACTIVE',
    expiresAt: '2024-12-31',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'user-package-2', 
    userId: 'user-1',
    coachId: 'coach-1',
    courseId: 'course-1',
    packagePriceId: 'package-2',
    remainingCredits: 0,
    totalCredits: 5,
    status: 'ACTIVE',
    expiresAt: '2024-12-31',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 'user-package-3',
    userId: 'user-1',
    coachId: 'coach-1',
    courseId: 'course-1',
    packagePriceId: 'package-3', 
    remainingCredits: 8,
    totalCredits: 20,
    status: 'ACTIVE',
    expiresAt: '2024-12-31',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];

function formatDateTimeLocal(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
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
  onBookingSuccess
}: AvailabilityBookingDialogProps) {
  const { user } = useUser();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [packages, setPackages] = useState<CoursePackagePrice[]>([]);
  const [userPackages, setUserPackages] = useState<UserCoursePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingUserPackages, setLoadingUserPackages] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchasePackage, setPurchasePackage] = useState<CoursePackagePrice | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  // Load packages and user packages when dialog opens
  useEffect(() => {
    if (open && courseId) {
      // 加载课程套餐
      setLoadingPackages(true);
      getPackagesByCourseId(courseId)
        .then((data) => {
          // 过滤出只支持1v1的套餐（MVP阶段限制）
          const filteredPackages = data.filter(pkg => 
            pkg.trainingMode === '1v1'
          );
          setPackages(filteredPackages);
          // 默认选择第一个套餐
          if (filteredPackages.length > 0) {
            setSelectedPackageId(filteredPackages[0].id);
          }
        })
        .catch((err) => {
          console.error('Failed to load packages:', err);
          setPackages([]);
        })
        .finally(() => {
          setLoadingPackages(false);
        });

      // 加载用户课包
      setLoadingUserPackages(true);
      getUserPackagesByCourse(courseId)
        .then((data) => {
          setUserPackages(data);
        })
        .catch((err) => {
          console.error('Failed to load user packages:', err);
          // 使用模拟数据
          setUserPackages(mockUserPackages);
        })
        .finally(() => {
          setLoadingUserPackages(false);
        });
    }
  }, [open, courseId]);

  // 获取用户对应的课包
  const getUserPackage = (packagePriceId: string): UserCoursePackage | undefined => {
    return userPackages.find(pkg => pkg.packagePriceId === packagePriceId);
  };

  useEffect(() => {
    if (availability && open) {
      // Set default start time to availability's start time
      setStartTime(formatDateTimeLocal(availability.start_ts));
      setEndTime(''); // 清空结束时间，等待用户选择套餐后自动计算
      setError('');
    }
  }, [availability, open]);

  // Auto-calculate end time when package is selected or start time changes
  useEffect(() => {
    if (selectedPackageId && startTime && packages.length > 0) {
      const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);
      if (selectedPackage) {
        const start = new Date(startTime);
        const newEnd = new Date(start.getTime() + selectedPackage.lessonDurationMinutes * 60000);
        
        // Always set the calculated end time
        setEndTime(formatDateTimeLocal(newEnd));
        
        // 实时验证时间范围
        const availabilityStart = availability ? new Date(availability.start_ts) : null;
        const availabilityEnd = availability ? new Date(availability.end_ts) : null;
        
        if (availabilityStart && start < availabilityStart) {
          setError('开始时间不得早于教练可用时段开始时间');
        } else if (availabilityEnd && newEnd > availabilityEnd) {
          setError(`选择的时间段（${selectedPackage.lessonDurationMinutes}分钟）超出可用时段，请调整开始时间`);
        } else {
          setError('');
        }
      }
    } else if (!selectedPackageId) {
      // 如果没有选择套餐，清空结束时间
      setEndTime('');
      setError('');
    }
  }, [selectedPackageId, startTime, packages, availability]);

  const handleConfirm = async () => {
    if (!availability || !selectedPackageId || !startTime || !endTime || error || !user) return;
    
    // 由于实时验证已经在useEffect中处理，这里只需要检查是否有错误
    // 如果有错误，不执行预约
    if (error) {
      return;
    }

    const userPackage = getUserPackage(selectedPackageId);
    
    if (userPackage && userPackage.remainingCredits > 0) {
      // 有剩余次数，直接预约
      await performBooking(userPackage.id);
    } else {
      // 没有剩余次数，显示购买页面
      const packageToPurchase = packages.find(pkg => pkg.id === selectedPackageId);
      if (packageToPurchase) {
        setPurchasePackage(packageToPurchase);
        setShowPurchaseDialog(true);
      }
    }
  };

  // 执行真正的预约逻辑
  const performBooking = async (userPackageId: string) => {
    if (!availability || !user) return;
    
    setBooking(true);
    setError('');
    
    try {
      const bookingRequest: AvailabilityBookingRequest = {
        availabilityId: availability.id,
        studentId: user.id,
        userCoursePackageId: userPackageId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      };
      
      const response = await bookAvailability(bookingRequest);
      
      if (response.status === 'CONFIRMED') {
        alert('Booking Successful!');
        onOpenChange(false);
        onBookingSuccess?.();
      } else {
        setError(response.message || 'Booking Failed');
      }
    } catch (error) {
      console.error('Booking failed:', error);
      setError(error instanceof Error ? error.message : 'Booking Failed, please try again');
    } finally {
      setBooking(false);
    }
  };

  // 处理购买确认
  const handlePurchaseConfirm = async () => {
    if (!purchasePackage || !availability || !user) return;
    
    setPurchasing(true);
    try {
      // 调用真实的购买API
      const result = await purchasePackageAPI({
        packagePriceId: purchasePackage.id,
        courseId: courseId,
        coachId: availability.coach_id
      });
      
      if (result.success) {
        alert(`Purchase successful!\nPackage: ${purchasePackage.lessonsCount} lessons\nPrice: ¥${purchasePackage.price}\nCredits: ${purchasePackage.lessonsCount} sessions`);
        
        // 重新加载用户课包数据
        try {
          const updatedPackages = await getUserPackagesByCourse(courseId);
          setUserPackages(updatedPackages);
        } catch (error) {
          console.error('Failed to reload user packages:', error);
        }
        
        // 关闭购买弹窗，继续预约流程
        setShowPurchaseDialog(false);
        await performBooking(result.userPackageId);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`购买失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setPurchasing(false);
    }
  };

  // Format package display
  const formatPackageDisplay = (pkg: CoursePackagePrice) => {
    const mode = pkg.trainingMode || '1v1';
    const lessons = pkg.lessonsCount;
    const duration = pkg.lessonDurationMinutes;
    const price = pkg.price;
    return `${mode} · ${lessons} lessons · ${duration} min/lesson · ¥${price}`;
  };

  if (!availability) return null;

  return (
    <>
      <Dialog open={open && !showPurchaseDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>预约Availability</DialogTitle>
            <DialogDescription>
              在教练的可用时段内选择您想上课的具体时间
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Availability信息 */}
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <h4 className="font-medium text-lg mb-3">{availability.title || '可预约时段'}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatDisplayDateTime(availability.start_ts)} - {formatDisplayDateTime(availability.end_ts)}</span>
                  </div>
                  {availability.location && (
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      <span>{availability.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 套餐选择 */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Package className="h-5 w-5 mr-2" />
              Select Course Package
              </h4>
              
              {loadingPackages ? (
                <div className="text-center py-8 text-gray-500">
                  Loading packages...
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-8 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">
                  No packages available for this course
                </div>
              ) : (
                <div className="space-y-3">
                  {packages.map((pkg) => {
                    const userPackage = getUserPackage(pkg.id);
                    const hasCredits = userPackage && userPackage.remainingCredits > 0;
                    
                    return (
                      <Card 
                        key={pkg.id} 
                        className={`cursor-pointer transition-all ${
                          selectedPackageId === pkg.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedPackageId(pkg.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium">
                                  {pkg.trainingMode || '1v1'} · {pkg.lessonsCount} lessons · {pkg.lessonDurationMinutes} min/lesson
                                </h5>
                                <Badge variant="outline">¥{pkg.price}</Badge>
                              </div>
                              
                              {userPackage ? (
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center gap-4">
                                    <span>剩余次数: {userPackage.remainingCredits} / {userPackage.totalCredits}</span>
                                    {userPackage.expiresAt && (
                                      <span>到期: {new Date(userPackage.expiresAt).toLocaleDateString('zh-CN')}</span>
                                    )}
                                  </div>
                                  {userPackage.remainingCredits === 0 && (
                                    <div className="flex items-center text-amber-600 mt-1">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      <span>次数已用完，需要购买</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center text-blue-600">
                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                    <span>您还没有这个套餐，点击购买</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              {userPackage && hasCredits ? (
                                <Badge className="bg-green-100 text-green-800">
                                  可用
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  需购买
                                </Badge>
                              )}
                              
                              {selectedPackageId === pkg.id && (
                                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 时间选择 */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Select Class Time
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min={formatDateTimeLocal(availability.start_ts)}
                    max={formatDateTimeLocal(availability.end_ts)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  {endTime ? (
                    <Input
                      id="end-time"
                      type="datetime-local"
                      value={endTime}
                      disabled
                      className="bg-gray-50 text-gray-600"
                    />
                  ) : (
                    <div className="h-10 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 flex items-center">
                      请先选择套餐
                    </div>
                  )}
                </div>
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
                    Course Duration: {Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)} minutes
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedPackageId || !startTime || !endTime || !!error || booking}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {booking ? '预约中...' : '确认预约'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 购买弹窗 */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Course Package</DialogTitle>
            <DialogDescription>
              Purchase a package to book courses
            </DialogDescription>
          </DialogHeader>

          {purchasePackage && (
            <div className="space-y-4 py-4">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium text-lg mb-2">
                    {purchasePackage.trainingMode || '1v1'} · {purchasePackage.lessonsCount} lessons
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Course Duration: {purchasePackage.lessonDurationMinutes} minutes/lesson</p>
                    <p>Training Mode: {purchasePackage.trainingMode || '1v1'}</p>
                    <p className="text-lg font-semibold text-green-600">
                      Price: ¥{purchasePackage.price}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Purchase Information</p>
                    <p>After purchase, you will get {purchasePackage.lessonsCount} lesson credits that can be used to book all courses from this coach.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handlePurchaseConfirm}
              disabled={purchasing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {purchasing ? '购买中...' : '确认购买'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

