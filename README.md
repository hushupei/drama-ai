# Drama AI - 短剧生成平台后端

## 简介
小说转短剧生成平台后端服务，基于 Java Spring Boot + Python FastAPI。

## Features

| Task | Feature | 描述 | 完成日期 | 版本 |
|------|---------|------|----------|------|
| Task 1 | Project Init | 项目初始化，基础架构搭建 | 2026-04-22 | v0.1.0 |
| Task 2 | Database Layer | 数据库实体与 Repository 层 | - | - |
| Task 3 | Service Layer | Service 层与业务逻辑 | - | - |
| Task 4 | REST API | REST API 控制器层 | - | - |
| Task 5 | AI Architecture | Python AI 服务基础架构 | - | - |
| Task 6 | Novel Parser | 小说解析服务实现 | - | - |

## 技术栈
- Java 17 + Spring Boot 3.2
- Python 3.11 + FastAPI
- PostgreSQL 15
- Redis 7
- MinIO
- RabbitMQ

## 开发环境搭建

### 1. 安装本地服务（Mac mini 4）

```bash
# PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Redis
brew install redis
brew services start redis

# MinIO
mkdir -p ~/minio-data
minio server ~/minio-data --console-address :9001

# RabbitMQ
brew install rabbitmq
brew services start rabbitmq
```

### 2. 启动后端服务

```bash
cd backend
./mvnw spring-boot:run
```

### 3. 启动 AI 服务

```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

## 项目结构

```
.
├── backend/          # Java Spring Boot
├── ai-service/       # Python FastAPI
└── docker-compose.yml
```

## 仓库地址

https://github.com/hushupei/drama-ai.git
