# 短剧生成平台 - 仓库配置

**版本**: v1.0  
**日期**: 2026-04-22  

---

## 仓库地址

| 项目 | 仓库地址 | 用途 |
|------|----------|------|
| 后端服务 | https://github.com/hushupei/drama-ai.git | Java Spring Boot + Python AI |
| 前端应用 | https://github.com/hushupei/drama-ai-fe.git | React 前端 |

---

## 目录结构

### 后端仓库 (drama-ai)

```
drama-ai/
├── backend/                 # Java Spring Boot
│   ├── src/
│   ├── pom.xml
│   └── README.md           # 后端特性记录
├── ai-service/             # Python AI 服务
│   ├── app/
│   ├── requirements.txt
│   └── README.md
├── docker-compose.yml      # 本地服务配置
└── README.md               # 项目总览 + Feature 记录
```

### 前端仓库 (drama-ai-fe)

```
drama-ai-fe/
├── src/
├── public/
├── package.json
└── README.md               # 前端特性记录
```

---

## README.md Feature 记录规范

### 记录位置

每个仓库的 `README.md` 文件必须包含 **Features** 章节，记录已完成的特性。

### 记录格式

```markdown
## Features

| Task | Feature | 描述 | 完成日期 | 版本 |
|------|---------|------|----------|------|
| Task 1 | Project Init | 项目初始化，基础架构搭建 | 2026-04-22 | v0.1.0 |
| Task 2 | Database Layer | 数据库实体与 Repository | - | - |
| ... | ... | ... | ... | ... |
```

### 记录时机

- **Task 完成后**: 立即更新 README.md
- **合并到 master 前**: 确保 Feature 记录已提交
- **发布版本时**: 更新版本号列

### 后端仓库 README.md 示例

```markdown
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
...
```

### 前端仓库 README.md 示例

```markdown
# Drama AI FE - 短剧生成平台前端

## 简介
小说转短剧生成平台前端应用，基于 React 18 + TypeScript。

## Features

| Task | Feature | 描述 | 完成日期 | 版本 |
|------|---------|------|----------|------|
| Task 7 | Frontend Arch | 前端基础架构 | - | - |
| Task 8 | Frontend Pages | 前端页面开发 | - | - |
| Task 9 | Integration Test | 集成测试与联调 | - | - |

## 技术栈
- React 18
- TypeScript
- Vite
- Ant Design
- Zustand

## 开发环境搭建
...
```

---

## 分支策略

### 后端仓库分支

```
master                    # 生产分支
├── task-001-project-init
├── task-002-database-layer
├── task-003-service-layer
├── task-004-rest-api
├── task-005-ai-architecture
└── task-006-novel-parser
```

### 前端仓库分支

```
master                    # 生产分支
├── task-007-frontend-arch
├── task-008-frontend-pages
└── task-009-integration-test
```

### 跨仓库协作

- **Task 1-6**: 主要在后端仓库开发
- **Task 7-8**: 主要在前端仓库开发
- **Task 9**: 需要前后端仓库同时更新（集成测试）

---

## 提交规范

### 后端仓库提交

```
feat: add Novel entity and repository

- Add Novel entity with JPA annotations
- Add NovelRepository interface
- Add database migration

Refs: Task 2
Repo: https://github.com/hushupei/drama-ai.git
```

### 前端仓库提交

```
feat: add NovelList page and components

- Add NovelListPage component
- Add NovelCard component
- Add useNovelList hook

Refs: Task 8
Repo: https://github.com/hushupei/drama-ai-fe.git
```

---

## 仓库操作命令

### 初始化后端仓库

```bash
git clone https://github.com/hushupei/drama-ai.git
cd drama-ai
git checkout -b task-001-project-init
```

### 初始化前端仓库

```bash
git clone https://github.com/hushupei/drama-ai-fe.git
cd drama-ai-fe
git checkout -b task-007-frontend-arch
```

### 添加 Feature 记录

```bash
# 编辑 README.md，添加 Feature 记录
vim README.md

git add README.md
git commit -m "docs: update feature record for Task X

- Add Task X to Features table
- Update completion date

Refs: Task X"
```

---

## 版本号规则

| 版本 | 说明 |
|------|------|
| v0.1.0 | Task 1 完成 |
| v0.2.0 | Task 2 完成 |
| ... | ... |
| v1.0.0 | Phase 1 MVP 完成 |

版本号更新时机：
- 每个 Task 完成后更新 Minor 版本
- Bug 修复更新 Patch 版本
- Phase 完成更新 Major 版本
