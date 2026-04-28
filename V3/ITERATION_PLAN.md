# V3 迭代计划 — 任务系统增强

## 概述

V3 的核心目标是将任务系统变得可观测、可调试、用户友好。当前系统存在关键缺陷：任务静默失败后不出现在历史记录中，标识符是难以阅读的 UUID，用户无法了解任务正在做什么以及为何失败。

## 根因分析：任务 308e1f07 重试循环

该任务持续重试但不出现于历史记录，由两个 Bug 共同导致：

1. **parse_novel_task 未调用 TaskLogger**：`parse_novel_task` 从未调用 `task_logger.log_task_start()` / `log_task_failure()`。整个系统中只有 `generate_script_task` 调用了日志记录器，因此解析任务在历史中完全不可见。
2. **双重错误**：任务因 `NoSuchKey`（MinIO 文件不存在）和 `gb2312 codec can't decode byte 0x92`（编码检测失败）同时失败。在 3 次重试（每次间隔 60 秒）后，Celery 放弃执行，但没有任何失败记录被保存。

## 各阶段概览

### 第一阶段：TaskLogger 全量集成（关键 Bug 修复）

**问题**：只有 `generate_script_task` 调用 `task_logger`。`parse_novel_task` 和 `render_video_task` 以及其他定时任务均不记录历史。

**改造内容**：
- `parse_novel_task` 执行开始时调用 `log_task_start`
- 成功路径调用 `log_task_complete`
- 异常路径调用 `log_task_failure`
- `render_video_task` 同理
- 所有定时任务（`sync_novel_parsing_status`、`generate_statistics_report`、`cleanup_old_logs`）同理

**涉及文件**：
- `ai-service/app/tasks/parse.py`
- `ai-service/app/tasks/render.py`
- `ai-service/app/tasks/scheduled.py`

**验证方式**：创建解析任务后，在 `/api/v1/tasks/history` 中可见。

---

### 第二阶段：可读标识符

**问题**：小说和项目仅有 UUID。用户无法区分。任务 ID 为 Celery UUID，无类型前缀。

**改造内容**：
- `novels` 表新增 `display_id` 字段：格式 `NOV-{yyMMdd}-{4位随机码}`，如 `NOV-280428-A3F2`
- `projects` 表新增 `display_id` 字段：格式 `PRJ-{yyMMdd}-{4位随机码}`，如 `PRJ-280428-B1D8`
- 任务 ID 保留 Celery UUID（不可变更），前端展示时附加类型标签前缀：`[解析]`、`[生成]`、`[渲染]`
- 后端通过 `@PrePersist` 自动生成 `display_id`
- 前端在列表和详情页同时展示 `display_id` 和 UUID

**涉及文件**：
- `backend/src/main/java/com/shortdrama/entity/Novel.java`
- `backend/src/main/java/com/shortdrama/entity/Project.java`
- `backend/src/main/resources/db/changelog/`（新增 Liquibase 迁移脚本）
- `frontend/src/types/index.ts`
- `frontend/src/pages/novel/NovelDetailPage.tsx`
- `frontend/src/pages/novel/NovelListPage.tsx`

---

### 第三阶段：任务列表重新设计

**问题**：任务列表展示原始 Celery UUID，无排序，筛选能力弱，列信息冗余。

**改造内容**：
- 重新设计列定义：

| 原列名 | 新列名 | 说明 |
|--------|--------|------|
| task_id (UUID) | 任务标识 | 类型标签 + UUID 前 8 位 |
| task_name | 任务类型 | 图标 + 中文标签 |
| （新增） | 关联对象 | 可点击的小说/项目 display_id |
| status | 状态 | 保持不变，增加进度指示 |
| started_at | 开始时间 | 可排序 |
| completed_at | 完成时间 | 可排序 |
| duration_ms | 耗时 | 格式化为 "1分23秒" |
| result/error | 失败原因 | 提取错误摘要，可展开 |
| （新增） | 操作 | 重试 / 取消按钮 |

- 新增排序：按开始时间（默认最新在前）、按耗时
- 新增筛选：按状态（运行中/成功/失败）、按日期范围
- 保留现有的任务类型筛选

**涉及文件**：
- `frontend/src/pages/task/TaskHistoryPage.tsx`（大幅改造）
- `ai-service/app/api/routes/tasks.py`（增加 sort_by、sort_order、status 查询参数）

---

### 第四阶段：按任务类型分类管理

**问题**：所有任务混在一个页面中。管理小说、剧本、视频的用户需要类型专属视图。

