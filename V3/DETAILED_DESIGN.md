# V3 详细设计 — 任务系统增强

---

## 一、系统架构

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           用户浏览器 (Frontend)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │ NovelPage    │  │ ProjectPage  │  │ TaskHistoryPage (V3 重设计)   │  │
│  │ 上传小说      │  │ 创建项目      │  │ 全部│解析│生成│渲染│系统      │  │
│  │ 触发解析      │  │ 触发生成      │  │ 排序·筛选·重试·取消           │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────────┬────────────────┘  │
│         │                 │                        │                    │
│         └────────┬────────┴────────────────────────┘                    │
│                  │ HTTP REST                                              │
└──────────────────┼───────────────────────────────────────────────────────┘
                   │
┌──────────────────┼───────────────────────────────────────────────────────┐
│                  │              后端服务层 (Backend)                       │
│  ┌───────────────┴──────────────────────────────────────────────────┐   │
│  │                     Spring Boot REST API                          │   │
│  │  /api/novels  │  /api/projects  │  /api/episodes  │  /api/tasks   │   │
│  │  CRUD + 解析  │  CRUD + 聚合    │  CRUD + 状态     │  聚合查询     │   │
│  └───────────────┬──────────────────────────────────────────────────┘   │
│                  │                                                       │
│  ┌───────────────┴──────────┐    ┌──────────────────────────────┐      │
│  │      JPA 实体层           │    │      数据库 (MySQL)           │      │
│  │  Novel.displayId (V3新增) │◄──►│  novels.display_id (V3新增)  │      │
│  │  Project.displayId(V3新增)│    │  projects.display_id(V3新增)  │      │
│  │  Episode                  │    │  chapters / characters        │      │
│  └───────────────────────────┘    └──────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                   │
                   │ HTTP (内部服务调用)
                   │
┌──────────────────┼───────────────────────────────────────────────────────┐
│                  │              AI 服务层 (ai-service)                     │
│  ┌───────────────┴──────────────────────────────────────────────────┐   │
│  │                    FastAPI REST API                               │   │
│  │  POST /tasks/parse   │  POST /tasks/generate  │  POST /tasks/render │
│  │  GET  /tasks/history │  GET  /tasks/{id}      │  GET /tasks/stats   │
│  │  POST /tasks/{id}/retry (V3新增)              │  DELETE /tasks/{id} │
│  └───────────────┬──────────────────────────────────────────────────┘   │
│                  │                                                       │
│  ┌───────────────┴──────────────────────────────────────────────────┐   │
│  │                    Celery 任务队列                                 │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │   │
│  │  │ parse_novel_task│  │generate_script   │  │render_video    │  │   │
│  │  │ (max_retries=3) │  │_task(max_retries │  │_task(...)      │  │   │
│  │  │ countdown=60s   │  │=2, countdown=60s)│  │                │  │   │
│  │  └────────┬────────┘  └────────┬─────────┘  └───────┬────────┘  │   │
│  │           │                    │                     │           │   │
│  │           └────────────────────┼─────────────────────┘           │   │
│  │                                ▼                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │              TaskLogger (Redis, V3 增强)                  │    │   │
│  │  │  log_task_start(task_id, task_name, context)  ← 新增     │    │   │
│  │  │  log_task_complete(task_id, task_name, result, duration) │    │   │
│  │  │  log_task_failure(task_id, task_name, error, duration)   │    │   │
│  │  │  存储: Redis List (按 task_name 分组)                     │    │   │
│  │  │  运行中: Redis String (task:history:running:{task_id})   │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────┐    ┌──────────────────────────────────┐   │
│  │   外部服务              │    │   消息中间件                        │   │
│  │   LLM (OpenAI API)      │    │   RabbitMQ (Celery Broker)         │   │
│  │   MinIO (文件存储)       │    │   Redis (Celery Backend + Logger)  │   │
│  └──────────────────────────┘    └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 任务系统数据流

