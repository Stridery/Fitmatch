#!/bin/bash

# 测试修复后端导入错误
echo "🔧 修复后端导入错误"
echo "=================="

echo "📋 问题描述："
echo "1. BookingMapper.java: CoachBookedSessionRecord cannot be resolved to a type"
echo "2. BookingController.java: HttpStatus cannot be resolved to a variable"
echo ""

echo "🔧 修复内容："
echo "1. ✅ BookingMapper.java - 添加CoachBookedSessionRecord导入"
echo "2. ✅ BookingController.java - 添加HttpStatus导入"
echo ""

echo "📊 修复详情："
echo "BookingMapper.java:"
echo "  + import com.fitmatch.bookingservice.dto.CoachBookedSessionRecord;"
echo ""
echo "BookingController.java:"
echo "  + import org.springframework.http.HttpStatus;"
echo ""

echo "🎯 预期结果："
echo "- bookingservice可以正常启动"
echo "- 教练dashboard时间表API正常工作"
echo "- 没有编译错误"
echo ""

echo "🚀 测试步骤："
echo "1. 重启bookingservice"
echo "2. 检查启动日志"
echo "3. 测试教练dashboard时间表API"
echo "4. 验证前端功能正常"
echo ""

echo "💡 注意事项："
echo "- 确保所有DTO类都已正确创建"
echo "- 检查Spring Boot版本兼容性"
echo "- 验证API路径配置"
