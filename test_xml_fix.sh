#!/bin/bash

# 测试XML修复
echo "🧪 测试XML修复 - 解决MyBatis XML解析错误"
echo "=========================================="

echo "📋 修复内容："
echo "1. ✅ 修复XML中的 < 符号转义问题"
echo "2. ✅ 将 < 替换为 &lt;"
echo "3. ✅ 确保XML格式正确"
echo ""

echo "🔍 测试步骤："
echo "1. 重新启动bookingservice"
echo "2. 检查是否还有XML解析错误"
echo "3. 测试API功能"
echo ""

echo "💡 预期结果："
echo "- Spring Boot应用正常启动"
echo "- 不再出现XML解析错误"
echo "- MyBatis正确解析SQL映射"
echo ""

echo "🚀 启动命令："
echo "cd backend/bookingservice && ./mvnw spring-boot:run"