```
用户操作                前端                  AI 服务                    Celery Worker
───────                ────                  ────────                   ────────────
  │                     │                      │                          │
  │  点击"开始解析"      │                      │                          │
  │────────────────────►│                      │                          │
  │                     │  POST /tasks/parse   │                          │
  │                     │─────────────────────►│                          │
  │                     │                      │  1. 校验 MinIO 文件存在   │
  │                     │                      │  2. 校验小说状态          │
  │                     │                      │  3. parse_novel.delay()  │
  │                     │                      │─────────────────────────►│
  │                     │   202 { task_id }    │                          │
  │                     │◄─────────────────────│                          │
  │    "任务已创建"      │                      │                          │
  │◄────────────────────│                      │                          │
  │                     │                      │                          │
  │                     │  GET /tasks/{id}     │                          │
  │                     │  (轮询, 每3秒)        │                          │
  │                     │─────────────────────►│                          │
  │                     │                      │  AsyncResult(task_id)    │
  │                     │                      │─────────────────────────►│
  │                     │    { status }        │                          │
  │                     │◄─────────────────────│                          │
  │                     │                      │                          │
  │   "解析完成!"        │                      │                          │
  │◄────────────────────│                      │                          │
```

---

## 二、第一阶段：TaskLogger 全量集成

### 2.1 流程图

```
                    ┌──────────────┐
                    │  Celery 收到  │
                    │  任务消息     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ 获取 task_id  │
                    │ 获取 task_name│
                    │ 记录 start_time│
                    └──────┬───────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │ task_logger             │
              │ .log_task_start(        │
              │   task_id,              │
              │   task_name,            │
              │   context)    ← V3 新增  │
              │ Redis: running key 写入  │
              │ Redis: history list 追加 │
              └────────────┬────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ 执行业务逻辑  │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
        ┌──────────┐             ┌──────────┐
        │ 执行成功  │             │ 执行失败  │
        └────┬─────┘             └────┬─────┘
             │                        │
             ▼                        ▼
   ┌──────────────────┐    ┌──────────────────┐
   │ log_task_complete│    │ log_task_failure │
   │ (result, duration)│   │ (error, duration)│
   │ Redis: 更新记录   │    │ Redis: 更新记录   │
   │ Redis: 删除 running│   │ Redis: 删除 running│
   └──────────────────┘    └──────────────────┘
```

### 2.2 改造范围

| 任务函数 | 文件路径 | 当前状态 | 目标状态 |
|----------|----------|----------|----------|
| `parse_novel_task` | `ai-service/app/tasks/parse.py` | 无 logger 调用 | 全量接入 |
| `generate_script_task` | `ai-service/app/tasks/generate.py` | 已接入 | 增加 context 参数 |
| `render_video_task` | `ai-service/app/tasks/render.py` | 无 logger 调用 | 全量接入 |
| `sync_novel_parsing_status` | `ai-service/app/tasks/scheduled.py` | 无 logger 调用 | 全量接入 |
| `generate_statistics_report` | `ai-service/app/tasks/scheduled.py` | 无 logger 调用 | 全量接入 |
| `cleanup_old_logs` | `ai-service/app/tasks/scheduled.py` | 无 logger 调用 | 全量接入 |

### 2.3 任务拆解

| 子任务 | 描述 | 验收标准 |
|--------|------|----------|
| 1.1 | `parse.py` 引入 `task_logger`，在任务开始/成功/失败三处调用 | 解析任务出现在 `/tasks/history` 中 |
| 1.2 | `render.py` 引入 `task_logger`，在任务开始/成功/失败三处调用 | 渲染任务出现在 `/tasks/history` 中 |
| 1.3 | `scheduled.py` 所有定时任务接入 `task_logger` | 定时任务出现在 `/tasks/history` 中 |
| 1.4 | 验证：依次创建解析、生成、渲染任务，确认全部可见 | 所有类型任务均可追溯 |

---

## 三、第二阶段：可读标识符

### 3.1 标识符格式定义

```
小说标识符: NOV-{yyMMdd}-{4位随机大写字母数字}
示例:       NOV-280428-A3F2
              │    │      │
              │    │      └── 随机码 (碰撞概率 ~1/36⁴ ≈ 1/1,679,616)
              │    └── 创建日期 (年月日各两位)
              └── 类型前缀 (NOV=Novel, PRJ=Project)

项目标识符: PRJ-{yyMMdd}-{4位随机大写字母数字}
示例:       PRJ-280428-B1D8
```

