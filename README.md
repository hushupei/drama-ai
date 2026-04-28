# Drama AI - 短剧生成平台

小说转短剧 AI 生成平台，支持小说解析、剧本生成、TTS 语音合成和视频渲染。

## 技术栈

| 服务 | 技术 |
|------|------|
| Backend API | Java 17 + Spring Boot 3.2 |
| AI Service | Python 3.11 + FastAPI + Celery |
| Database | MySQL 8.0 |
| Cache / Message Broker | Redis 7 + RabbitMQ |
| Object Storage | MinIO |
| Frontend | React 18 + TypeScript + Vite + Ant Design |
| Reverse Proxy | Nginx |

## 快速开始 (Docker Compose)

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY 等必要配置

# 2. 一键启动所有服务
docker compose up -d

# 3. 查看服务状态
docker compose ps

# 4. 访问
#  前端:      http://localhost:3000
#  后端 API:  http://localhost:8080/api
#  AI 服务:  http://localhost:8000/docs (FastAPI Swagger)
#  MinIO:     http://localhost:9001 (admin / minioadmin)
```

## 服务架构

```
nginx (:3000)
├── /               → frontend (React SPA)
├── /api/           → backend:8080 (Spring Boot)
├── /api/v1/        → ai-service:8000 (FastAPI)
└── /media/         → minio:9000 (video files)

backend:8080
├── MySQL:3306
└── Redis:6379

ai-service:8000
├── RabbitMQ (Celery tasks)
├── MinIO (file uploads/outputs)
└── OpenAI API (script generation)
```

## AI 功能

| 功能 | API 端点 | 说明 |
|------|----------|------|
| 小说解析 | `POST /api/v1/tasks/parse` | 上传 TXT 文件，自动识别章节和角色（支持 UTF-8/GBK 编码） |
| 剧本生成 | `POST /api/v1/tasks/generate` | 基于章节内容，LLM 生成短剧剧本（JSON 格式） |
| 视频渲染 | `POST /api/v1/tasks/render` | TTS 语音合成 + MoviePy 视频合成 → MP4 |
| 任务管理 | `GET /api/v1/tasks/stats` | 查看异步任务执行历史、状态和统计 |

## 项目结构

```
.
├── backend/              # Java Spring Boot
│   ├── src/main/java/com/shortdrama/
│   │   ├── controller/   # REST API 控制器
│   │   ├── service/      # 业务逻辑层
│   │   ├── repository/   # 数据访问层 (JPA)
│   │   ├── entity/       # 数据库实体
│   │   ├── security/     # JWT + Service Token 认证
│   │   └── config/       # Spring 配置
│   └── src/test/         # JUnit 5 + Mockito 测试
├── ai-service/           # Python FastAPI + Celery
│   ├── app/
│   │   ├── api/          # FastAPI 路由 + Backend 客户端
│   │   ├── tasks/        # Celery 异步任务
│   │   ├── services/     # TTS、LLM、解析服务
│   │   └── core/         # 配置、日志、MinIO 客户端
│   └── tests/            # pytest 单元测试
├── frontend/             # React 18 + TypeScript
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── hooks/        # TanStack Query Hooks
│   │   ├── api/          # Axios API 客户端
│   │   └── types/        # TypeScript 类型定义
│   └── e2e/              # Playwright E2E 测试
├── docker-compose.yml    # 8 服务编排
├── .env.example          # 环境变量模板
└── V2/                   # 设计文档和开发计划
```

## 开发环境 (非 Docker)

```bash
# 后端
cd backend && ./mvnw spring-boot:run

# AI 服务
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload

# 前端
cd frontend && npm install && npm run dev
```

## API 文档

| 服务 | 地址 | 框架 |
|------|------|------|
| Backend | http://localhost:8080/swagger-ui.html | SpringDoc OpenAPI |
| AI Service | http://localhost:8000/docs | FastAPI Swagger UI |

## 测试

```bash
# 后端测试
cd backend && ./mvnw test

# AI 服务测试
cd ai-service && python -m pytest tests/ -v

# 前端单元测试
cd frontend && npx vitest run

# E2E 测试 (需要 Docker 环境运行中)
cd frontend && npx playwright test
```

## 设计文档

- [架构设计](V2/ARCHITECTURE_DESIGN.md)
- [开发计划](V2/DEVELOPMENT_PLAN.md)
- [编码规范](V2/CODING_STANDARDS.md)
