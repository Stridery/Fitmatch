#!/bin/bash

# 测试教练身份验证功能
echo "🧪 测试教练身份验证功能"
echo "======================"

echo "📋 功能描述："
echo "根据user_profile的is_coach字段控制时间表显示"
echo "只有is_coach=1的用户才显示'我的课程安排'时间表"
echo ""

echo "🔧 实现逻辑："
echo "1. ✅ 检查user_profile.is_coach字段"
echo "2. ✅ 只有is_coach=true时才显示时间表"
echo "3. ✅ 非教练用户不显示课程安排部分"
echo "4. ✅ 保持项目卡片正常显示"
echo ""

echo "📊 显示逻辑："
echo "- is_coach = true: 显示项目卡片 + 我的课程安排时间表"
echo "- is_coach = false: 只显示项目卡片，不显示时间表"
echo "- 未设置is_coach: 只显示项目卡片，不显示时间表"
echo ""

echo "🎯 预期结果："
echo "- 教练用户：看到完整的dashboard（项目卡片+时间表）"
echo "- 普通用户：只看到项目卡片，没有时间表"
echo "- 加载状态：正常显示加载中"
echo ""

echo "🚀 测试步骤："
echo "1. 使用教练账号登录（is_coach=1）"
echo "2. 访问 /dashboard/coach"
echo "3. 检查是否显示'我的课程安排'时间表"
echo "4. 使用普通用户账号登录（is_coach=0或null）"
echo "5. 访问 /dashboard/coach"
echo "6. 检查是否不显示时间表部分"
echo ""

echo "💡 注意事项："
echo "- 确保user_profile表有is_coach字段"
echo "- 检查数据库中的is_coach值"
echo "- 验证前端条件渲染逻辑"
