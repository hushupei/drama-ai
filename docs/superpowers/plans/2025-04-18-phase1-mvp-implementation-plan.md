# Phase 1 MVP 实施计划

**对应设计文档**: `docs/superpowers/specs/2025-04-18-short-drama-generator-design.md`  
**版本**: v1.2  
**日期**: 2025-04-18  
**作者**: Claude + hujiayi  
**状态**: 待审核

---

## 重要说明

**部署环境**: 本地 Mac mini 4  
**部署方式**: 所有组件（前端、后端、数据库、Redis、MinIO、RabbitMQ）均在 Mac mini 4 本地安装运行，不依赖 Docker 或云服务。

---

## 执行摘要

本计划实现小说转短剧平台的 **Phase 1 MVP** 功能，包括：
- 基础架构搭建（Java + Python）
- 小说上传与章节解析
- 单集剧本生成
- 基础角色生成
- 简单视频合成（图文+配音）

**预计工期**: 10 周  
**关键里程碑**: 
- Week 2: 基础架构完成
- Week 5: 后端核心 API 完成
- Week 8: AI 服务完成
- Week 10: 前端集成测试通过

---

## 全局质量标准（所有任务必须遵守）

### 代码质量
- [ ] **单测覆盖率 ≥ 70%**（JaCoCo/pytest-cov 报告）
- [ ] **代码审查**: 每个任务完成后必须经过 code-reviewer 审查
- [ ] **静态分析**: Java (SpotBugs)、Python (pylint)、TypeScript (ESLint) 无严重警告
- [ ] **圈复杂度**: 单方法不超过 10
- [ ] **文件大小**: 单文件不超过 500 行

### 文档要求
- [ ] **API 文档**: OpenAPI/Swagger 注解完整，包含参数说明、响应示例
- [ ] **接口调用示例**: 每个 API 提供完整 curl 命令
- [ ] **数据结构验证**: curl 返回与文档定义的 JSON Schema 一致
- [ ] **README**: 每个模块包含安装、配置、运行说明

### 前端标准
- [ ] **交互可用性**: 所有按钮、表单、弹窗可正常操作
- [ ] **响应式设计**: 支持 1280x720 至 4K 分辨率
- [ ] **错误处理**: API 错误有用户友好的提示
- [ ] **加载状态**: 异步操作显示加载指示器
- [ ] **浏览器兼容**: Safari、Chrome、Firefox 最新两版本

### 安全要求
- [ ] **输入验证**: 所有用户输入服务端验证
- [ ] **SQL 注入防护**: 使用参数化查询
- [ ] **XSS 防护**: 输出转义
- [ ] **CSRF 防护**: Token 验证
- [ ] **敏感信息**: 密码加密存储，密钥环境变量配置

### 性能要求
- [ ] **API 响应**: P95 < 500ms（不含文件上传）
- [ ] **并发**: 支持 5 个并发用户
- [ ] **内存**: Java 后端堆内存 ≤ 4GB，Python 服务 ≤ 2GB

---

## 任务清单

- [ ] **Task 1**: 项目初始化与环境搭建
- [ ] **Task 2**: 数据库实体与 Repository 层
- [ ] **Task 3**: Service 层与业务逻辑
- [ ] **Task 4**: REST API 控制器层
- [ ] **Task 5**: Python AI 服务基础架构
- [ ] **Task 6**: 小说解析服务实现
- [ ] **Task 7**: 前端基础架构
- [ ] **Task 8**: 前端页面开发
- [ ] **Task 9**: 集成测试与联调

---

## Task 1: 项目初始化与环境搭建

**预计耗时**: 5 天  
**依赖**: 无  

### 目标
搭建可运行的开发环境，包括 Java 后端、Python AI 服务、React 前端的项目骨架。

### 交付物

1. **Java Spring Boot 项目**
   - Maven pom.xml（Spring Boot 3.2、PostgreSQL、MinIO、JWT、OpenAPI 依赖）
   - application.yml（多环境配置：dev/test/prod）
   - 启动类
   - 日志配置

2. **Python AI 服务项目**
   - requirements.txt（FastAPI、Celery、spaCy、OpenAI、pydantic 等）
   - main.py（FastAPI 入口）
   - 配置文件（pydantic-settings）
   - 日志配置（loguru）

