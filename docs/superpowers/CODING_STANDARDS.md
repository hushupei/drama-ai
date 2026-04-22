# 短剧生成平台 - 编码准则

**版本**: v1.0  
**日期**: 2026-04-22  
**适用范围**: Java 后端、Python AI 服务、React 前端

---

## 核心原则

### 1. SOLID 原则（强制遵循）

| 原则 | 含义 | 检查点 |
|------|------|--------|
| **S**ingle Responsibility | 单一职责 | 一个类/模块只有一个变化理由；类名能准确描述其职责 |
| **O**pen/Closed | 开闭原则 | 对扩展开放（接口/抽象类），对修改关闭（已有代码不改动） |
| **L**iskov Substitution | 里氏替换 | 子类可完全替换父类，不破坏原有功能 |
| **I**nterface Segregation | 接口隔离 | 客户端不依赖不需要的方法；接口小而专 |
| **D**ependency Inversion | 依赖倒置 | 依赖抽象（接口/抽象类），不依赖具体实现；使用依赖注入 |

**违规示例**:
```java
// ❌ 违反 SRP：既处理上传又解析又存储
class NovelService {
    void uploadAndParseAndSave() { ... }
}

// ✅ 正确：职责分离
class NovelUploadService { ... }
class NovelParser { ... }
class NovelRepository { ... }
```

### 2. 设计模式使用指南

**必须使用场景**:

| 模式 | 使用场景 | 本项目示例 |
|------|----------|-----------|
| **工厂方法** | 创建不同类型对象，且类型在运行时确定 | 创建不同类型的任务处理器（ParseTask、GenerateTask） |
| **策略模式** | 多种算法/策略可互换 | 章节解析策略（RegexStrategy、MLStrategy） |
| **责任链** | 多个处理器依次处理请求，任一可终止或继续 | 文件上传前的验证链（格式检查→大小检查→病毒扫描） |
| **观察者** | 事件通知，解耦发布者和订阅者 | 任务状态变更通知前端 |
| **模板方法** | 算法骨架固定，步骤可定制 | 视频生成流程（准备→渲染→合成→上传） |
| **适配器** | 兼容不同接口 | 不同 AI 提供商（OpenAI/Claude）统一接口 |

**禁止使用**:
- 单例模式（使用依赖注入替代）
- 过度使用装饰器（导致调用链过长，难以调试）

**判断标准**:
- 使用模式后代码行数减少或持平 → 可能合适
- 使用模式后代码行数增加 50% 以上且复杂度提升 → 过度设计

### 3. 高内聚低耦合

**高内聚检查清单**:
- [ ] 类的所有方法都操作类的属性
- [ ] 方法之间通过类的属性共享数据，而非大量参数传递
- [ ] 修改一个功能时，只需要修改一个类

**低耦合检查清单**:
- [ ] 类之间通过接口交互，不直接 new 具体类
- [ ] 不使用全局变量/static 方法传递状态
- [ ] 一个类的修改不会导致其他类编译失败

**依赖规则**（Clean Architecture 简化版）:
```
Controller → Service → Repository/Domain
    ↑           ↑
   DTO        Entity
```
- 上层可依赖下层
- 下层绝不依赖上层
- 同层之间尽量不依赖（通过上层协调）

---

## 代码质量标准

### 文件与函数规模

| 指标 | 限制 | 超限处理 |
|------|------|----------|
| 单文件行数 | ≤ 300 行 | 拆分为多个类或提取工具函数 |
| 单函数行数 | ≤ 30 行 | 提取子函数 |
| 函数参数 | ≤ 4 个 | 使用 Builder 模式或参数对象 |
| 嵌套深度 | ≤ 3 层 | 提前返回或提取函数 |
| 圈复杂度 | ≤ 8 | 拆分逻辑或使用策略模式 |

### 命名规范

**Java**:
- 类名: `Noun` 或 `NounPhrase`（`NovelParser`, `ChapterService`）
- 接口名: 形容词或 `CanDoSomething`（`Parsable`, `Generatable`）
- 方法名: `verb` 或 `verbNoun`（`parse()`, `uploadFile()`）
- 布尔方法: `is/has/can/should` 前缀（`isValid()`, `hasPermission()`）
- 常量: `UPPER_SNAKE_CASE`

