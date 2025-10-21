#!/bin/bash

# 测试dashboard中availability预约显示功能
echo "🧪 测试Dashboard Availability预约显示功能"
echo "=============================================="

# 设置测试数据
STUDENT_ID="571b85e8-4684-4ac9-a1bf-b882d1cf2eb9"

echo "📋 测试场景："
echo "1. 获取用户session预约"
echo "2. 获取用户waitlist记录"
echo "3. 获取用户availability预约"
echo "4. 验证API响应格式"
echo ""

# 1. 获取用户session预约
echo "🔍 1. 获取用户session预约..."
curl -s "http://localhost:5173/api/bookings/schedule" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "📦 2. 获取用户waitlist记录..."
curl -s "http://localhost:5173/api/bookings/waitlist" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "🎯 3. 获取用户availability预约..."
curl -s "http://localhost:5173/api/bookings/availability/user/${STUDENT_ID}" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ 测试完成！"
echo ""
echo "💡 预期结果："
echo "- Session预约显示绿色边框和'已预订'徽章"
echo "- Waitlist记录显示蓝色边框和'等待中'徽章"
echo "- Availability预约显示紫色边框和'Availability'徽章"
echo "- 时间表中availability事件显示蓝色背景"
echo "- 右侧统计显示availability预约数量"
echo ""
echo "🌐 前端测试："
echo "访问 http://localhost:5173/dashboard/my-schedule 查看完整界面"