3. **React 前端项目**
   - package.json（React 18、TypeScript、Vite、Ant Design、Zustand）
   - vite.config.ts（开发服务器代理配置）
   - tsconfig.json（严格模式）
   - ESLint + Prettier 配置

4. **本地服务安装文档**
   - PostgreSQL 15 本地安装步骤
   - Redis 7 本地安装步骤
   - MinIO 本地二进制部署步骤
   - RabbitMQ 本地安装步骤

### 验证标准

#### 基础验证
- [ ] `mvn clean compile` 成功，无错误
- [ ] `mvn test` 成功，基础测试通过
- [ ] `python -c "import app"` 成功
- [ ] `pytest` 成功（至少一个占位测试）
- [ ] `npm install` 成功
- [ ] `npm run build` 成功
- [ ] `npm run lint` 无错误

#### 服务连接验证
- [ ] PostgreSQL: `psql -h localhost -U postgres -c "SELECT 1"` 成功
- [ ] Redis: `redis-cli ping` 返回 PONG
- [ ] MinIO: `curl http://localhost:9000/minio/health/live` 返回 200
- [ ] RabbitMQ: `curl http://localhost:15672/api/overview` 返回 JSON

#### 文档验证
- [ ] README.md 包含项目介绍、目录结构、开发环境搭建步骤
- [ ] 每个模块的子 README 包含该模块的详细说明

---

## Task 2: 数据库实体与 Repository 层

**预计耗时**: 7 天  
**依赖**: Task 1 完成  

### 目标
设计并实现数据库实体和访问层。

### 交付物

1. **数据库实体类（6 个）**
   - `User` - 用户表（含角色、状态枚举）
   - `Novel` - 小说表（含状态枚举、JSONB 元数据）
   - `Chapter` - 章节表
   - `Character` - 角色表（含外观、声音配置 JSONB）
   - `Project` - 项目表（含配置 JSONB）
   - `Episode` - 剧集表（含剧本内容 JSONB）

2. **Repository 接口（6 个）**
   - 每个实体对应的 JPA Repository
   - 自定义查询方法（如按用户查小说、按项目查剧集等）
   - @Query 注解的复杂查询

3. **数据库迁移脚本**
   - Liquibase 变更日志（XML 格式）
   - 包含所有表的创建、索引、外键约束
   - 包含适当的字段注释

4. **单元测试**
   - Repository 层测试（使用 @DataJpaTest）
   - 测试容器配置（Testcontainers PostgreSQL）

### 验证标准

#### 代码质量
- [ ] `mvn jacoco:report` 显示本模块覆盖率 ≥ 70%
- [ ] `mvn spotbugs:check` 无严重警告
- [ ] SonarLint 无 blocker/critical 问题

#### 功能验证
- [ ] `mvn liquibase:validate` 通过
- [ ] `mvn liquibase:update` 成功创建所有表
- [ ] 所有实体类可编译，无警告
- [ ] Repository 接口可启动，Spring Context 加载成功

#### 数据库验证
- [ ] 执行 `psql -U postgres -d shortdrama -c "\dt"` 显示所有 6 张表
- [ ] 每张表的字段、类型、约束符合设计
- [ ] 索引正确创建（`\di` 命令验证）

#### 单测验证
```bash
cd backend
mvn test -Dtest=*RepositoryTest
# 预期: Tests run: X, Failures: 0, Errors: 0
# 预期: 覆盖率报告 > 70%
```

---

## Task 3: Service 层与业务逻辑

**预计耗时**: 10 天  
**依赖**: Task 2 完成  

### 目标
实现核心业务逻辑和数据处理。

### 交付物

1. **DTO 类（20+ 个）**
   - 请求 DTO（含 @Valid 验证注解）
   - 响应 DTO
   - 内部传输 DTO

2. **异常体系**
   - BusinessException（业务异常基类）
   - NotFoundException、ValidationException 等具体异常
   - GlobalExceptionHandler（统一异常处理）
   - 统一 API 响应格式（ApiResponse<T>）

3. **存储服务**
   - StorageService 接口
   - MinioStorageService 实现
   - 文件上传/下载/删除/预签名 URL

4. **业务 Service（6 个）**
   - UserService（用户注册、查询）
   - NovelService（小说上传、解析触发、查询、删除）
   - ChapterService（章节查询、更新）
   - CharacterService（角色 CRUD、形象生成触发）
   - ProjectService（项目 CRUD、状态流转）
   - EpisodeService（剧集生成、状态查询）

