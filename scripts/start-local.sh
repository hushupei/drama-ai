#!/bin/bash
# 本地开发环境启动脚本（无需 Docker）

set -e

echo "🚀 短剧生成平台本地启动脚本"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_PORT=8080
AI_SERVICE_PORT=8000
FRONTEND_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379
RABBITMQ_PORT=5672
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# Check dependencies
echo "🔍 检查依赖..."

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java 未安装，请先安装 Java 17+${NC}"
    echo "   推荐: brew install openjdk@17"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
echo -e "${GREEN}✅ Java: $JAVA_VERSION${NC}"

# Check Maven
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}❌ Maven 未安装${NC}"
    echo "   推荐: brew install maven"
    exit 1
fi
echo -e "${GREEN}✅ Maven: $(mvn -v | head -n 1)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 未安装${NC}"
    echo "   推荐: brew install python@3.11"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✅ $PYTHON_VERSION${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo "   推荐: brew install node@20"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Check PostgreSQL
if ! command -v pg_ctl &> /dev/null && ! command -v postgres &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL 未安装，将使用内存数据库（H2）${NC}"
    USE_H2=true
else
    echo -e "${GREEN}✅ PostgreSQL 已安装${NC}"
    USE_H2=false
fi

# Check Redis
if ! command -v redis-server &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis 未安装，后端将不使用缓存${NC}"
    USE_REDIS=false
else
    echo -e "${GREEN}✅ Redis 已安装${NC}"
    USE_REDIS=true
fi

echo ""
echo -e "${BLUE}📝 环境配置${NC}"
echo "--------------"

# Create .env.local if not exists
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Database Configuration
DB_PASSWORD=postgres123
DB_URL=jdbc:h2:mem:testdb
DB_DRIVER=org.h2.Driver
DB_DIALECT=org.hibernate.dialect.H2Dialect

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secret
JWT_SECRET=this-is-a-secret-key-for-jwt-32-chars

# MinIO Configuration (local dev mode)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=drama-videos
MINIO_USE_SSL=false

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=admin
RABBITMQ_PASS=password

# OpenAI API (Required for AI features)
OPENAI_API_KEY=${OPENAI_API_KEY:-}
OPENAI_BASE_URL=https://api.openai.com/v1

# Service URLs
BACKEND_URL=http://localhost:8080
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✅ 创建 .env.local 配置文件${NC}"
fi

echo ""
echo -e "${BLUE}🏗️  构建项目${NC}"
echo "--------------"

# Build backend
echo "🔨 构建后端 (Java)..."
cd backend
if [ "$USE_H2" = true ]; then
    # Modify application.yml to use H2 for local dev
    cp src/main/resources/application.yml src/main/resources/application.yml.bak
    cat > src/main/resources/application.yml << 'EOF'
spring:
  application:
    name: short-drama-backend
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    database-platform: org.hibernate.dialect.H2Dialect
  h2:
    console:
      enabled: true
      path: /h2-console
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASS:guest}

server:
  port: 8080

jwt:
  secret: ${JWT_SECRET:this-is-a-secret-key-for-jwt-32-chars}
  expiration: 86400000

minio:
  endpoint: ${MINIO_ENDPOINT:localhost}
  port: ${MINIO_PORT:9000}
  accessKey: ${MINIO_ACCESS_KEY:minioadmin}
  secretKey: ${MINIO_SECRET_KEY:minioadmin}
  bucket: ${MINIO_BUCKET:drama-videos}
  useSSL: ${MINIO_USE_SSL:false}