**Python**:
- 类名: `PascalCase`
- 函数/变量: `snake_case`
- 私有: `_leading_underscore`
- 常量: `UPPER_SNAKE_CASE`

**TypeScript/React**:
- 组件: `PascalCase`（`NovelList`）
- Hooks: `use` 前缀 + `PascalCase`（`useNovelList`）
- 普通函数: `camelCase`（`formatDate`）
- Props 接口: `ComponentNameProps`

### 注释规范

**禁止**:
- 注释解释"代码做了什么"（代码应该自解释）
- 过时注释（修改代码必须同步修改注释）
- 大块注释掉的代码（使用 Git 历史找回）

**必须**:
- 解释"为什么这么做"（业务背景、特殊处理原因）
- API 文档（JavaDoc/JSDoc）
- 复杂的算法说明
- 非直观的副作用说明

```java
// ❌ 禁止：解释代码做了什么
// 遍历章节列表
for (Chapter ch : chapters) { ... }

// ✅ 必须：解释为什么
// 章节必须按顺序处理，因为后续章节可能依赖前文的角色关系
for (Chapter ch : chapters) { ... }
```

---

## 测试要求

### TDD 流程（严格执行）

1. **RED**: 写测试，运行，必须失败
2. **GREEN**: 写最少代码让测试通过（允许丑陋代码）
3. **REFACTOR**: 重构，保持测试通过
4. **COVERAGE**: 检查覆盖率 ≥ 70%

### 测试类型

| 类型 | 工具 | 覆盖目标 | 测试内容 |
|------|------|----------|----------|
| 单元测试 | JUnit/pytest/vitest | ≥ 70% | 单个函数/类，Mock 外部依赖 |
| 集成测试 | SpringBootTest/pytest-async | 核心流程 | Service + Repository，使用 Testcontainers |
| API 测试 | curl/httpyac | 所有端点 | 请求/响应格式验证 |
| E2E 测试 | Playwright | 关键路径 | 用户完整操作流程 |

### 测试质量检查

- [ ] 测试名描述行为（`shouldRejectInvalidFileFormat` 而非 `testUpload`）
- [ ] 每个测试一个断言（或一个逻辑相关的断言组）
- [ ] 使用 Given-When-Then 结构
- [ ] 不测试私有方法（通过公有方法间接测试）
- [ ] Mock 外部依赖，不 Mock 被测类的内部逻辑

---

## 设计决策原则

### 不要过度设计

**判断标准**:
- 当前需求是否需要这个抽象？
- 未来可能的变化是否确定会发生？
- 增加的复杂度是否值得？

**违规示例**:
```java
// ❌ 过度设计：为了一个简单解析器定义 5 个接口和 3 个抽象类
interface Parser { }
interface ChapterParser extends Parser { }
interface NovelParser extends Parser { }
abstract class AbstractParser implements Parser { }
...

// ✅ 正确：从简单开始，需要时再抽象
class NovelParser {
    List<Chapter> parse(String content) { ... }
}
```

### 不要猜测性代码

**禁止**:
- "以后可能需要的"功能
- "也许会用到的"配置项
- "以防万一"的抽象层

**正确做法**:
- 只实现当前需求明确的功能
- 不确定时询问产品/用户
- 记录潜在需求到 backlog，不实现在当前代码

### 不要冗余代码

**检查清单**:
- [ ] 删除未使用的方法/变量/导入
- [ ] 删除重复代码（提取公共函数）
- [ ] 删除无用的注释和日志
- [ ] 删除未触发的异常处理

**工具**: IDE 的 "Unused declaration" 检查、SonarLint

---

## 技术栈特定规范

### Java 后端

**强制使用**:
- 构造函数注入（不使用 @Autowired 字段注入）
- Optional 处理可能为空的值
- Stream API 处理集合（复杂逻辑提取为方法引用）
- Records 作为 DTO（Java 17+）

**禁止**:
- null 返回（使用 Optional 或抛出异常）
- 魔法数字（使用常量或枚举）
- 大段注释代码
- System.out.println（使用日志框架）