### 3.2 数据库迁移时序

```
数据库当前状态                Liquibase 迁移                   迁移后状态
─────────────               ──────────────                  ──────────
novels 表                    changeSet:                      novels 表
├── id (UUID, PK)           add-display-ids                 ├── id (UUID, PK)
├── title                    ├── addColumn:                 ├── display_id (VARCHAR(20), UNIQUE)
├── author                     novels.display_id            ├── title
├── status                   ├── addUniqueConstraint        ├── author
├── ...                      ├── addColumn:                 ├── status
                               projects.display_id          ├── ...
projects 表                  └── addUniqueConstraint
├── id (UUID, PK)                                            projects 表
├── name                                                     ├── id (UUID, PK)
├── status                                                   ├── display_id (VARCHAR(20), UNIQUE)
├── ...                                                      ├── name
                                                             ├── status
                                                             ├── ...
```

### 3.3 任务拆解

| 子任务 | 描述 | 验收标准 |
|--------|------|----------|
| 2.1 | `Novel.java` 添加 `displayId` 字段和 `@PrePersist` 自动生成逻辑 | 新建小说自动获得 display_id |
| 2.2 | `Project.java` 添加 `displayId` 字段和 `@PrePersist` 自动生成逻辑 | 新建项目自动获得 display_id |
| 2.3 | 创建 Liquibase 迁移脚本，为已有数据回填 display_id | 历史数据不出现 NULL |
| 2.4 | `frontend/src/types/index.ts` 增加 `displayId` 字段 | TypeScript 类型检查通过 |
| 2.5 | 前端列表页和详情页展示 `displayId` | UI 可见可读标识 |
| 2.6 | 后端 API 返回 `displayId`（确保 Jackson 序列化） | API 响应包含 display_id |

---

## 四、第三阶段：任务列表重新设计

### 4.1 页面布局框架图

```
┌──────────────────────────────────────────────────────────────────┐
│  任务管理                                                         │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 统计卡片行                                                 │    │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │
│  │ │ 总任务数  │ │   成功   │ │   失败   │ │  运行中  │     │    │
│  │ │   142    │ │   98    │ │   31    │ │    3    │     │    │
│  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 运行中任务面板 (有运行中任务时显示)                           │    │
│  │ ● [解析] 解析小说 — NOV-280428-A3F2 — 开始于 14:30:22      │    │
│  │ ● [生成] 生成剧本 — PRJ-280428-B1D8 — 开始于 14:32:15      │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 筛选栏                                                     │    │
│  │ [全部任务 ▼] [全部状态 ▼] [日期范围选择器]  [刷新] [清除]  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 任务列表 (Ant Design Table)                                │    │
│  │ ┌────────┬────────┬──────────┬────┬──────────┬────┬────┐  │    │
│  │ │任务标识│任务类型│ 关联对象  │状态│ 开始时间  │耗时│操作│  │    │
│  │ ├────────┼────────┼──────────┼────┼──────────┼────┼────┤  │    │
│  │ │[解析]  │解析小说│NOV-..A3F2│成功│14:30:22  │12s │ -  │  │    │
│  │ │ab3f... │        │          │    │          │    │    │  │    │
│  │ ├────────┼────────┼──────────┼────┼──────────┼────┼────┤  │    │
│  │ │[生成]  │生成剧本│PRJ-..B1D8│失败│14:28:10  │45s │重试│  │    │
│  │ │c8d2... │        │          │    │          │    │    │  │    │
│  │ └────────┴────────┴──────────┴────┴──────────┴────┴────┘  │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 列定义详细说明

| 列名 | 数据来源 | 渲染方式 | 功能 |
|------|----------|----------|------|
| 任务标识 | `task_id` + `task_name` | 类型前缀标签 + UUID 前 8 位 | 快速区分任务类型 |
| 任务类型 | `task_name` | 图标 + 中文映射 | — |
| 关联对象 | `context.display_name` | 可点击链接 | 跳转至小说/项目详情 |
| 状态 | `status` | 彩色标签 (运行中/成功/失败) | 支持筛选 |
| 开始时间 | `started_at` | `toLocaleString()` | 支持排序，默认降序 |
| 耗时 | `duration_ms` | `1m 23s` 格式 | 支持排序 |
| 失败原因 | `error` | 错误分类后的中文描述，可展开 | 快速定位问题 |
| 操作 | — | 重试/取消按钮 | 失败→重试，运行中→取消 |

### 4.3 交互时序图 — 任务列表加载

```
前端 TaskHistoryPage     AI 服务 API            Redis              Backend API
───────────────         ────────────           ─────              ───────────
      │                      │                   │                    │
      │  GET /tasks/history  │                   │                    │
      │  ?sort_by=started_at │                   │                    │
      │  &sort_order=desc    │                   │                    │
      │  &status=failure     │                   │                    │
      │  &task_name=parse    │                   │                    │
      │─────────────────────►│                   │                    │
      │                      │  LRANGE            │                    │
      │                      │  task:history:     │                    │
      │                      │  parse_novel       │                    │
      │                      │───────────────────►│                    │
      │                      │  [record1, ...]    │                    │
      │                      │◄───────────────────│                    │
      │                      │                    │                    │
      │                      │  对每条记录:         │                    │
      │                      │  检查 context       │                    │
      │                      │───────────────────────────────────────►│
      │                      │  GET /api/novels/{novel_id}             │
      │                      │◄────────────────────────────────────────│
      │                      │  { displayId, title }                   │
      │                      │                    │                    │
      │                      │  富化后的历史记录列表  │                    │
      │◄─────────────────────│                    │                    │
      │                      │                    │                    │
      │  渲染列表             │                    │                    │
      │                      │                    │                    │
      │  GET /tasks/running  │                    │                    │
      │─────────────────────►│                    │                    │
      │                      │  SCAN              │                    │
      │                      │  task:history:     │                    │
      │                      │  running:*         │                    │
      │                      │───────────────────►│                    │
      │                      │  [running tasks]   │                    │
      │◄─────────────────────│                    │                    │
