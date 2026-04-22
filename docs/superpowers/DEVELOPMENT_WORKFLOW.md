# 短剧生成平台 - 开发规范

**版本**: v1.0  
**日期**: 2026-04-22  
**适用范围**: 所有开发任务

---

## 分支管理规范

### 分支结构

```
master (主分支，始终可部署)
  ├── task-001-project-init (任务分支)
  ├── task-002-database-layer
  ├── task-003-service-layer
  └── ...
```

### 分支命名规则

**格式**: `task-<序号>-<任务简称>`

| 任务 | 分支名 |
|------|--------|
| Task 1: 项目初始化 | `task-001-project-init` |
| Task 2: 数据库实体 | `task-002-database-layer` |
| Task 3: Service层 | `task-003-service-layer` |
| Task 4: REST API | `task-004-rest-api` |
| Task 5: Python AI架构 | `task-005-ai-architecture` |
| Task 6: 小说解析服务 | `task-006-novel-parser` |
| Task 7: 前端架构 | `task-007-frontend-arch` |
| Task 8: 前端页面 | `task-008-frontend-pages` |
| Task 9: 集成测试 | `task-009-integration-test` |

### 分支创建流程

```bash
# 1. 确保本地 master 最新
git checkout master
git pull origin master

# 2. 创建任务分支
git checkout -b task-001-project-init

# 3. 推送分支到远程
git push -u origin task-001-project-init
```

---

## 开发流程

### 阶段 1: 开发阶段 (Dev)

**准入条件**: 任务分支已创建，编码准则已阅读

**开发步骤**:
1. 编写代码（遵循 CODING_STANDARDS.md）
2. 编写单元测试（覆盖率 ≥ 70%）
3. 本地运行测试
4. 提交代码（遵循 Git 提交规范）

**提交规范**:
```
<type>: <简短描述>

<详细描述（可选）>

Refs: Task <编号>
```

**类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 重构
- `test`: 测试相关
- `docs`: 文档
- `chore`: 杂项

**示例**:
```
feat: add Novel entity and repository

- Add Novel entity with JPA annotations
- Add NovelRepository with custom queries
- Add database migration

Refs: Task 2
```

### 阶段 2: 测试阶段 (Test)

**准入条件**: 开发阶段完成，所有单元测试通过

**测试步骤**:
1. 补充缺失的测试用例
2. 运行完整测试套件
3. 检查覆盖率报告
4. 修复发现的 Bug
5. 代码审查（code-reviewer agent）

**测试通过标准**:
- [ ] 单元测试全部通过
- [ ] 覆盖率 ≥ 70%
- [ ] 静态分析无严重警告
- [ ] 代码审查通过

**Bug 记录**: 在 TASK_TRACKING.md 中记录发现的 Bug 及修复时间

### 阶段 3: 集成测试阶段 (Integration)

**准入条件**: 测试阶段完成，前后端代码就绪

**集成测试步骤**:
1. 启动所有本地服务（PostgreSQL、Redis、MinIO、RabbitMQ）
2. 启动后端服务
3. 启动 Python AI 服务
4. 启动前端开发服务器
5. 执行集成测试用例
6. 验证 API 响应格式
7. 验证前端交互
8. 记录失败和修复

**集成测试通过标准**:
- [ ] 所有 curl 测试命令返回预期结果
- [ ] 前端页面功能正常
- [ ] 端到端流程可完整运行
- [ ] 性能指标达标（API P95 < 500ms）

---

## 合并规范

### 合并准入条件

**必须全部满足**:
- [ ] 开发阶段完成（代码实现）
- [ ] 测试阶段完成（单测覆盖率 ≥ 70%，Bug 修复）
- [ ] 集成测试阶段完成（前后端联调通过）
- [ ] 代码审查通过
- [ ] TASK_TRACKING.md 已更新（时间、Bug 数）

### 合并流程

```bash
# 1. 确保任务分支最新
git checkout task-001-project-init
git pull origin task-001-project-init

# 2. 同步 master 最新变更
git fetch origin master
git rebase origin/master

# 3. 解决冲突（如有）
# ...

# 4. 再次运行测试确认
cd backend && mvn test
cd ai-service && pytest
cd frontend && npm test

# 5. 合并到 master
git checkout master
git merge --no-ff task-001-project-init -m "feat: complete Task 1 - Project Initialization

- Add Maven configuration with Spring Boot 3.2
- Add Python FastAPI project structure
- Add React frontend with Vite

Refs: Task 1"

# 6. 推送 master
git push origin master

# 7. 删除任务分支
git branch -d task-001-project-init
git push origin --delete task-001-project-init
```

### 禁止事项

- ❌ **禁止跳过集成测试直接合并**
- ❌ **禁止在任务分支直接修改 master 专属配置**
- ❌ **禁止合并覆盖率 < 70% 的代码**
- ❌ **禁止合并未经代码审查的代码**
- ❌ **禁止在任务分支上长期不合并**（超过 2 周）

---

## 时间记录规范

### 记录维度

每个任务记录以下时间数据：

