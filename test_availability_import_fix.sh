#!/bin/bash

# 测试修复getUserAvailabilityBookings导入错误
echo "🔧 修复getUserAvailabilityBookings导入错误"
echo "========================================"

echo "📋 问题描述："
echo "StudentSchedulePage.tsx中无法找到getUserAvailabilityBookings导出"
echo "错误：does not provide an export named 'getUserAvailabilityBookings'"
echo ""

echo "🔧 修复内容："
echo "1. ✅ 添加AvailabilityBookingRecord接口"
echo "2. ✅ 添加getUserAvailabilityBookings函数"
echo "3. ✅ 确保正确的API路径：/bookings/availability/user/me"
echo "4. ✅ 保持现有导入结构不变"
echo ""

echo "📊 导入结构："
echo "StudentSchedulePage.tsx:"
echo "  - getUserAvailabilityBookings (从 @/api/booking)"
echo "  - cancelAvailabilityBooking (从 @/api/availability)"
echo ""

echo "🎯 预期结果："
echo "- StudentSchedulePage.tsx可以正常导入getUserAvailabilityBookings"
echo "- 用户可以查看availability预约记录"
echo "- 取消availability预约功能正常工作"
echo ""

echo "🚀 测试步骤："
echo "1. 重启前端开发服务器"
echo "2. 访问学生dashboard"
echo "3. 检查My Schedule页面"
echo "4. 验证availability预约显示"
echo "5. 测试取消availability预约功能"
echo ""

echo "💡 注意事项："
echo "- 确保后端API /bookings/availability/user/me正常工作"
echo "- 检查用户认证状态"
echo "- 验证时间格式转换"
