# Event Registration Setup Guide

## 概述

本文档说明如何设置 event registration 功能，包括预约逻辑、边框颜色显示和 waitlist 管理。

## 数据库设置

### 1. 执行 SQL 脚本

在 Supabase SQL Editor 中执行 `event_registration_setup.sql` 文件。该脚本包含：

- **表结构**：确保 `event_registrations` 表存在并正确配置
- **索引**：为性能优化创建必要的索引
- **RLS 策略**：配置行级安全策略
- **RPC 函数**：创建 `join_event` 和 `cancel_event` 函数

### 2. 主要 RPC 函数

#### `join_event(p_event_id uuid)`
- 功能：用户预约活动
- 逻辑：
  - 如果活动未满，直接 ENROLLED
  - 如果活动已满，加入 WAITLIST 并分配位置
  - 如果用户已取消，可以重新预约
- 返回：`status`, `enrolled_count`, `waitlist_count`

#### `cancel_event(p_event_id uuid)`
- 功能：用户取消预约
- 逻辑：
  - 如果用户是 ENROLLED，标记为 CANCELLED，并自动提升第一个 WAITLIST 用户为 ENROLLED
  - 如果用户是 WAITLIST，标记为 CANCELLED，并更新后续 WAITLIST 用户的位置（减1）
- 返回：`status`, `promoted_user`, `enrolled_count`, `waitlist_count`

#### `_event_can_join(e public.events)`
- 功能：检查活动是否可以预约
- 条件：
  - `is_listed = true`
  - `rsvp_deadline` 为空或未过期
  - `start_at > now()`（活动未开始）

## RLS 配置

### event_registrations 表
- **read_own_regs**：用户可以读取自己的注册记录
- **read_event_regs_for_host**：活动创建者可以读取该活动的所有注册记录
- **insert_own_regs**：用户可以插入自己的注册记录（通过 RPC）
- **update_own_regs**：用户可以更新自己的注册记录（通过 RPC）
- **delete_own_regs**：用户可以删除自己的注册记录（通过 RPC）

### events 表
- **events_select_public**：公开可读已列出的活动
- **events_select_own**：用户可以读取自己创建的活动
- **events_insert_own**：用户可以创建自己的活动
- **events_update_own**：用户可以更新自己的活动
- **events_delete_own**：用户可以删除自己的活动

### event_groups 表
- **event_groups_select_public**：公开可读所有活动组
- **event_groups_select_own**：用户可以读取自己创建的活动组
- **event_groups_insert_own**：用户可以创建自己的活动组
- **event_groups_update_own**：用户可以更新自己的活动组
- **event_groups_delete_own**：用户可以删除自己的活动组

## 前端功能

### EventCard 组件
- **边框颜色**：
  - 绿色边框：用户已预约（ENROLLED）
  - 蓝色边框：用户在候补名单（WAITLIST）
  - 灰色边框：用户未预约
- **Badge 显示**：
  - ENROLLED：显示 "Enrolled" badge
  - WAITLIST：显示 "Waitlist #X" badge（X 为位置）

### EventDetailPage 组件
- **预约按钮**：如果活动可预约，显示 "Join Event" 或 "Join Waitlist"
- **取消按钮**：
  - ENROLLED 状态：显示 "Cancel Registration" 按钮
  - WAITLIST 状态：显示 "Exit Waitlist" 按钮
- **Waitlist 位置显示**：如果用户在候补名单，显示 "Your waitlist position: #X"
- **状态 Badge**：在标题旁显示当前注册状态

## 使用流程

### 用户预约活动
1. 用户在活动列表页面看到活动卡片
2. 点击卡片进入详情页
3. 点击 "Join Event" 按钮
4. 系统调用 `join_event` RPC 函数
5. 如果成功：
   - 活动未满：状态变为 ENROLLED，卡片边框变绿色
   - 活动已满：状态变为 WAITLIST，卡片边框变蓝色，显示 waitlist position

### 用户取消预约
1. 用户在活动详情页看到 "Cancel Registration" 或 "Exit Waitlist" 按钮
2. 点击按钮，确认取消
3. 系统调用 `cancel_event` RPC 函数
4. 如果用户是 ENROLLED：
   - 状态变为 CANCELLED
   - 第一个 WAITLIST 用户自动提升为 ENROLLED
   - 所有 WAITLIST 用户的位置减1
5. 如果用户是 WAITLIST：
   - 状态变为 CANCELLED
   - 所有位置大于该用户位置的 WAITLIST 用户位置减1

## 注意事项

1. **并发控制**：RPC 函数使用 `FOR UPDATE` 锁定行，防止并发问题
2. **Waitlist 位置**：位置从 1 开始，按创建时间排序
3. **自动递补**：当 ENROLLED 用户取消时，第一个 WAITLIST 用户自动递补
4. **位置更新**：取消 WAITLIST 时，后续用户位置自动更新

## 测试建议

1. **预约测试**：
   - 预约未满活动 → 应显示 ENROLLED，绿色边框
   - 预约已满活动 → 应显示 WAITLIST，蓝色边框，显示位置

2. **取消测试**：
   - 取消 ENROLLED → 应变为 CANCELLED，第一个 WAITLIST 自动递补
   - 取消 WAITLIST → 应变为 CANCELLED，后续位置更新

3. **并发测试**：
   - 多个用户同时预约已满活动 → 应正确分配 WAITLIST 位置
   - 多个用户同时取消 → 应正确处理位置更新

