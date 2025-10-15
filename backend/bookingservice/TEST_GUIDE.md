# 🧪 Booking Service 测试指南

## 📋 测试准备

### 1. 启动服务
```bash
# 启动API Gateway (端口8080)
cd backend/apigateway
./mvnw spring-boot:run

# 启动Booking Service (端口8083)
cd backend/bookingservice
./mvnw spring-boot:run
```

### 2. 准备测试数据
在Supabase SQL Editor中执行：
```sql
-- 执行真实ID测试数据脚本
-- 复制 real_test_data.sql 的内容到Supabase SQL Editor中执行
```

执行后会显示测试数据的ID，记录下来用于API测试。

## 🚀 API测试流程

### 测试数据ID（执行real_test_data.sql后获取）
- **Session ID**: `your-session-id` (执行SQL后获取)
- **User A Package ID**: `user-a-package-id` (执行SQL后获取)
- **User B Package ID**: `user-b-package-id` (执行SQL后获取)
- **User A ID**: `3047992c-2d2e-4171-9bde-a6e05357d3f7`
- **User B ID**: `83a3e2e8-d93a-4162-9d18-6e097146f535`

### 🧪 测试1：A用户预约（应该成功）
```bash
curl -X POST "http://localhost:8080/bookings/session" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 3047992c-2d2e-4171-9bde-a6e05357d3f7" \
  -d '{
    "eventId": "your-session-id",
    "userCoursePackageId": "user-a-package-id"
  }'
```

**预期响应**：
```json
{
  "status": "CONFIRMED",
  "message": "Booking confirmed successfully",
  "bookingId": "some-uuid"
}
```

### 🧪 测试2：B用户预约（应该进入等候队列）
```bash
curl -X POST "http://localhost:8080/bookings/session" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 83a3e2e8-d93a-4162-9d18-6e097146f535" \
  -d '{
    "eventId": "your-session-id",
    "userCoursePackageId": "user-b-package-id"
  }'
```

**预期响应**：
```json
{
  "status": "WAITLISTED",
  "message": "Session is full, you have been added to the waitlist"
}
```

### 🧪 测试3：A用户取消（B应该自动补位）
```bash
curl -X POST "http://localhost:8080/bookings/cancel" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 3047992c-2d2e-4171-9bde-a6e05357d3f7" \
  -d '{
    "eventId": "your-session-id"
  }'
```

**预期响应**：
```json
{
  "result": "PROMOTED:83a3e2e8-d93a-4162-9d18-6e097146f535",
  "message": "Booking cancelled and student promoted from waitlist",
  "promotedStudentId": "83a3e2e8-d93a-4162-9d18-6e097146f535"
}
```

### 🧪 测试4：查看B用户日程
```bash
curl -X GET "http://localhost:8080/bookings/schedule?from=2024-01-01&to=2024-12-31" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000004"
```

**预期响应**：
```json
[
  {
    "studentId": "83a3e2e8-d93a-4162-9d18-6e097146f535",
    "coachId": "571b85e8-4684-4ac9-a1bf-b882d1cf2eb9",
    "courseId": "06902cd5-e14f-4810-9d24-9c1686e936d8",
    "sessionEventId": "your-session-id",
    "title": "Test Session - Capacity 1",
    "bookingStatus": "CONFIRMED",
    "startTs": "2024-01-01T10:00:00Z",
    "endTs": "2024-01-01T11:00:00Z"
  }
]
```

### 🧪 测试5：手动补位（可选）
```bash
curl -X POST "http://localhost:8080/bookings/promote/your-session-id" \
  -H "Content-Type: application/json"
```

## 🔍 验证数据库状态

在Supabase中检查以下表：

### session_booking表
```sql
SELECT * FROM public.session_booking 
WHERE event_id = 'your-session-id';
```
- 应该有B用户的CONFIRMED记录
- A用户的记录应该是CANCELLED

### session_waitlist表
```sql
SELECT * FROM public.session_waitlist 
WHERE event_id = 'your-session-id';
```
- 应该为空（B用户已补位）

### user_course_package表
```sql
SELECT user_id, remaining_credits, status 
FROM public.user_course_package 
WHERE user_id IN (
    '3047992c-2d2e-4171-9bde-a6e05357d3f7',
    '83a3e2e8-d93a-4162-9d18-6e097146f535'
);
```
- B用户的余额应该-1（从1变成0）
- A用户的余额应该+1（取消时返还）

### coach_calendar_event表
```sql
SELECT id, title, capacity, booked_count 
FROM public.coach_calendar_event 
WHERE id = 'your-session-id';
```
- booked_count应该是1（B用户占用）

## 🎯 测试成功标准

✅ **A预约成功** - 返回CONFIRMED，booked_count=1，A余额-1
✅ **B预约等候** - 返回WAITLISTED，不扣包，进入等候队列
✅ **A取消补位** - 返回PROMOTED，B变CONFIRMED，B余额-1，booked_count保持1
✅ **B取消返还** - 返回CANCELLED，booked_count=0，B余额+1
✅ **日程查询** - 能看到各自的预约变化

## 🚨 常见问题

1. **函数不存在错误** - 确保启动时SQL函数已执行
2. **外键约束错误** - 确保测试数据ID正确
3. **容量检查错误** - 确保session的capacity=1
4. **课包余额不足** - 确保测试用户的remaining_credits>=1

## 📝 测试记录

记录每次测试的结果，确保所有场景都正常工作。