```

### 4.4 任务拆解

| 子任务 | 描述 | 验收标准 |
|--------|------|----------|
| 3.1 | `TaskHistoryPage.tsx` 列重设计：新列定义、类型前缀标签、中文映射 | 表格列符合设计文档 |
| 3.2 | 增加排序功能：按 `started_at` 和 `duration_ms` 排序，后端支持 `sort_by`/`sort_order` 参数 | 点击列头可排序 |
| 3.3 | 增加状态筛选：前端 `onFilter` + 后端 `status` 查询参数 | 可按成功/失败/运行中筛选 |
| 3.4 | 耗时格式化：`formatDuration()` 工具函数 | 显示为 "1m 23s" 格式 |
| 3.5 | 增加日期范围筛选 | 可按日期范围过滤 |
| 3.6 | 统计卡片布局优化，运行中任务面板优化 | 信息层级清晰 |

---

## 五、第四阶段：任务类型分类页面

### 5.1 Tab 导航交互图

```
┌─────────────────────────────────────────────────────────────┐
│  Tab 导航栏                                                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ 全部任务  │ 小说解析  │ 剧本生成  │ 视频渲染  │ 系统任务  │  │
│  │  (142)   │  (45)    │  (52)    │  (30)    │  (15)    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                               │
│  当前选中: "小说解析" → 自动设置 query: ?task_name=parse_novel │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  全部任务 Tab:     通用列（同 4.2 列定义）                      │
│                                                               │
│  小说解析 Tab:     通用列 + 专属列                              │
│                    ├── 小说名称 (关联对象, 跳转至小说详情)        │
│                    ├── 提取章节数 (result.total_chapters)       │
│                    └── 总字数 (result.total_word_count)         │
│                                                               │
│  剧本生成 Tab:     通用列 + 专属列                              │
│                    ├── 剧本标题 (result.title)                  │
│                    └── 场景数 (result.scenes.length)           │
│                                                               │
│  视频渲染 Tab:     通用列 + 专属列                              │
│                    ├── 分辨率 (kwargs 中提取)                   │
│                    └── 目标时长 (kwargs 中提取)                  │
│                                                               │
│  系统任务 Tab:     通用列                                       │
│                    ├── 任务名称                                 │
│                    └── 执行结果                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 任务拆解

