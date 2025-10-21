#!/bin/bash

# Availability Booking Test Script
# 测试availability booking的完整功能

echo "🚀 开始测试Availability Booking功能..."

# 1. 检查后端服务是否运行
echo "📋 1. 检查后端服务状态..."
if curl -s http://localhost:8083/actuator/health > /dev/null; then
    echo "✅ Booking Service (8083) 运行正常"
else
    echo "❌ Booking Service (8083) 未运行"
    exit 1
fi

if curl -s http://localhost:8082/actuator/health > /dev/null; then
    echo "✅ Course Service (8082) 运行正常"
else
    echo "❌ Course Service (8082) 未运行"
    exit 1
fi

if curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ API Gateway (8080) 运行正常"
else
    echo "❌ API Gateway (8080) 未运行"
    exit 1
fi

# 2. 测试API Gateway路由
echo "📋 2. 测试API Gateway路由..."
if curl -s http://localhost:8080/bookings/availability/available-slots/test-id > /dev/null; then
    echo "✅ Availability booking API路由正常"
else
    echo "❌ Availability booking API路由异常"
fi

# 3. 测试前端服务
echo "📋 3. 检查前端服务状态..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend (5173) 运行正常"
else
    echo "❌ Frontend (5173) 未运行"
fi

echo ""
echo "🎯 测试完成！"
echo ""
echo "📝 手动测试步骤："
echo "1. 打开浏览器访问 http://localhost:5173"
echo "2. 登录系统"
echo "3. 进入Match页面"
echo "4. 选择一个课程"
echo "5. 在排期tab中查看availability事件（蓝色边框）"
echo "6. 点击'选择时间'按钮"
echo "7. 选择套餐和时间"
echo "8. 确认预约"
echo ""
echo "🔍 预期结果："
echo "- 能够看到availability事件"
echo "- 能够选择套餐和时间"
echo "- 预约成功后显示确认信息"
echo "- 数据库中的session_booking表有新的记录"
echo "- booked_start_time和booked_end_time字段有值"
