#!/bin/bash

# 测试时区修复 - 解决My Schedule页面时间显示问题
echo "🧪 测试时区修复 - My Schedule页面时间显示"
echo "========================================"

echo "📋 问题分析："
echo "1. 数据库字段: timestamptz (带时区)"
echo "2. Availability拆分显示正确: 使用Supabase直接获取"
echo "3. My Schedule显示错误: 使用API获取，时间格式问题"
echo ""

echo "🔧 修复方案："
echo "1. ✅ 移除SQL中的::timestamp转换，保留timestamptz"
echo "2. ✅ 添加Jackson配置，确保Instant序列化为ISO 8601"
echo "3. ✅ 前端正确处理ISO 8601时间字符串"
echo ""

echo "📊 技术细节："
echo "- SQL: sb.booked_start_time as \"bookedStartTime\" (移除::timestamp)"
echo "- Jackson: write-dates-as-timestamps=false"
echo "- 前端: new Date(booking.bookedStartTime) 正确解析ISO 8601"
echo ""

echo "🎯 预期结果："
echo "- API返回ISO 8601格式时间字符串 (如: 2025-10-21T16:00:00Z)"
echo "- 前端正确解析为本地时间"
echo "- My Schedule页面显示正确的时间"
echo ""

echo "🚀 测试步骤："
echo "1. 重启bookingservice"
echo "2. 调用API: GET /bookings/availability/user/me"
echo "3. 检查返回的时间格式是否为ISO 8601"
echo "4. 验证My Schedule页面时间显示"
echo ""

echo "💡 调试信息："
echo "- 检查API响应中的bookedStartTime和bookedEndTime格式"
echo "- 确认前端Date构造函数正确解析时间"
echo "- 验证时区转换是否正确"
