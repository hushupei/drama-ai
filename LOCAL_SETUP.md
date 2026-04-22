# Mac mini 4 本地服务安装指南

## 系统要求

- macOS 14+ (Sonoma)
- Homebrew 已安装
- 内存 >= 16GB
- 存储 >= 512GB

## 安装步骤

### 1. PostgreSQL 15

```bash
# 安装
brew install postgresql@15

# 启动服务
brew services start postgresql@15

# 创建数据库
createdb shortdrama

# 验证
psql -d shortdrama -c "SELECT version();"
```

### 2. Redis 7

```bash
# 安装
brew install redis

# 启动服务
brew services start redis

# 验证
redis-cli ping
```

### 3. MinIO

```bash
# 下载
wget https://dl.min.io/server/minio/release/darwin-arm64/minio
chmod +x minio
mv minio /usr/local/bin/

# 创建数据目录
mkdir -p ~/minio-data

# 启动（开发模式）
export MINIO_ROOT_USER=minioadmin
export MINIO_ROOT_PASSWORD=minioadmin
minio server ~/minio-data --console-address :9001

# 验证
open http://localhost:9001
```

### 4. RabbitMQ

```bash
# 安装
brew install rabbitmq

# 启动服务
brew services start rabbitmq

# 验证
open http://localhost:15672
# 默认账号: guest / guest
```

## 环境变量配置

创建 `.env` 文件：

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shortdrama
DB_USERNAME=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# JWT
JWT_SECRET=your-secret-key-here
```

## 启动所有服务（开发模式）

```bash
# Terminal 1: PostgreSQL (已启动)
brew services start postgresql@15

# Terminal 2: Redis (已启动)
brew services start redis

# Terminal 3: MinIO
cd ~/minio-data && minio server . --console-address :9001

# Terminal 4: RabbitMQ (已启动)
brew services start rabbitmq

# Terminal 5: Java Backend
cd backend && ./mvnw spring-boot:run

# Terminal 6: Python AI Service
cd ai-service && python -m uvicorn main:app --reload
```

## 验证服务状态

```bash
# PostgreSQL
psql -d shortdrama -c "SELECT 1;"

# Redis
redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live

# RabbitMQ
curl http://localhost:15672/api/overview -u guest:guest

# Java Backend
curl http://localhost:8080/actuator/health

# Python AI Service
curl http://localhost:8000/health
```
