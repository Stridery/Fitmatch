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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Clock, Users, AlertCircle, ShoppingCart } from 'lucide-react';
import type { CoachCalendarEvent } from '@/api/coachCalendar';
import { getPackagesByCourseId } from '@/api/courses';
import type { CoursePackagePrice } from '@/api/courses';
import { getUserPackagesByCourse, purchasePackage as purchasePackageAPI } from '@/api/userPackage';
import type { UserCoursePackage } from '@/api/userPackage';

interface SessionBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CoachCalendarEvent | null;
  courseId: string;
  onConfirm: (packageId: string) => void;
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

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function SessionBookingDialog({
  open,
  onOpenChange,
  session,
  courseId,
  onConfirm
}: SessionBookingDialogProps) {
  const [packages, setPackages] = useState<CoursePackagePrice[]>([]);
  const [userPackages, setUserPackages] = useState<UserCoursePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingUserPackages, setLoadingUserPackages] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchasePackage, setPurchasePackage] = useState<CoursePackagePrice | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  // 加载课程套餐和用户课包
  useEffect(() => {
    if (open && courseId) {
      // 加载课程套餐
      setLoadingPackages(true);
      getPackagesByCourseId(courseId)
        .then((data) => {
          setPackages(data);
          // 默认选择第一个套餐
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

  // 处理报名确认
  const handleConfirm = () => {
    if (!selectedPackageId) return;
    
    const userPackage = getUserPackage(selectedPackageId);
    
    if (userPackage && userPackage.remainingCredits > 0) {
      // 有剩余次数，直接报名 - 使用用户套餐的实际ID
      console.log('Direct booking - using userPackage.id:', userPackage.id);
      console.log('Original selectedPackageId:', selectedPackageId);
      onConfirm(userPackage.id);
      onOpenChange(false);
    } else {
      // 没有剩余次数，显示购买页面
      const packageToPurchase = packages.find(pkg => pkg.id === selectedPackageId);
      if (packageToPurchase) {
        setPurchasePackage(packageToPurchase);
        setShowPurchaseDialog(true);
      }
    }
  };

  // 处理购买确认
  const handlePurchaseConfirm = async () => {
    if (!purchasePackage || !session) return;
    
    setPurchasing(true);
    try {
      console.log('Starting purchase process...');
      console.log('Purchase package:', purchasePackage);
      console.log('Session:', session);
      console.log('Course ID:', courseId);
      
      // 调用真实的购买API
      const result = await purchasePackageAPI({
        packagePriceId: purchasePackage.id,
        courseId: courseId,
        coachId: session.coach_id
      });
      
      console.log('Purchase result:', result);
      console.log('Purchase result.userPackageId:', result.userPackageId);
      console.log('Original selectedPackageId:', selectedPackageId);
      
      if (result.success) {
        alert(`Purchase successful!\nPackage: ${purchasePackage.lessonsCount} lessons\nPrice: ¥${purchasePackage.price}\nCredits: ${purchasePackage.lessonsCount} sessions\nUser Package ID: ${result.userPackageId}`);
        
        // 重新加载用户课包数据
        try {
          const updatedPackages = await getUserPackagesByCourse(courseId);
          setUserPackages(updatedPackages);
        } catch (error) {
          console.error('Failed to reload user packages:', error);
        }
        
        // 关闭购买弹窗，继续报名流程
        setShowPurchaseDialog(false);
        // 使用购买后返回的userPackageId，而不是套餐价格ID
        console.log('Calling onConfirm with userPackageId:', result.userPackageId);
        onConfirm(result.userPackageId);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPurchasing(false);
    }
  };

  if (!session) return null;

  return (
    <>
      <Dialog open={open && !showPurchaseDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Session</DialogTitle>
            <DialogDescription>
              Select the course package you want to use to book this session
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Session信息 */}
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <h4 className="font-medium text-lg mb-3">{session.title}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatDateTime(session.start_ts)} - {formatTime(session.end_ts)}</span>
                  </div>
                  {session.location && (
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      <span>{session.location}</span>
                    </div>
                  )}
                  {session.capacity && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      <span>
                        Booked: {session.booked_count || 0} / {session.capacity}
                        {session.capacity - (session.booked_count || 0) === 0 && (
                          <Badge variant="destructive" className="ml-2">Full</Badge>
                        )}
                      </span>
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
                                    <span>Remaining: {userPackage.remainingCredits} / {userPackage.totalCredits}</span>
                                    {userPackage.expiresAt && (
                                      <span>Expires: {new Date(userPackage.expiresAt).toLocaleDateString('en-US')}</span>
                                    )}
                                  </div>
                                  {userPackage.remainingCredits === 0 && (
                                    <div className="flex items-center text-amber-600 mt-1">
                                      <AlertCircle className="h-4 w-4 mr-1" />
                                      <span>Credits exhausted, need to purchase</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center text-blue-600">
                                    <ShoppingCart className="h-4 w-4 mr-1" />
                                    <span>You don't have this package yet, click to purchase</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              {userPackage && hasCredits ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  Need to Purchase
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedPackageId}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Booking
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
              Cancel
            </Button>
            <Button 
              onClick={handlePurchaseConfirm}
              disabled={purchasing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {purchasing ? 'Purchasing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