| 子任务 | 描述 | 验收标准 |
|--------|------|----------|
| 4.1 | `TaskHistoryPage` 增加 Ant Design `<Tabs>` 组件 | Tab 切换正常 |
| 4.2 | 每个 Tab 绑定 `task_name` 查询参数自动筛选 | 切换 Tab 后数据正确 |
| 4.3 | 解析类型专属列定义和渲染 | 显示章节数、字数 |
| 4.4 | 生成类型专属列定义和渲染 | 显示剧本标题、场景数 |
| 4.5 | 渲染类型专属列定义和渲染 | 显示分辨率、目标时长 |
| 4.6 | 系统任务类型的标签映射扩展 | 定时任务名称正确中文化 |

---

## 六、第五阶段：任务结果富化

### 6.1 数据流图 — Context 富化

```
任务执行时                                API 查询时
─────────                               ─────────
parse_novel_task                        GET /tasks/history
  │                                       │
  │ log_task_start(                       │ task_logger.get_task_history()
  │   task_id,                            │   → 返回 Redis 中的原始记录
  │   task_name="parse_novel",            │
  │   context={                           │ 遍历每条记录:
  │     novel_id: "abc123...",            │   是否有 context.novel_id?
  │     display_name: "Novel abc123"      │     ├── 是 → 调用 Backend API
  │   }                                   │     │         GET /api/novels/{id}
  │ )                                     │     │         获取 displayId 和 title
  │                                       │     │         填充 context.display_name
  │                                       │     └── 否 → 跳过
  │                                       │
  ▼                                       ▼
Redis 存储:                              API 响应:
{                                        [
  "task_id": "...",                        {
  "task_name": "parse_novel",                "task_id": "...",
  "context": {                               "task_name": "parse_novel",
    "novel_id": "abc123...",                 "context": {
    "display_name": "Novel abc123"             "novel_id": "abc123...",
  },                                           "display_name": "NOV-280428-A3F2 — 斗破苍穹"
  ...                                        },
}                                            ...
                                          ]
```

### 6.2 任务拆解

| 子任务 | 描述 | 验收标准 |
|--------|------|----------|
| 5.1 | `task_logger.log_task_start` 签名增加 `context` 可选参数 | 向后兼容，不传 context 也能正常记录 |
| 5.2 | 所有任务调用方传入 `context`（novel_id 必传，project_id/episode_id 可选） | 解析任务带 novel_id，生成任务带全部 ID |
| 5.3 | API 路由层富化逻辑：根据 context 中的 ID 查询 display_id | 返回历史记录时 display_name 已填充 |
| 5.4 | 前端 `关联对象` 列渲染为可点击链接 | 点击跳转至正确的小说/项目详情页 |

---

## 七、第六阶段：失败诊断与恢复

### 7.1 错误分类流程图

```
┌─────────────────────────┐
│ 任务执行异常             │
│ (Python Exception)      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ log_task_failure(       │
│   task_id, task_name,   │
│   str(exc), duration)   │
│ 存储到 Redis             │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ 前端获取历史记录          │
│ 调用 classifyError()    │
└────────────┬────────────┘
             │
             ▼
    ┌────────┴────────────────────────────────────────────┐
    │                                                      │
    ▼                    ▼                    ▼            ▼
┌────────────┐    ┌────────────┐    ┌────────────┐   ┌────────────┐
│ NoSuchKey  │    │ codec      │    │ LLM/OpenAI │   │ 其他       │
│ 或 does not│    │ can't      │    │ /model     │   │            │
│ exist      │    │ decode     │    │            │   │            │
└─────┬──────┘    └─────┬──────┘    └─────┬──────┘   └─────┬──────┘
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
┌────────────┐    ┌────────────┐    ┌────────────┐   ┌────────────┐
│ 文件不存在  │    │ 编码不支持  │    │ AI 服务异常 │   │ 原始错误信息 │
│ 可能已被删除│    │ 请上传 UTF-8│    │ 请稍后重试  │   │ (不做映射)  │
└────────────┘    └────────────┘    └────────────┘   └────────────┘
```