5. **单元测试**
   - Service 层单元测试（使用 @ExtendWith(MockitoExtension.class)）
   - Mock 外部依赖（Repository、StorageService）

### 验证标准

#### 代码质量
- [ ] `mvn jacoco:report` 显示本模块覆盖率 ≥ 70%
- [ ] Service 层单元测试覆盖率 ≥ 80%
- [ ] 所有 public 方法有对应的单元测试
- [ ] 异常分支测试覆盖

#### API 文档
- [ ] Swagger UI 可访问（http://localhost:8080/swagger-ui.html）
- [ ] 所有 DTO 字段有 @Schema 注解说明
- [ ] 所有 Controller 方法有 @Operation 注解说明

#### 功能验证
```bash
# 1. 启动后端
./mvnw spring-boot:run

# 2. 验证 Swagger
curl -s http://localhost:8080/v3/api-docs | jq .info.title
# 预期: "Short Drama Generator"

# 3. 验证健康检查
curl -s http://localhost:8080/actuator/health | jq .status
# 预期: "UP"
```

#### 单测验证
```bash
cd backend
mvn test -Dtest=*ServiceTest
# 预期: Tests run: X, Failures: 0, Errors: 0
# 预期: JaCoCo 报告 > 70%
```

---

## Task 4: REST API 控制器层

**预计耗时**: 10 天  
**依赖**: Task 3 完成  

### 目标
实现 RESTful API 端点和安全认证。

### 交付物

1. **安全组件**
   - JwtUtil（JWT 生成、验证、解析）
   - JwtAuthenticationFilter（认证过滤器）
   - SecurityConfig（Spring Security 配置）
   - BCryptPasswordEncoder（密码加密）

2. **认证控制器**
   - POST /api/v1/auth/register - 用户注册
   - POST /api/v1/auth/login - 用户登录
   - POST /api/v1/auth/refresh - Token 刷新

3. **业务控制器（6 个）**
   - NovelController（小说上传、查询、删除、解析触发）
   - ChapterController（章节列表、详情）
   - CharacterController（角色 CRUD、形象生成）
   - ProjectController（项目 CRUD、状态管理）
   - EpisodeController（剧集生成、状态查询、视频下载）

4. **接口测试文档**
   - 每个 API 的 curl 命令
   - 请求/响应示例
   - 错误码说明

### 验证标准

#### 代码质量
- [ ] `mvn jacoco:report` 显示本模块覆盖率 ≥ 70%
- [ ] Controller 层单元测试（使用 @WebMvcTest）

#### API 文档完整性
- [ ] 所有端点有完整的 Swagger 注解
- [ ] 包含参数说明、响应码、响应示例

#### 接口测试（逐个验证）

**认证接口**:
```bash
# 1. 注册
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!","displayName":"Test User"}'
# 预期: 200 OK, {"success":true,"data":{"token":"...","userId":"..."}}

# 2. 登录
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!"}'
# 预期: 200 OK, {"success":true,"data":{"token":"..."}}

# 3. 验证错误响应
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"wrong"}'
# 预期: 400 Bad Request, {"success":false,"errorCode":"INVALID_CREDENTIALS"}
```

**小说接口**:
```bash
# 1. 上传小说（需要 token）
curl -X POST http://localhost:8080/api/v1/novels \
  -H "Authorization: Bearer $TOKEN" \
  -F "title=Test Novel" \
  -F "description=A test novel" \
  -F "file=@/path/to/test.txt"
# 预期: 200 OK, {"success":true,"data":{"id":"...","title":"Test Novel"}}

# 2. 查询小说列表
curl http://localhost:8080/api/v1/novels \
  -H "Authorization: Bearer $TOKEN"
# 预期: 200 OK, {"success":true,"data":{"content":[...]}}

# 3. 获取小说详情
curl http://localhost:8080/api/v1/novels/{novelId} \
  -H "Authorization: Bearer $TOKEN"
# 预期: 200 OK, 返回小说完整信息
```

#### 数据结构验证
- [ ] 所有响应符合定义的 JSON Schema
- [ ] 错误响应包含 errorCode 和 message
- [ ] 分页响应包含 page、size、total、content

#### 安全验证
- [ ] 未携带 Token 的请求返回 401
- [ ] 携带无效 Token 的请求返回 401
- [ ] 密码不以明文存储（数据库验证）

