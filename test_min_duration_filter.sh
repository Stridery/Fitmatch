#!/bin/bash

# 测试最小时长过滤功能
echo "🧪 测试最小时长过滤功能"
echo "================================"

# 设置测试数据
AVAILABILITY_ID="e452e8f7-aabe-4ffe-8a62-70834b746b2b"
COURSE_ID="06902cd5-e14f-4810-9d24-9c1686e936d8"

echo "📋 测试场景："
echo "1. 获取可用时段（不过滤）"
echo "2. 获取套餐信息"
echo "3. 验证最小时长过滤逻辑"
echo ""

# 1. 获取可用时段
echo "🔍 1. 获取可用时段..."
curl -s "http://localhost:5173/api/bookings/availability/${AVAILABILITY_ID}/available-slots" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "📦 2. 获取套餐信息..."
curl -s "http://localhost:5173/api/courses/${COURSE_ID}/packages" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ 测试完成！"
echo ""
echo "💡 预期结果："
echo "- 可用时段应该被过滤，只显示时长 >= 套餐最小时长的时段"
echo "- 如果套餐最小时长是60分钟，则只显示 >= 60分钟的时段"
echo "- 如果套餐最小时长是30分钟，则只显示 >= 30分钟的时段"