### 7.2 重试交互时序图

```
用户                 前端                    AI 服务 API              Celery
────                ────                    ────────────             ──────
 │                    │                          │                     │
 │  点击"重试"         │                          │                     │
 │───────────────────►│                          │                     │
 │                    │  POST /tasks/{id}/retry  │                     │
 │                    │─────────────────────────►│                     │
 │                    │                          │ 1. 查询历史记录       │
 │                    │                          │    (获取原始参数)     │
 │                    │                          │                     │
 │                    │                          │ 2. 重新 dispatch     │
 │                    │                          │    parse_novel_task  │
 │                    │                          │    .delay(args...)   │
 │                    │                          │────────────────────►│
 │                    │                          │                     │
 │                    │  200 { new_task_id }     │                     │
 │                    │◄─────────────────────────│                     │
 │                    │                          │                     │
 │   "任务已重新排队"   │                          │                     │
 │◄───────────────────│                          │                     │
 │                    │  刷新任务列表              │                     │
 │                    │─────────────────────────►│                     │
```

### 7.3 任务拆解

| 子任务 | 描述 | 验收标准 |
|--------|------|----------|
| 6.1 | `routes/tasks.py` 新增 `POST /tasks/{id}/retry` 接口 | 失败任务可重新入队 |
| 6.2 | `classifyError()` 函数实现错误分类逻辑 | 常见错误映射为中文提示 |
| 6.3 | 前端"重试"按钮（仅失败状态显示） | 点击后触发重试，提示成功 |
| 6.4 | 前端"取消"按钮（仅运行中状态显示），复用已有 `DELETE /tasks/{id}` | 点击后终止任务 |
| 6.5 | 自动清理：超过 1 小时仍为 "running" 状态的任务标记为失败 | 不残留僵尸任务 |

---

## 八、第七阶段：实时任务进度

**本阶段推迟至 V4。** 以下设计保留供后续参考。

### 8.1 进度上报流程（V4 预留设计）

```
Celery Worker                         Redis                       前端
────────────                         ─────                       ────
     │                                  │                          │
     │ log_progress(30%, "调用 LLM")     │                          │
     │─────────────────────────────────►│                          │
     │                                  │ PUBLISH task:progress    │
     │                                  │ :{id} {percent:30,msg}  │
     │                                  │                          │
     │                                  │         SSE stream       │
     │                                  │─────────────────────────►│
     │                                  │                          │
     │                                  │      ┌──────────────┐    │
     │                                  │      │ ██████░░░░░░ │    │
     │                                  │      │   30% 调用LLM │    │
     │                                  │      └──────────────┘    │
```

### 8.2 进度节点定义（V4 预留）

| 任务类型 | 进度节点 | 说明 |
|----------|----------|------|
| 解析任务 | 10% 下载文件 | 从 MinIO 获取文件 |
| | 30% 检测编码 | 识别文件编码格式 |
| | 50% 解析章节 | 提取章节内容 |
| | 70% LLM 增强 | 生成章节摘要和角色提取 |
| | 90% 保存结果 | 写入 Backend |
| 生成任务 | 10% 获取章节 | 从 Backend 获取章节内容 |
| | 30% 获取角色 | 从 Backend 获取角色信息 |
| | 50% 调用 LLM | 生成剧本 JSON |
| | 80% 解析校验 | 验证剧本结构 |
| | 90% 保存剧本 | 写入 Backend |
| 渲染任务 | ... | 视具体实现而定 |

---

## 九、第八阶段：解析任务健壮性

### 9.1 前置校验时序图

