#!/bin/bash
# Deployment script for Short Drama Generator

set -e

echo "🎬 短剧生成平台部署脚本"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在，正在从 .env.example 创建...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  请编辑 .env 文件，配置必要的参数（特别是数据库密码和 OpenAI API Key）${NC}"
    exit 1
fi

# Check Docker and Docker Compose
echo "🔍 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装，请先安装 Docker Compose${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 环境检查通过${NC}"

# Create necessary directories
echo "📁 创建必要的目录..."
mkdir -p data/postgres data/redis data/minio data/rabbitmq

# Build and start services
echo "🔨 构建并启动服务..."
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo "⏳ 等待服务启动..."
sleep 10

# Check service health
echo "🏥 检查服务健康状态..."
services=("short-drama-postgres" "short-drama-redis" "short-drama-minio" "short-drama-rabbitmq" "drama-backend" "drama-ai-service")

for service in "${services[@]}"; do
    if docker ps | grep -q "$service"; then
        echo -e "${GREEN}✅ $service 正在运行${NC}"
    else
        echo -e "${RED}❌ $service 启动失败${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "📋 访问地址:"
echo "  - 前端应用: http://localhost:3000"
echo "  - 后端 API: http://localhost:8080"
echo "  - AI 服务:  http://localhost:8000"
echo "  - MinIO 控制台: http://localhost:9001"
echo "  - RabbitMQ 控制台: http://localhost:15672"
echo ""
echo "📖 常用命令:"
echo "  - 查看日志: docker-compose logs -f [service-name]"
echo "  - 停止服务: docker-compose down"
echo "  - 重启服务: docker-compose restart"
echo "  - 查看状态: docker-compose ps"
echo ""
echo "🔧 如需联调测试，请运行: ./scripts/integration-test.sh"