---

## Task 5: Python AI 服务基础架构

**预计耗时**: 7 天  
**依赖**: Task 1 完成  

### 目标
搭建 Python AI 服务的基础框架。

### 交付物

1. **FastAPI 应用结构**
   - 路由模块化组织（novel、character、script、generation、health）
   - 健康检查端点
   - CORS 配置
   - 依赖注入

2. **Celery 任务队列**
   - Celery 配置（使用本地 Redis）
   - 任务定义基类
   - 任务状态追踪（PENDING、PROGRESS、SUCCESS、FAILURE）
   - 任务结果存储

3. **存储服务**
   - MinIO Python 客户端封装
   - 文件读写接口
   - 预签名 URL 生成

4. **日志配置**
   - Loguru 配置
   - 文件轮转（10MB）和保留（7 天）
   - 结构化日志

5. **单元测试**
   - pytest 配置
   - 基础测试用例

### 验证标准

#### 代码质量
- [ ] `pytest --cov=app --cov-report=term-missing` 显示覆盖率 ≥ 70%
- [ ] `pylint app/` 评分 ≥ 8.0
- [ ] `mypy app/` 无严重类型错误

#### 功能验证
```bash
cd ai-service

# 1. 启动服务
python -m uvicorn main:app --reload

# 2. 健康检查
curl -s http://localhost:8000/health | jq .
# 预期: {"status":"healthy","service":"ai-service"}

# 3. 验证 API 文档
curl -s http://localhost:8000/openapi.json | jq .info.title
# 预期: "Short Drama AI Service"
```

#### Celery 验证
```bash
# 1. 启动 worker
celery -A app.core.celery worker --loglevel=info

# 2. 测试任务（在 Python 中）
python -c "
from app.core.celery import celery_app
result = celery_app.send_task('app.tasks.test_task')
print(f'Task ID: {result.id}')
"
```

#### MinIO 验证
```bash
python -c "
from app.services.storage_service import StorageService
service = StorageService()
print(f'Bucket exists: {service.bucket_exists(\"short-drama\")}')
"
```

---

## Task 6: 小说解析服务实现

**预计耗时**: 10 天  
**依赖**: Task 5 完成  

### 目标
实现小说上传后的自动解析功能。

### 交付物

1. **章节识别算法**
   - 正则表达式匹配（第X章、第X回、Chapter X 等）
   - 编码自动检测（UTF-8、GBK、GB2312）
   - 章节边界检测
   - 容错处理（无章节标记时智能分段）

2. **小说解析器**
   - TXT 文件读取
   - 章节内容提取
   - 字数统计
   - 进度上报

3. **角色提取**
   - 基于规则的角色名识别
   - 出场次数统计
   - 性别推测
   - 角色描述提取

4. **场景识别**
   - 地点关键词匹配
   - 场景切换检测

5. **任务集成**
   - parse_novel_task Celery 任务
   - 进度更新（10%、30%、60%、100%）
   - Java 后端结果回调

6. **单元测试**
   - 解析器单元测试（多种格式样本）
   - 任务集成测试

### 验证标准

#### 代码质量
- [ ] `pytest --cov=app.services --cov=app.tasks` 显示覆盖率 ≥ 70%
- [ ] 解析器核心逻辑测试覆盖率 ≥ 85%

#### 解析准确性验证
```bash
# 准备测试文件（包含不同章节格式）
cat > /tmp/test_novel.txt << 'EOF'
第一章 初入江湖
这是第一章的内容。张三说道："你好！"

第二章 江湖险恶
这是第二章的内容。李四回答："我很好。"
EOF

# 上传到 MinIO（提前准备）

# 调用解析 API
curl -X POST http://localhost:8000/api/v1/novels/parse \
  -H "Content-Type: application/json" \
  -d '{
    "novel_id": "123e4567-e89b-12d3-a456-426614174000",
    "file_path": "novels/test_novel.txt",
    "encoding": "utf-8"
  }'
# 预期: {"task_id":"...","status":"pending"}

# 查询任务状态
curl http://localhost:8000/api/v1/novels/parse/status/{task_id}
# 预期: {"task_id":"...","status":"SUCCESS","result":{"total_chapters":2,...}}
```

#### 解析准确率标准
- [ ] 标准格式章节（第X章）识别准确率 ≥ 99%
- [ ] 英文章节（Chapter X）识别准确率 ≥ 95%
- [ ] 无章节标记时智能分段合理
- [ ] 角色提取 Top 10 准确率 ≥ 80%