```
前端                  AI 服务 API              MinIO              Backend
────                 ────────────             ─────              ───────
 │                        │                     │                   │
 │  POST /tasks/parse     │                     │                   │
 │  {novel_id, path}      │                     │                   │
 │───────────────────────►│                     │                   │
 │                        │                     │                   │
 │                        │ 1. 检查文件存在       │                   │
 │                        │────────────────────►│                   │
 │                        │  file_exists(path)  │                   │
 │                        │◄────────────────────│                   │
 │                        │  True / False       │                   │
 │                        │                     │                   │
 │                        │ 若 False → 404       │                   │
 │                        │ "文件不存在"          │                   │
 │                        │                     │                   │
 │                        │ 2. 检查小说状态       │                   │
 │                        │──────────────────────────────────────►│
 │                        │ GET /api/novels/{id}                   │
 │                        │◄──────────────────────────────────────│
 │                        │ {status: "PARSING"}                    │
 │                        │                     │                   │
 │                        │ 若 status=PARSING → 409                │
 │                        │ "该小说正在解析中"    │                   │
 │                        │                     │                   │
 │                        │ 3. 创建 Celery 任务   │                   │
 │                        │ parse_novel.delay()  │                   │
 │                        │                     │                   │
 │  202 {task_id}         │                     │                   │
 │◄───────────────────────│                     │                   │
```

### 9.2 编码回退链

```
┌──────────────────┐
│ 下载文件原始字节   │
│ (MinIO → bytes)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ chardet.detect() │
│ 检测编码          │
└────────┬─────────┘
         │
         ▼
   编码回退链（按顺序尝试）:
   ┌──────────────────────────────────────────┐
   │ 1. chardet 检测到的编码                    │
   │ 2. utf-8                                  │
   │ 3. gb2312  ← 中文小说常用编码              │
   │ 4. gbk     ← 中文小说扩展编码              │
   │ 5. gb18030 ← 最新中文国标编码              │
   │ 6. latin-1 ← 最终兜底(不会失败,逐个解码256个值)│
   └──────────────────────────────────────────┘
         │
         ▼
    ┌──────────┐     ┌────────────────┐
    │ 解码成功? │─是─►│ 记录编码到 result │
    └────┬─────┘     └────────────────┘
         │否
         ▼
    ┌──────────┐
    │ 尝试下一个 │
    │ 编码格式  │
    └──────────┘
```

### 9.3 任务拆解

| 子任务 | 描述 | 验收标准 |
|--------|------|----------|
| 8.1 | `routes/tasks.py` `create_parse_task` 增加 MinIO 文件存在性校验 | 文件不存在时返回 404，不创建任务 |
| 8.2 | `routes/tasks.py` `create_parse_task` 增加小说状态校验 | 正在解析时返回 409 |
| 8.3 | `parse.py` 编码检测改为回退链模式 | gb2312/gbk 编码的中文小说正常解析 |
| 8.4 | 解析结果中记录使用的编码格式 | task result 含 `encoding_used` 字段 |
| 8.5 | 文件大小检查：超过 10MB 记录 warning 日志 | 大文件解析不阻塞，但给出提示 |

---

## 十、API 接口定义

### 10.1 新增/修改的接口

#### GET `/tasks/history`（参数扩展）

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `task_name` | string | 否 | — | 任务类型筛选 |
| `limit` | int | 否 | 50 | 返回条数 |
| `offset` | int | 否 | 0 | 偏移量 |
| `sort_by` | string | 否 | started_at | 排序字段：started_at, duration_ms, status |
| `sort_order` | string | 否 | desc | 排序方向：asc, desc |
| `status` | string | 否 | — | 状态筛选：running, success, failure |

#### POST `/tasks/{task_id}/retry`（新增）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `task_id` | path | 是 | 失败任务的 Celery UUID |

响应：

| 字段 | 类型 | 说明 |
|------|------|------|
| `task_id` | string | 新创建的 Celery 任务 UUID |
| `message` | string | "Task re-queued" |

#### GET `/tasks/{task_id}/progress/stream`（新增，V4 预留）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `task_id` | path | 是 | 任务 UUID |

响应：SSE 流，每行格式 `data: {"percent": 30, "message": "调用 LLM 中"}`

### 10.2 响应结构变更

#### TaskHistoryItem（字段新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| `context` | object | 新增，关联对象信息 |
| `context.novel_id` | string | 关联的小说 UUID |
| `context.project_id` | string | 关联的项目 UUID |
| `context.episode_id` | string | 关联的剧集 UUID |
| `context.display_name` | string | 可读名称（API 层富化填充） |