**改造内容**：
- 任务页面新增 Tab 导航：`全部 | 小说解析 | 剧本生成 | 视频渲染 | 系统任务`
- 每个 Tab 预筛选对应类型
- 不同类型展示专属列：
  - 解析任务：小说名称、提取章节数、总字数
  - 生成任务：剧本标题、场景数量
  - 渲染任务：分辨率、目标时长
- "关联对象"列可跳转至对应的小说/项目/剧集页面

**涉及文件**：
- `frontend/src/pages/task/TaskHistoryPage.tsx`（增加 Tab 切换）
- `ai-service/app/api/routes/tasks.py`（任务记录中附带关联对象信息）

---

### 第五阶段：任务结果富化

**问题**：任务历史只存储原始 args/kwargs，不包含关联的业务对象信息（小说名、剧集名），用户无法直观判断任务属于哪个资源。

**改造内容**：
- `log_task_start` 调用时附带 `context` 字典：`{novel_id, project_id, episode_id, display_name}`
- 后端 API 在返回历史记录时，根据 context 中的 ID 查询 display_id 和名称进行富化
- 前端渲染可点击的资源链接

**涉及文件**：
- `ai-service/app/core/task_logger.py`
- `ai-service/app/tasks/parse.py`
- `ai-service/app/tasks/generate.py`
- `ai-service/app/tasks/render.py`
- `ai-service/app/api/routes/tasks.py`

---

### 第六阶段：失败诊断与恢复

**问题**：任务失败时用户只能看到原始异常信息，无法理解原因，也没有重试或取消的手段。

**改造内容**：
- 错误信息分类映射：
  - `NoSuchKey` → "文件不存在，可能已被删除"
  - `codec can't decode` → "文件编码不支持，请上传 UTF-8 编码的文件"
  - `LLM`/`OpenAI`/`model` → "AI 服务异常，请稍后重试"
  - `timeout` → "任务执行超时"
  - `connection refused` → "服务连接失败，请检查服务状态"
- 失败任务增加"重试"按钮（调用 `POST /tasks/{id}/retry`）
- 运行中任务增加"取消"按钮（已有 `DELETE /tasks/{task_id}` 接口）
- 超过 1 小时仍处于"运行中"的任务自动清理

**涉及文件**：
- `ai-service/app/api/routes/tasks.py`（新增 retry 接口、错误分类逻辑）
- `frontend/src/pages/task/TaskHistoryPage.tsx`（增加操作按钮）

---

### 第七阶段：实时任务进度（推迟到 V4）

**推迟理由**：SSE 端点、Redis 发布订阅、前端进度条、每个任务函数的进度上报——投入产出比低。当前 NovelDetailPage 中的 3 秒轮询已提供基本的"是否完成"反馈。V4 再评估。

---

### 第八阶段：解析任务健壮性

**问题**：解析任务在文件缺失或编码异常时失败，且没有明确的错误信息。

**改造内容**：
- 在创建 Celery 任务之前，API 路由层先校验 MinIO 文件是否存在（快速失败）
- 编码回退链：`utf-8` → `gb2312` → `gbk` → `gb18030` → `latin-1`（最终兜底不会失败）
- 任务结果中记录检测到的编码格式
- 文件大小检查（超过 10MB 提示警告）
- 小说状态保护：若当前状态为 PARSING，拒绝重复解析（防止竞态条件）

**涉及文件**：
- `ai-service/app/api/routes/tasks.py`（前置校验）
- `ai-service/app/tasks/parse.py`（编码回退链）

---

## 实施顺序

| 阶段 | 优先级 | 工作量 | 依赖 |
|------|--------|--------|------|
| 1: TaskLogger 集成 | **P0** | 小 | — |
| 8: 解析健壮性 | **P0** | 小 | — |
| 2: 可读标识符 | **P1** | 中 | — |
| 3: 任务列表重设计 | **P1** | 中 | 1 |
| 6: 失败诊断与恢复 | **P2** | 小 | 1 |
| 4: 任务分类页面 | **P2** | 中 | 3 |
| 5: 任务结果富化 | **P2** | 小 | 1 |
| 7: 实时进度 | **推迟至 V4** | 大 | — |

## 成功标准

- [ ] 所有任务类型（解析、生成、渲染、定时）均出现在任务历史中
- [ ] 失败任务展示人类可读的错误原因
- [ ] 小说和项目具有可读的 `display_id` 标识
- [ ] 任务列表支持按时间排序、按状态/类型/日期筛选
- [ ] 每条任务记录可跳转至关联的小说/项目/剧集
- [ ] 失败任务可重试，卡住的任务可取消
- [ ] 解析任务优雅处理编码异常