#### 性能验证
- [ ] 10MB 小说解析时间 < 30 秒
- [ ] 100MB 小说解析时间 < 5 分钟
- [ ] 内存占用 < 500MB

---

## Task 7: 前端基础架构

**预计耗时**: 5 天  
**依赖**: Task 1 完成  

### 目标
搭建 React 前端项目的基础架构。

### 交付物

1. **项目结构**
   - src/components/ - 组件目录
   - src/pages/ - 页面目录
   - src/hooks/ - 自定义 hooks
   - src/stores/ - Zustand 状态管理
   - src/services/ - API 服务
   - src/utils/ - 工具函数
   - src/types/ - TypeScript 类型定义

2. **状态管理**
   - authStore（用户认证状态）
   - novelStore（小说列表状态）
   - projectStore（项目状态）

3. **API 服务**
   - axios 实例配置（拦截器、错误处理）
   - authService（认证接口）
   - novelService（小说接口）
   - projectService（项目接口）

4. **UI 组件**
   - Layout（布局组件）
   - Header（导航头）
   - Sidebar（侧边栏）
   - Loading（加载指示器）
   - ErrorBoundary（错误边界）

5. **路由配置**
   - React Router 配置
   - 路由守卫（PrivateRoute）
   - 懒加载配置

### 验证标准

#### 代码质量
- [ ] `npm run lint` 无错误
- [ ] `npm run type-check` 无类型错误
- [ ] `npm run test` 通过率 100%

#### 功能验证
```bash
cd frontend
npm run dev

# 1. 验证开发服务器
curl -s http://localhost:3000 | head -20
# 预期: 返回 HTML，包含 root 节点
```

#### 构建验证
```bash
npm run build
# 预期: dist 目录生成，无错误
# 预期: 资源文件正确打包
```

---

## Task 8: 前端页面开发

**预计耗时**: 10 天  
**依赖**: Task 7 完成  

### 目标
实现所有用户界面页面。

### 交付物

1. **认证页面**
   - LoginPage（登录页）
   - RegisterPage（注册页）

2. **小说管理页面**
   - NovelListPage（小说列表）
   - NovelUploadPage（上传小说）
   - NovelDetailPage（小说详情、章节列表）

3. **角色管理页面**
   - CharacterListPage（角色列表）
   - CharacterDetailPage（角色详情、形象生成）

4. **项目管理页面**
   - ProjectListPage（项目列表）
   - ProjectCreatePage（创建项目）
   - ProjectDetailPage（项目详情、剧集列表）

5. **剧集生成页面**
   - EpisodeScriptPage（剧本审核）
   - EpisodePreviewPage（预览生成）
   - EpisodeListPage（剧集列表、下载）

### 验证标准

#### 交互验证（逐个页面）

**登录页面**:
- [ ] 输入用户名/密码，点击登录，成功跳转首页
- [ ] 输入错误密码，显示错误提示
- [ ] 未输入内容点击登录，显示表单验证错误
- [ ] Token 过期后自动跳转登录页

**小说上传页面**:
- [ ] 选择 TXT 文件，显示文件名
- [ ] 点击上传，显示进度条
- [ ] 上传成功后跳转小说详情页
- [ ] 上传失败显示错误信息

**项目详情页面**:
- [ ] 显示项目基本信息
- [ ] 显示剧集列表和状态
- [ ] 点击生成按钮触发剧集生成
- [ ] 实时显示生成进度
- [ ] 生成的视频可播放

#### 响应式设计验证
- [ ] 1920x1080: 布局正常，无滚动条（除内容区）
- [ ] 1366x768: 布局自适应，侧边栏可折叠
- [ ] 1280x720: 布局自适应，表格横向滚动

#### 浏览器兼容性验证
- [ ] Safari 最新版: 功能正常，样式正确
- [ ] Chrome 最新版: 功能正常，样式正确
- [ ] Firefox 最新版: 功能正常，样式正确

#### 错误处理验证
- [ ] API 500 错误: 显示"服务繁忙，请稍后重试"
- [ ] API 404 错误: 显示"请求的资源不存在"
- [ ] 网络断开: 显示"网络连接失败"
- [ ] 加载超时: 显示"加载超时，请重试"

---

## Task 9: 集成测试与联调