ai:
  service:
    url: ${AI_SERVICE_URL:http://localhost:8000}

logging:
  level:
    com.shortdrama: DEBUG
EOF
fi
mvn clean package -DskipTests -q
cd ..
echo -e "${GREEN}✅ 后端构建完成${NC}"

# Setup Python AI service
echo "🐍 配置 Python AI 服务..."
cd ai-service
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✅ 创建 Python 虚拟环境${NC}"
fi
source venv/bin/activate
pip install -q -r requirements.txt
cd ..
echo -e "${GREEN}✅ AI 服务依赖安装完成${NC}"

# Build frontend
echo "⚛️  构建前端..."
cd frontend
npm install -q
npm run build 2>/dev/null || echo -e "${YELLOW}⚠️  前端构建警告（可忽略）${NC}"
cd ..
echo -e "${GREEN}✅ 前端构建完成${NC}"

echo ""
echo -e "${BLUE}🚀 启动服务${NC}"
echo "--------------"

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 正在停止所有服务...${NC}"
    if [ -n "$BACKEND_PID" ]; then kill $BACKEND_PID 2>/dev/null || true; fi
    if [ -n "$AI_PID" ]; then kill $AI_PID 2>/dev/null || true; fi
    if [ -n "$FRONTEND_PID" ]; then kill $FRONTEND_PID 2>/dev/null || true; fi
    if [ -n "$REDIS_PID" ]; then kill $REDIS_PID 2>/dev/null || true; fi
    # Restore backup if exists
    if [ -f "backend/src/main/resources/application.yml.bak" ]; then
        mv backend/src/main/resources/application.yml.bak backend/src/main/resources/application.yml
    fi
    echo -e "${GREEN}✅ 所有服务已停止${NC}"
    exit 0
}
trap cleanup INT TERM

# Start Redis if available
if [ "$USE_REDIS" = true ]; then
    echo "📦 启动 Redis..."
    redis-server --daemonize yes --port $REDIS_PORT
    sleep 1
    if redis-cli -p $REDIS_PORT ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis 已启动 (端口: $REDIS_PORT)${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis 启动失败，继续不使用缓存${NC}"
    fi
fi

# Start backend
echo "☕ 启动后端服务..."
cd backend
java -jar target/short-drama-backend-*.jar > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 5

# Check if backend started
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID, 端口: $BACKEND_PORT)${NC}"
else
    echo -e "${RED}❌ 后端服务启动失败，查看 logs/backend.log${NC}"
    exit 1
fi

# Start AI service
echo "🤖 启动 AI 服务..."
cd ai-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port $AI_SERVICE_PORT > ../logs/ai-service.log 2>&1 &
AI_PID=$!
cd ..
sleep 3

# Check if AI service started
if kill -0 $AI_PID 2>/dev/null; then
    echo -e "${GREEN}✅ AI 服务已启动 (PID: $AI_PID, 端口: $AI_SERVICE_PORT)${NC}"
else
    echo -e "${RED}❌ AI 服务启动失败，查看 logs/ai-service.log${NC}"
    cleanup
fi

# Start frontend (dev mode)
echo "🌐 启动前端开发服务器..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

# Check if frontend started
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ 前端开发服务器已启动 (PID: $FRONTEND_PID, 端口: $FRONTEND_PORT)${NC}"
else
    echo -e "${RED}❌ 前端启动失败，查看 logs/frontend.log${NC}"
    cleanup
fi

# Create logs directory if not exists
mkdir -p logs

echo ""
echo "=============================="
echo -e "${GREEN}🎉 所有服务已启动！${NC}"
echo "=============================="
echo ""
echo -e "${BLUE}📋 服务地址:${NC}"
echo "  - 前端应用:     http://localhost:$FRONTEND_PORT"
echo "  - 后端 API:     http://localhost:$BACKEND_PORT"
echo "  - AI 服务:      http://localhost:$AI_SERVICE_PORT"
echo "  - API 文档:     http://localhost:$BACKEND_PORT/swagger-ui.html"
echo "  - H2 控制台:    http://localhost:$BACKEND_PORT/h2-console"
echo ""
echo -e "${BLUE}📄 日志文件:${NC}"
echo "  - 后端日志:     logs/backend.log"
echo "  - AI服务日志:   logs/ai-service.log"
echo "  - 前端日志:     logs/frontend.log"
echo ""
echo -e "${BLUE}🛠️  常用命令:${NC}"
echo "  - 停止服务:     Ctrl+C"
echo "  - 查看后端日志: tail -f logs/backend.log"
echo "  - 查看AI日志:   tail -f logs/ai-service.log"
echo "  - 查看前端日志: tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}⏳ 按 Ctrl+C 停止所有服务${NC}"

# Wait for interrupt
wait
