//import { supabase } from '@/lib/supabase';
import api from './client';

export interface UserCoursePackage {
  id: string;
  userId: string;
  coachId: string;
  courseId: string;
  packagePriceId: string;
  totalCredits: number;
  remainingCredits: number;
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'REFUNDED';
  expiresAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasePackageRequest {
  packagePriceId: string;
  courseId: string;
  coachId: string;
}

export interface PurchasePackageResponse {
  success: boolean;
  userPackageId: string;
  message: string;
}

// 获取当前用户ID
/*
async function getCurrentUserId(): Promise<string> {
  // 测试阶段使用固定用户ID
  return '3047992c-2d2e-4171-9bde-a6e05357d3f7';
  
  // 生产环境代码：
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   throw new Error('User not authenticated');
  // }
  // return user.id;
}
  */

// 获取用户的课包列表
export async function getUserPackages(): Promise<UserCoursePackage[]> {
  try {
    const { data } = await api.get<UserCoursePackage[]>('/bookings/user-packages');
    return data;
  } catch (error) {
    console.error('Get user packages error:', error);
    throw error;
  }
}

// 获取用户特定课程的课包
export async function getUserPackagesByCourse(courseId: string): Promise<UserCoursePackage[]> {
  try {
    const { data } = await api.get<UserCoursePackage[]>('/bookings/user-packages', {
      params: { courseId }
    });
    return data;
  } catch (error) {
    console.error('Get user packages by course error:', error);
    throw error;
  }
}

// 购买课包
export async function purchasePackage(request: PurchasePackageRequest): Promise<PurchasePackageResponse> {
  try {
    console.log('Purchasing package:', request);
    
    const { data } = await api.post<PurchasePackageResponse>('/bookings/user-packages/purchase', request);
    
    console.log('Purchase response:', data);
    return data;
  } catch (error) {
    console.error('Purchase package error:', error);
    throw error;
  }
}

// 使用课包次数（报名时扣减）
export async function usePackageCredits(packageId: string, credits: number = 1): Promise<void> {
  try {
    await api.post(`/bookings/user-packages/${packageId}/use-credits`, { credits });
  } catch (error) {
    console.error('Use package credits error:', error);
    throw error;
  }
}

// 模拟购买成功（用于测试）
export async function mockPurchasePackage(packagePriceId: string, courseId: string, coachId: string): Promise<PurchasePackageResponse> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟购买成功
  return {
    success: true,
    userPackageId: `mock-package-${Date.now()}`,
    message: 'Package purchased successfully'
  };
}