| 维度 | 说明 | 记录内容 |
|------|------|----------|
| 开发时间 | 编写代码和单元测试 | 开始时间、结束时间、总时长 |
| 开发失败 | 开发阶段的失败/重构 | 失败次数、失败原因 |
| 测试时间 | 运行测试和修复 Bug | 开始时间、结束时间、总时长 |
| 测试失败 | 测试不通过 | 失败次数、失败原因 |
| Bug 数量 | 测试阶段发现的 Bug | 严重/中等/轻微 Bug 数量 |
| 集成时间 | 前后端联调 | 开始时间、结束时间、总时长 |
| 集成失败 | 集成测试失败 | 失败次数、失败原因 |

### 记录格式

在 TASK_TRACKING.md 中按以下格式记录：

```markdown
## Task 1: 项目初始化

**状态**: ✅ 已完成

### 时间统计

| 阶段 | 开始时间 | 结束时间 | 总时长 | 失败次数 |
|------|----------|----------|--------|----------|
| 开发 | 2026-04-22 09:00 | 2026-04-22 18:00 | 9h | 1 |
| 测试 | 2026-04-22 19:00 | 2026-04-22 20:30 | 1.5h | 0 |
| 集成 | 2026-04-22 21:00 | 2026-04-22 22:00 | 1h | 0 |

### Bug 统计

| 级别 | 数量 | 修复时间 |
|------|------|----------|
| 严重 | 0 | - |
| 中等 | 1 | 30min |
| 轻微 | 2 | 15min |

### 失败记录

**开发阶段失败 #1**:
- 原因: Maven 依赖冲突
- 解决: 排除冲突依赖，统一版本
- 耗时: 45min

### 备注

- 其他需要记录的信息
```

---

## 工具使用规范

### 必须使用的工具

| 工具 | 用途 | 检查点 |
|------|------|--------|
| JaCoCo | Java 覆盖率 | `mvn jacoco:report` |
| pytest-cov | Python 覆盖率 | `pytest --cov=app` |
| vitest | 前端测试 | `npm run test:coverage` |
| SpotBugs | Java 静态分析 | `mvn spotbugs:check` |
| pylint | Python 静态分析 | `pylint app/` |
| ESLint | 前端静态分析 | `npm run lint` |

### 可选工具

- SonarLint: IDE 插件，实时检查代码质量
- httpyac: API 测试，替代 curl
- Playwright: E2E 测试

---

## 应急处理

### 集成测试失败处理

**步骤**:
1. 记录失败原因到 TASK_TRACKING.md
2. 修复问题
3. 重新运行集成测试
4. 重复直到通过

**常见失败原因**:
- API 响应格式不匹配 → 修改后端或前端
- 数据库字段不一致 → 更新 Liquibase 脚本
- 环境配置问题 → 检查本地服务状态
- 并发问题 → 添加锁或队列

### 合并冲突处理

**步骤**:
1. 暂停合并
2. 在任务分支执行 `git rebase origin/master`
3. 逐条解决冲突
4. 测试通过后继续合并

**禁止**:
- 使用 `git push -f` 强制推送
- 忽略冲突直接合并

---

## 流程检查清单

### 开发前
- [ ] 克隆对应仓库（后端: https://github.com/hushupei/drama-ai.git / 前端: https://github.com/hushupei/drama-ai-fe.git）
- [ ] 从 master 拉取最新代码
- [ ] 创建任务分支（task-<序号>-<简称>）
- [ ] 阅读 CODING_STANDARDS.md 和 REPO_CONFIG.md
- [ ] 更新 TASK_TRACKING.md（设置状态为"开发中"）

### 开发中
- [ ] 遵循编码准则
- [ ] 编写单元测试
- [ ] 定期提交代码
- [ ] 保持分支与 master 同步（定期 rebase）

### 开发后
- [ ] 运行完整测试套件
- [ ] 检查覆盖率 ≥ 70%
- [ ] 运行静态分析
- [ ] 更新 TASK_TRACKING.md（开发时间和失败次数）

### 测试阶段
- [ ] 补充测试用例
- [ ] 修复发现的 Bug
- [ ] 记录 Bug 数量和修复时间
- [ ] 代码审查
- [ ] 更新 TASK_TRACKING.md

### 集成测试阶段
- [ ] 启动所有本地服务
- [ ] 执行 curl 测试
- [ ] 验证前端交互
- [ ] 记录失败和修复
- [ ] 更新 TASK_TRACKING.md

### 合并前
- [ ] 确认所有阶段完成
- [ ] 确认 TASK_TRACKING.md 已更新
- [ ] 确认 README.md Feature 记录已更新
- [ ] 确认代码审查通过
- [ ] 执行合并流程
- [ ] **推送 master 到远程仓库**（必须完成后才能标记任务完成）
- [ ] 删除任务分支

**重要**: 任务只有满足以下条件才能标记为"已完成"：
1. 代码已合并到 master 分支
2. **master 分支已推送到远程仓库**（https://github.com/hushupei/drama-ai.git 或 https://github.com/hushupei/drama-ai-fe.git）
3. TASK_TRACKING.md 已更新并提交

---

**违规处理**: 未按规范执行导致的问题，需回滚代码并重新执行流程。
