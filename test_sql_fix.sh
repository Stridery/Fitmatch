#!/bin/bash

# 测试修复SQL查询错误
echo "🔧 修复SQL查询错误"
echo "=================="

echo "📋 问题描述："
echo "SQL查询中使用了不存在的字段 cd.title"
echo "错误：column cd.title does not exist"
echo "提示：Perhaps you meant to reference the column 'cce.title'"
echo ""

echo "🔧 修复内容："
echo "1. ✅ 移除对course_detail表的JOIN"
echo "2. ✅ 使用coach_calendar_event.title作为课程名称"
echo "3. ✅ 简化SQL查询，避免不存在的字段"
echo ""

echo "📊 修复详情："
echo "原查询："
echo "  JOIN public.course_detail cd ON cce.course_id = cd.id"
echo "  cd.title as courseName"
echo ""
echo "修复后："
echo "  cce.title as courseName  -- 直接使用coach_calendar_event的title"
echo ""

echo "🎯 预期结果："
echo "- SQL查询不再报错"
echo "- 教练dashboard时间表正常显示"
echo "- Session显示课程标题"
echo "- Availability显示为'Availability'"
echo ""

echo "🚀 测试步骤："
echo "1. 重启bookingservice"
echo "2. 访问教练dashboard"
echo "3. 检查时间表显示"
echo "4. 验证课程名称显示"
echo ""

echo "💡 注意事项："
echo "- 确保coach_calendar_event表有title字段"
echo "- 检查数据库表结构"
echo "- 验证SQL语法正确"