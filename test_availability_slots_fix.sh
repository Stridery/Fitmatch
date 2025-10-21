#!/bin/bash

# 测试Availability可用时段API修复
echo "🔧 测试Availability可用时段API修复..."

# 1. 检查bookingservice是否运行
echo "📋 1. 检查bookingservice状态..."
if curl -s http://localhost:8083/actuator/health > /dev/null; then
    echo "✅ Bookingservice (8083) 运行正常"
else
    echo "❌ Bookingservice (8083) 未运行，请先启动服务"
    exit 1
fi

# 2. 测试API Gateway路由
echo "📋 2. 测试API Gateway路由..."
if curl -s http://localhost:8080/bookings/availability/test-id/available-slots > /dev/null; then
    echo "✅ Availability slots API路由正常"
else
    echo "❌ Availability slots API路由异常"
fi

# 3. 测试前端服务
echo "📋 3. 检查前端服务状态..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend (5173) 运行正常"
else
    echo "❌ Frontend (5173) 未运行"
fi

echo ""
echo "🎯 修复说明："
echo "1. 移除了SQL函数中的CREATE TEMP TABLE语句"
echo "2. 使用简化的算法计算可用时段"
echo "3. 移除了@Transactional(readOnly = true)限制"
echo ""
echo "📝 手动测试步骤："
echo "1. 重新启动bookingservice服务"
echo "2. 打开浏览器访问 http://localhost:5173"
echo "3. 进入Match页面，选择一个课程"
echo "4. 在排期tab中查看availability事件"
echo "5. 应该能看到拆分的可用时段"