**预计耗时**: 7 天  
**依赖**: Task 4、6、8 完成  

### 目标
完成前后端集成，确保端到端流程可用。

### 交付物

1. **端到端测试用例**
   - 用户注册 → 登录 → 上传小说 → 解析 → 创建项目 → 生成剧集 → 下载视频

2. **集成测试脚本**
   - Shell 脚本自动化测试
   - Playwright E2E 测试

3. **性能测试**
   - API 压力测试
   - 并发用户测试

4. **部署文档**
   - Mac mini 4 生产环境部署步骤
   - 服务启动脚本
   - 日志查看指南

### 验证标准

#### 端到端流程验证
```bash
# 1. 完整流程脚本测试
./scripts/e2e-test.sh
# 预期: 所有步骤通过，输出 "All tests passed!"
```

**手动验证步骤**:
1. [ ] 用户注册成功
2. [ ] 用户登录成功，Token 正确保存
3. [ ] 小说上传成功，文件保存到 MinIO
4. [ ] 小说解析触发成功，Celery 任务执行
5. [ ] 解析完成后章节正确显示
6. [ ] 创建项目成功
7. [ ] 剧集生成触发成功
8. [ ] 生成完成后视频可播放
9. [ ] 视频下载成功

#### API 性能验证
```bash
# 使用 hey 或 ab 进行压力测试
hey -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/novels

# 预期: P95 < 500ms
# 预期: 错误率 < 1%
```

#### 并发验证
- [ ] 5 个用户同时登录: 全部成功
- [ ] 5 个项目同时解析: 任务队列正常，无丢失
- [ ] 5 个视频同时生成: GPU 资源分配合理

#### 集成测试报告
- [ ] 所有测试用例通过
- [ ] 发现的 bug 已修复
- [ ] 性能指标达标

---

## Mac mini 4 本地部署架构

### 硬件规格要求
- **机型**: Mac mini (M4 或更高)
- **内存**: ≥ 24GB（建议 32GB）
- **存储**: ≥ 512GB SSD（建议 1TB）
- **网络**: 局域网访问

### 本地服务部署

| 服务 | 安装方式 | 访问地址 | 数据目录 |
|------|----------|----------|----------|
| PostgreSQL 15 | Homebrew | localhost:5432 | /opt/homebrew/var/postgresql@15 |
| Redis 7 | Homebrew | localhost:6379 | /opt/homebrew/var/db/redis |
| MinIO | 官方二进制 | localhost:9000 | ~/minio-data |
| RabbitMQ | Homebrew | localhost:5672 | /opt/homebrew/var/lib/rabbitmq |

### 开发环境启动

```bash
# Terminal 1: PostgreSQL
brew services start postgresql@15

# Terminal 2: Redis
brew services start redis

# Terminal 3: MinIO
mkdir -p ~/minio-data
minio server ~/minio-data --console-address :9001

# Terminal 4: RabbitMQ
brew services start rabbitmq

# Terminal 5: Java Backend
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Terminal 6: Python AI Service
cd ai-service
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 7: Frontend
cd frontend
npm run dev
```

### 生产环境启动脚本（Phase 2）
```bash
# 使用 launchd 管理后台服务
# 配置位置: ~/Library/LaunchAgents/
# 服务: short-drama-api.plist, short-drama-ai.plist
```

---

## 质量门禁（所有任务必须通过）

### 代码门禁
- [ ] 单测覆盖率 ≥ 70%
- [ ] 代码审查通过
- [ ] 静态分析无严重警告
- [ ] 无安全漏洞（依赖检查）

### 功能门禁
- [ ] 所有 API 有 curl 测试命令和预期输出
- [ ] 所有 API 响应与文档一致
- [ ] 前端所有页面交互可用
- [ ] 端到端流程可完整运行

### 文档门禁
- [ ] API 文档完整（Swagger）
- [ ] README 包含运行说明
- [ ] 接口调用示例验证通过

---

## 修订记录

| 版本 | 日期 | 修订内容 |
|------|------|----------|
| v1.0 | 2025-04-18 | 初始版本，包含代码实现 |
| v1.1 | 2025-04-18 | 移除代码实现，改为高层次规划；更新为 Mac mini 4 本地部署 |
| v1.2 | 2025-04-18 | 添加严格的质量标准：单测覆盖率≥70%、curl 验证、接口文档、前端交互验证 |
