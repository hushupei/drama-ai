# 环境搭建指南

推荐使用 Docker Compose 一键启动全部服务。仅在需要本地调试单个服务时才使用手动安装。

## 方式一：Docker Compose（推荐）

### 前置要求

- Docker Desktop 4.x+
- 至少 8GB 内存分配给 Docker

### 启动

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，至少需要配置 OPENAI_API_KEY

# 2. 启动全部服务
docker compose up -d

# 3. 查看日志
docker compose logs -f

# 4. 停止
docker compose down
```

### 验证服务状态

```bash
# Java Backend
curl http://localhost:8080/actuator/health

# Python AI Service
curl http://localhost:8000/health

# MinIO
curl http://localhost:9000/minio/health/live

# 前端
curl http://localhost:3000
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENAI_API_KEY` | — | OpenAI API 密钥（必填） |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | LLM API 地址（可用兼容服务） |
| `SERVICE_API_TOKEN` | `internal-dev-token` | AI 服务 → Backend 内部认证 Token |
| `MINIO_BUCKET` | `drama-files` | MinIO 存储桶名称 |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT 签名密钥 |
| `MYSQL_ROOT_PASSWORD` | `root123` | MySQL root 密码 |

## 方式二：手动安装（仅调试用）

### macOS (Apple Silicon)

```bash
# MySQL 8.0
brew install mysql@8.0
brew services start mysql@8.0

# Redis
brew install redis
brew services start redis

# RabbitMQ
brew install rabbitmq
brew services start rabbitmq

# MinIO
mkdir -p ~/minio-data
minio server ~/minio-data --console-address :9001
```

### 启动开发服务器

```bash
# Terminal 1: Backend
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Terminal 2: AI Service
cd ai-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 3: Celery Worker
cd ai-service
celery -A app.core.celery worker --loglevel=info

# Terminal 4: Frontend
cd frontend
npm install && npm run dev
```

## 数据库初始化

Docker Compose 会自动创建数据库表（Spring Boot JPA `ddl-auto: update`）。

手动初始化：

```bash
# 进入 MySQL 容器
docker compose exec mysql mysql -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS shortdrama;
```

## 故障排查

### MySQL 连接失败

```bash
# 检查 MySQL 是否就绪
docker compose logs mysql | grep "ready for connections"
```

### AI 服务无法连接 Backend

确认 `SERVICE_API_TOKEN` 在 `.env` 和 Backend `application.yml` 中一致。

### Celery 任务不执行

```bash
# 检查 RabbitMQ 状态
docker compose logs rabbitmq

# 重启 Celery Worker
docker compose restart celery-worker
```

### MinIO Bucket 不存在

```bash
# 手动创建
docker compose exec minio mc mb local/drama-files
```
