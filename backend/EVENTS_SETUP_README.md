# Events & Registrations Setup Guide

## 概述

本指南说明如何在 Supabase 中设置 Events 和 Registrations 功能。

## 步骤

### 1. 在 Supabase SQL Editor 中执行 SQL

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase_events_setup.sql` 文件中的所有内容
4. 粘贴到 SQL Editor 中
5. 点击 "Run" 执行

这将创建：
- `events` 表
- `event_registrations` 表
- RLS (Row Level Security) 策略
- RPC 函数：`join_event` 和 `cancel_event`
- 视图：`event_counters`

### 2. 验证设置

执行以下查询验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'event_registrations');

-- 检查函数是否存在
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('join_event', 'cancel_event', '_event_can_join');
```

### 3. 测试 RPC 函数

在 SQL Editor 中测试函数（需要先登录并创建测试数据）：

```sql
-- 创建测试事件（需要先有一个用户）
-- 假设你有一个用户 ID，替换 'YOUR_USER_ID' 为实际的用户 ID
INSERT INTO public.events (
  host_id, title, sport, start_at, end_at, location_text,
  capacity_unit, group_type, is_listed, join_policy
) VALUES (
  'YOUR_USER_ID',
  'Test Event',
  'Basketball',
  now() + interval '1 day',
  now() + interval '1 day' + interval '2 hours',
  'Test Location',
  10,
  'SINGLE',
  true,
  'PUBLIC_OPEN'
) RETURNING id;

-- 测试 join_event（使用上面返回的 event ID）
SELECT * FROM public.join_event('EVENT_ID_HERE');

-- 测试 cancel_event
SELECT * FROM public.cancel_event('EVENT_ID_HERE');
```

## 功能说明

### RPC 函数

#### `join_event(p_event_id uuid)`

报名参加活动：
- 如果名额未满 → 直接 ENROLLED
- 如果已满 → 进入 WAITLIST（FIFO）
- 如果已报名 → 幂等返回当前状态
- 如果已取消 → 可以重新报名

返回：
- `status`: 'ENROLLED' | 'WAITLIST'
- `enrolled_count`: 已报名人数
- `waitlist_count`: 候补人数

#### `cancel_event(p_event_id uuid)`

取消报名：
- 如果已报名 → 标记为 CANCELLED，并自动将候补队首转正
- 如果候补中 → 标记为 CANCELLED
- 如果已取消 → 幂等

返回：
- `status`: 'CANCELLED' | 'NONE'
- `promoted_user`: 被转正的用户 ID（如果有）
- `enrolled_count`: 已报名人数
- `waitlist_count`: 候补人数

### RLS 策略

- **events 表**：
  - 公开活动（`is_listed = true`）可被所有人读取
  - 活动创建者可以读取、创建、更新自己的活动

- **event_registrations 表**：
  - 用户只能读取自己的报名记录
  - 活动创建者可以读取自己活动的所有报名记录
  - 用户只能创建/更新自己的报名记录

## 前端集成

前端代码已经准备好使用这些 API：

1. **API 文件**: `frontend/src/api/events.ts`
   - `rpcJoinEvent(eventId)` - 报名
   - `rpcCancelEvent(eventId)` - 取消
   - `getUserRegistration(eventId)` - 获取用户报名状态
   - `getEventCounters(eventId)` - 获取活动计数器

2. **页面**:
   - `EventDetailPage` - 已集成报名/取消功能
   - `EventListPage` - 已集成事件列表加载

## 注意事项

1. **权限**: RPC 函数使用 `SECURITY DEFINER`，确保函数拥有者有足够权限
2. **并发**: 使用 `FOR UPDATE` 锁定行，防止并发超卖
3. **幂等性**: 函数设计为幂等，重复调用不会产生副作用
4. **时区**: 所有时间存储为 UTC，前端显示时转换为 America/New_York

## 故障排除

### 错误：permission denied

- 确保用户已登录（`auth.uid()` 不为空）
- 检查 RLS 策略是否正确设置
- 确保函数有 `SECURITY DEFINER` 权限

### 错误：EVENT_NOT_FOUND

- 检查事件 ID 是否正确
- 确保事件存在于数据库中

### 错误：EVENT_NOT_OPEN

- 检查活动的 `join_policy` 是否为 'PUBLIC_OPEN'
- 检查 `is_listed` 是否为 true
- 检查 `rsvp_deadline` 是否已过期

## 下一步

1. 创建一些测试事件数据
2. 使用两个不同的用户账号测试报名/取消流程
3. 测试并发场景（多个用户同时报名）
4. 验证候补转正功能


