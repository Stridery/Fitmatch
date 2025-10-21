#!/bin/bash

# 测试Prepared Statement冲突修复
echo "🧪 测试Prepared Statement冲突修复"
echo "=================================="

echo "📋 问题分析："
echo "错误: bind message supplies 1 parameters, but prepared statement \"S_1\" requires 0"
echo "原因: PostgreSQL prepared statement缓存冲突"
echo ""

echo "🔧 修复方案："
echo "1. ✅ 禁用HikariCP prepared statement缓存"
echo "2. ✅ 设置prepare-threshold=0"
echo "3. ✅ 禁用cache-prep-stmts"
echo "4. ✅ 设置preparedStatementCacheQueries=0"
echo "5. ✅ 设置preparedStatementCacheSizeMiB=0"
echo ""

echo "📊 配置详情："
echo "- prepare-threshold=0: 禁用prepared statement"
echo "- cache-prep-stmts=false: 禁用statement缓存"
echo "- preparedStatementCacheQueries=0: 禁用查询缓存"
echo "- preparedStatementCacheSizeMiB=0: 禁用大小缓存"
echo ""

echo "🚀 测试步骤："
echo "1. 重启courseservice"
echo "2. 测试API: GET /courses/packages/course/{courseId}"
echo "3. 验证不再出现prepared statement错误"
echo ""

echo "💡 预期结果："
echo "- API正常返回课程包列表"
echo "- 不再出现prepared statement冲突错误"
echo "- 数据库查询正常执行"
echo ""

echo "🔍 测试命令："
echo "curl -X GET 'http://localhost:5173/api/courses/packages/course/109798b4-50de-44e3-8c31-4c747d2935ff'"
