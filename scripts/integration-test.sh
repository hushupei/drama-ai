#!/bin/bash
# Integration test script for Short Drama Generator

set -e

echo "🧪 短剧生成平台联调测试脚本"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080/api"
FRONTEND_URL="http://localhost:3000"
AI_SERVICE_URL="http://localhost:8000"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test API endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -n "🔍 测试: $description ... "

    if [ -z "$data" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$endpoint" || echo "000")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" || echo "000")
    fi

    if [ "$response" -ge 200 ] && [ "$response" -lt 300 ]; then
        echo -e "${GREEN}✅ 通过 (HTTP $response)${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ 失败 (HTTP $response)${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test service health
test_health() {
    local url=$1
    local service=$2

    echo -n "🔍 测试: $service 健康检查 ... "

    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo ""
echo -e "${BLUE}📡 服务健康检查${NC}"
echo "----------------"

# Test infrastructure services
test_health "$BASE_URL/actuator/health" "Java 后端服务"
test_health "$AI_SERVICE_URL/health" "Python AI 服务"
test_health "$FRONTEND_URL" "前端应用"

echo ""
echo -e "${BLUE}📚 小说管理 API 测试${NC}"
echo "----------------"

# Test Novel API
test_api "GET" "/novels" "" "获取小说列表"
test_api "POST" "/novels" '{"title":"测试小说","author":"测试作者"}' "创建小说"

echo ""
echo -e "${BLUE}👤 角色管理 API 测试${NC}"
echo "----------------"

# Test Character API (will test with first novel)
NOVEL_ID=$(curl -s "$BASE_URL/novels" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$NOVEL_ID" ]; then
    test_api "GET" "/novels/$NOVEL_ID/characters" "" "获取角色列表"
    test_api "POST" "/novels/$NOVEL_ID/characters" \
        '{"name":"测试角色","description":"这是一个测试角色"}' \
        "创建角色"
else
    echo -e "${YELLOW}⚠️  跳过角色测试: 未找到小说${NC}"
fi

echo ""
echo -e "${BLUE}🔐 认证 API 测试${NC}"
echo "----------------"

test_api "POST" "/auth/register" \
    '{"username":"testuser","email":"test@example.com","password":"testpass"}' \
    "用户注册"

test_api "POST" "/auth/login" \
    '{"username":"testuser","password":"testpass"}' \
    "用户登录"

echo ""
echo -e "${BLUE}📊 项目 API 测试${NC}"
echo "----------------"

test_api "GET" "/projects" "" "获取项目列表"
test_api "POST" "/projects" \
    '{"name":"测试项目","type":"episode","novelId":"'$NOVEL_ID'"}' \
    "创建项目"

echo ""
echo "================================"
echo -e "${GREEN}✅ 测试通过: $TESTS_PASSED${NC}"
echo -e "${RED}❌ 测试失败: $TESTS_FAILED${NC}"
echo "================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有联调测试通过！系统运行正常。${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查服务日志${NC}"
    echo ""
    echo "查看日志命令:"
    echo "  docker-compose logs -f backend"
    echo "  docker-compose logs -f ai-service"
    exit 1
fi