---

## 十一、数据库变更

### 11.1 Liquibase Change Log

文件名：`backend/src/main/resources/db/changelog/v3-add-display-ids.xml`

```xml
<databaseChangeLog>
    <changeSet id="v3-add-display-ids" author="v3">
        <!-- novels 表增加 display_id -->
        <addColumn tableName="novels">
            <column name="display_id" type="varchar(20)">
                <constraints unique="true" />
            </column>
        </addColumn>

        <!-- projects 表增加 display_id -->
        <addColumn tableName="projects">
            <column name="display_id" type="varchar(20)">
                <constraints unique="true" />
            </column>
        </addColumn>
    </changeSet>

    <!-- 为已有数据回填 display_id -->
    <changeSet id="v3-backfill-display-ids" author="v3">
        <sql>
            UPDATE novels SET display_id = CONCAT('NOV-', DATE_FORMAT(created_at, '%y%m%d'), '-', UPPER(SUBSTRING(MD5(RAND()), 1, 4)))
            WHERE display_id IS NULL;

            UPDATE projects SET display_id = CONCAT('PRJ-', DATE_FORMAT(created_at, '%y%m%d'), '-', UPPER(SUBSTRING(MD5(RAND()), 1, 4)))
            WHERE display_id IS NULL;
        </sql>
    </changeSet>
</databaseChangeLog>
```

### 11.2 数据库主文件引用

在 `backend/src/main/resources/db/changelog/db.changelog-master.xml` 中增加：

```xml
<include file="db/changelog/v3-add-display-ids.xml" />
```

---

## 十二、部署与配置

### 12.1 重新构建并部署

```bash
# 1. 拉取基础镜像（使用 DaoCloud 镜像加速）
docker pull docker.m.daocloud.io/library/python:3.11-slim
docker tag docker.m.daocloud.io/library/python:3.11-slim python:3.11-slim

docker pull docker.m.daocloud.io/library/openjdk:17-slim
docker tag docker.m.daocloud.io/library/openjdk:17-slim openjdk:17-slim

# 2. 重新构建所有服务
cd /Users/hujiayi/Documents/short-drama-generator
docker compose build

# 3. 启动全部服务
docker compose up -d

# 4. 等待服务就绪后，执行 Liquibase 迁移
docker compose exec backend ./mvnw liquibase:update

# 5. 验证
curl http://localhost:3000/api/v1/tasks/history
```

### 12.2 环境变量（无新增，仅确认现有配置）

```bash
# ai-service .env
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=pyamqp://guest:guest@rabbitmq:5672//
CELERY_RESULT_BACKEND=redis://redis:6379/1
MINIO_ENDPOINT=minio:9000
BACKEND_API_URL=http://backend:8080/api
```

### 12.3 Liquibase Checksum 处理

如果迁移时遇到 checksum 不匹配：

```bash
# 临时清理 checksum（仅测试环境）
docker compose exec backend ./mvnw liquibase:clearCheckSums
# 然后重新运行迁移
docker compose exec backend ./mvnw liquibase:update
```

---

## 十三、全部任务汇总

| 子任务编号 | 阶段 | 描述 | 优先级 |
|-----------|------|------|--------|
| 1.1–1.4 | 第一阶段 | TaskLogger 全量接入 parse/render/scheduled | P0 |
| 8.1–8.5 | 第八阶段 | 解析任务健壮性：文件校验、编码回退、状态保护 | P0 |
| 2.1–2.6 | 第二阶段 | 可读标识符：Novel/Project display_id + 前端展示 | P1 |
| 3.1–3.6 | 第三阶段 | 任务列表重设计：列定义、排序、筛选、格式化 | P1 |
| 6.1–6.5 | 第六阶段 | 失败诊断：错误分类、重试接口、取消任务、自动清理 | P2 |
| 4.1–4.6 | 第四阶段 | 任务分类页面：Tab 导航、类型专属列 | P2 |
| 5.1–5.4 | 第五阶段 | 任务结果富化：context 参数、API 富化、前端链接 | P2 |
