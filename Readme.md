# FitMatch

FitMatch 是一个连接健身教练和学员的在线平台，提供课程搜索、匹配、预约等功能。

## 项目结构

```
/Fitmatch/
├── backend/                # 后端服务
│   ├── apigateway/        # API 网关服务
│   ├── chatservice/       # 实时聊天服务
│   ├── courseservice/     # 课程管理服务
│   └── userservice/       # 用户管理服务
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── api/          # API 客户端
│   │   ├── components/   # 可复用组件
│   │   ├── contexts/     # React Context
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── layouts/      # 页面布局组件
│   │   ├── pages/        # 页面组件
│   │   └── utils/        # 工具函数
│   └── public/           # 静态资源
└── docker-compose.yml    # Docker 编排配置
```

## 开发环境要求

- Node.js >= 18
- Java >= 17
- Maven >= 3.8
- Docker & Docker Compose (用于容器化部署)

## 本地开发

### 前端开发

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 访问 http://localhost:5173

### 后端开发

#### API Gateway

```bash
cd backend/apigateway
# 加载环境变量
export $(grep -v '^#' ../../.env | xargs)
# 启动服务
./mvnw spring-boot:run
```

#### Chat Service

```bash
cd backend/chatservice
npm install
npm run dev
```

#### Course Service

```bash
cd backend/courseservice
./mvnw spring-boot:run
```

#### User Service

```bash
cd backend/userservice
./mvnw spring-boot:run
```

## Docker 部署

1. 构建镜像：
```bash
docker-compose build
```

2. 启动服务：
```bash
docker-compose up -d
```

3. 查看服务状态：
```bash
docker-compose ps
```

4. 停止服务：
```bash
docker-compose down
```

## 环境变量配置

项目根目录下需要创建 `.env` 文件，包含以下配置：

```env
# API Gateway
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080

# Chat Service
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/fitmatch

# Course Service
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitmatch
DB_USER=postgres
DB_PASSWORD=postgres

# User Service
AUTH_SECRET=your-jwt-secret
```

## 主要功能

- 用户认证与授权
- 课程搜索与匹配
- 实时聊天
- 课程预约
- 教练管理
- 用户资料管理

---

# FitMatch (English)

FitMatch is an online platform connecting fitness coaches and students, offering course search, matching, and booking functionalities.

## Project Structure

```
/Fitmatch/
├── backend/                # Backend services
│   ├── apigateway/        # API Gateway service
│   ├── chatservice/       # Real-time chat service
│   ├── courseservice/     # Course management service
│   └── userservice/       # User management service
├── frontend/              # Frontend application
│   ├── src/
│   │   ├── api/          # API clients
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React Contexts
│   │   ├── hooks/        # Custom Hooks
│   │   ├── layouts/      # Page layouts
│   │   ├── pages/        # Page components
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
└── docker-compose.yml    # Docker composition config
```

## Development Requirements

- Node.js >= 18
- Java >= 17
- Maven >= 3.8
- Docker & Docker Compose (for containerized deployment)

## Local Development

### Frontend Development

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Visit http://localhost:5173

### Backend Development

#### API Gateway

```bash
cd backend/apigateway
# Load environment variables
export $(grep -v '^#' ../../.env | xargs)
# Start service
./mvnw spring-boot:run
```

#### Chat Service

```bash
cd backend/chatservice
npm install
npm run dev
```

#### Course Service

```bash
cd backend/courseservice
./mvnw spring-boot:run
```

#### User Service

```bash
cd backend/userservice
./mvnw spring-boot:run
```

## Docker Deployment

1. Build images:
```bash
docker-compose build
```

2. Start services:
```bash
docker-compose up -d
```

3. Check service status:
```bash
docker-compose ps
```

4. Stop services:
```bash
docker-compose down
```

## Environment Variables

Create a `.env` file in the project root with the following configurations:

```env
# API Gateway
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080

# Chat Service
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017/fitmatch

# Course Service
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fitmatch
DB_USER=postgres
DB_PASSWORD=postgres

# User Service
AUTH_SECRET=your-jwt-secret
```

## Core Features

- User Authentication & Authorization
- Course Search & Matching
- Real-time Chat
- Course Booking
- Coach Management
- User Profile Management