**示例**:
```java
@Service
@RequiredArgsConstructor  // ✅ 构造函数注入
public class NovelService {
    private final NovelRepository novelRepository;
    private final StorageService storageService;
    
    public NovelDto findById(UUID id) {
        return novelRepository.findById(id)
            .map(NovelDto::fromEntity)  // ✅ Optional 链式处理
            .orElseThrow(() -> new NotFoundException("Novel", id));  // ✅ 明确处理空值
    }
}
```

### Python AI 服务

**强制使用**:
- 类型提示（所有函数参数和返回值）
- Pydantic 模型验证输入/输出
- 异常链（`raise ... from e`）
- 上下文管理器（`with` 语句处理资源）

**禁止**:
- 裸 except（使用 `except SpecificError`）
- 全局变量
- 动态类型（`Any` 仅在必要时使用）

**示例**:
```python
from typing import Optional
from pydantic import BaseModel

class ParseResult(BaseModel):  # ✅ Pydantic 模型
    chapters: list[Chapter]
    total_words: int

class NovelParser:
    def parse(self, content: str) -> ParseResult:  # ✅ 类型提示
        try:
            chapters = self._extract_chapters(content)
        except UnicodeDecodeError as e:
            raise ParseError(f"Invalid encoding") from e  // ✅ 异常链
        
        return ParseResult(chapters=chapters, total_words=len(content))
```

### React 前端

**强制使用**:
- 函数组件 + Hooks
- 自定义 Hooks 复用逻辑（useXxx）
- 受控组件（表单使用 state）
- 条件渲染提前返回（避免深层嵌套）

**禁止**:
- Class 组件
- 内联样式（使用 CSS Modules 或 styled-components）
- 直接修改 state（使用不可变更新）
- 在 useEffect 中忘记清理（订阅、定时器）

**示例**:
```typescript
// ✅ 自定义 Hook 封装业务逻辑
function useNovelList() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    let cancelled = false;  // ✅ 竞态条件防护
    
    async function fetchNovels() {
      setLoading(true);
      const data = await novelService.getList();
      if (!cancelled) {
        setNovels(data);
        setLoading(false);
      }
    }
    
    fetchNovels();
    return () => { cancelled = true; };  // ✅ 清理函数
  }, []);
  
  return { novels, loading };
}

// ✅ 组件简洁，逻辑在 Hook 中
function NovelListPage() {
  const { novels, loading } = useNovelList();
  
  if (loading) return <Loading />;  // ✅ 提前返回
  if (novels.length === 0) return <Empty />;
  
  return <NovelList novels={novels} />;
}
```

---

## 代码审查门禁

### 提交前自检

- [ ] 所有测试通过（`mvn test`/`pytest`/`npm test`）
- [ ] 覆盖率 ≥ 70%
- [ ] 静态分析无严重警告
- [ ] 自测通过（手动走通主要流程）

### Code Review 清单

审查者必须检查：
- [ ] 是否符合 SOLID 原则
- [ ] 设计模式使用是否恰当（不过度）
- [ ] 是否有重复代码可提取
- [ ] 命名是否清晰准确
- [ ] 测试是否覆盖主要路径和边界情况
- [ ] 是否有安全隐患（SQL 注入、XSS 等）

### 审查拒绝标准

以下情况直接拒绝，不合并：
- 单测覆盖率 < 70%
- 存在严重代码异味（大段重复、超大类/函数）
- 明显的安全漏洞
- 违背 SOLID 原则且无合理理由
- 包含猜测性代码/死代码

---

## 不确定时的处理

1. **询问**: 在实现前询问清楚需求
2. **简单实现**: 先实现最简单版本，后续迭代
3. **TODO 标记**: 不确定的地方加 TODO 注释，说明疑问
4. **文档记录**: 设计决策记录到文档中

**禁止**: 为了代码能运行而写一堆不必要的代码（如大量 try-catch、空实现、无意义的抽象）。

---

**准则违反处理**: 代码审查发现违反本准则，必须修复后方可合并。严重违反者，相关代码回滚。
