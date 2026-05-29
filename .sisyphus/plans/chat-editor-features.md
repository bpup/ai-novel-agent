# Copilot for Writers — Chat & Editor 功能实现

## TL;DR

> **Quick Summary**：将 note_ai 的 AI 交互升级为三层 "Copilot for Writers" 体验：聊天面板（@ 提及 + RAG 引用 + 历史管理）、`/` 命令菜单（12 种命令，ProseMirror 插件）、选中悬浮栏（5 种快捷操作），加幽灵文字即时预览。同时增强大纲系统（多章节树 + 拖拽排序 + AI 生成）和章节管理（状态机 + 字数目标 + 摘要笔记）。

> **Deliverables**：
> - `/` 命令菜单 + 幽灵文字（ProseMirror Plugin + Widget Decoration）
> - 选中悬浮操作栏（ReactDOM.createPortal overlay）
> - 聊天面板增强（@ 提及、RAG 引用标记、三位置插入、历史管理）
> - Context Bus + AI Orchestrator（上下文总线和编排层）
> - 大纲系统升级（多章节树 + HTML5 拖拽排序 + AI 生成按钮）
> - 章节管理增强（状态机、字数目标、摘要、笔记面板）
> - Vitest 测试基础设施 + 覆盖所有新模块的单元测试

> **Estimated Effort**：Large
> **Parallel Execution**：YES — 7 waves
> **Critical Path**：Task 1（测试基建）→ Task 2（类型系统）→ Task 4（ContextBus）→ Task 9（AIService）→ Task 15（集成）→ Final verification

---

## Context

### Original Request

用户要求设计并实现聊天区和编辑器的完整功能升级，定位为 "Copilot for Writers" 体验。

### Interview Summary

**Key Discussions**：
- Copilot 风格 — 聊天面板是主要 AI 门户
- 编辑器内 `/` 命令菜单（Notion 风格）+ 选中悬浮操作栏 + 聊天区三层触发机制
- 12 种 AI 命令：续写/扩写/缩写/润色/改写语气/检查错别字/总结段落/提取关键词/自动分段/生成标题/添加描写/翻译
- 聊天面板：@ 提及、RAG 引用标记、三位置插入（替换/光标/文末）、对话历史管理
- 大纲系统：项目全局大纲 + 拖拽排序 + AI 生成
- 章节管理：状态机（draft/writing/done/paused）+ 字数目标 + 摘要 + 笔记
- TDD 测试策略，测试框架选 vitest

**Research Findings**：
- 项目：Vite + React + TipTap v3 + Tauri + Tailwind CSS v4
- 现有组件：`AISidebar.tsx`、`ChatInput.tsx`、`ChatMessages.tsx`、`NovelEditor.tsx`、`ChapterTree.tsx`、`OutlineView.tsx`
- 现有服务：`aiOrchestrator`、`llm/chat.ts`、`rag/engine.ts`、`skill/manager.ts`
- 章节类型已有 `order` 字段，需扩展 `summary`/`wordGoal`/`status`/`notes`

### 设计文档

完整设计见：`.sisyphus/drafts/chat-editor-design.md`

---

## Work Objectives

### Core Objective

将 note_ai 从简单的 AI 聊天升级为完整的智能写作助手，提供三层 AI 交互（聊天/命令/悬浮栏）、统一上下文管理、增强大纲和章节管理。

### Concrete Deliverables
- `src/components/ai/orchestrator/ContextBus.ts` — 上下文总线
- `src/components/ai/orchestrator/AIService.ts` — AI 编排服务
- `src/components/ai/orchestrator/prompts.ts` — 12 种命令 Prompt 模板
- `src/components/ai/ChatHistory.tsx` — 聊天历史管理面板
- `src/components/ai/InlineCommand.tsx` — `/` 命令菜单 UI
- `src/components/ai/SelectionHoverBar.tsx` — 选中悬浮操作栏
- `src/components/editor/ChapterNotes.tsx` — 章节笔记面板
- `src/components/editor/ProjectOutline.tsx` — 项目全局大纲
- `src/components/ai/AISidebar.tsx` — 增强（@ 提及、RAG 引用、三位置插入）
- `src/components/ai/ChatMessages.tsx` — 增强（RAG 引用标记、三位置插入按钮）
- `src/components/ai/ChatInput.tsx` — 增强（@ 提及解析）
- `src/components/editor/NovelEditor.tsx` — 增强（/ 命令插件 + ghost text 插件）
- `src/components/editor/ChapterTree.tsx` — 增强（状态标签、字数、摘要）
- `src/components/editor/OutlineView.tsx` — 增强（多章节大纲 + 拖拽）
- `src/types/novel.ts` — 扩展 Chapter 类型 + ChatSession 类型
- `vitest.config.ts` — 测试配置
- `src/**/__tests__/*.test.ts` — 单元测试覆盖

### Definition of Done
- [x] `npx vitest run` → 所有测试通过
- [x] `npm run build` → tsc + vite build 通过
- [x] 12 种命令可正常触发并返回结果
- [x] 幽灵文字 Tab 接受 / Escape 取消
- [x] 选中悬浮栏正确显示和隐藏
- [x] 大纲拖拽排序功能正常
- [x] 章节状态机状态流转正确

### Must Have
- 所有 12 种 AI 命令
- 幽灵文字预览和键盘操作
- @ 提及系统（@selection、@chapter、@project）
- RAG 引用标记
- 三位置插入选择器
- 聊天历史管理
- 章节状态机（draft → writing → done ← paused）
- 大纲拖拽排序
- Vitest 测试全覆盖

### Must NOT Have
- 不新增 Tauri 后端 AI 服务（继续用现有 LLM 调用方式）
- 不新增用户账户/云端同步
- 不引入新状态管理库（继续用 Context + useState/useReducer）
- 不新增富文本块类型
- 不碰 EditorToolbar.tsx 基本格式功能
- 不删除或破坏现有编辑器功能

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**：NO — 需要搭建 vitest
- **Automated tests**：TDD — RED → GREEN → REFACTOR
- **Framework**：vitest（与 Vite 原生集成）
- **Testing library**：@testing-library/react + jsdom

### QA Policy
每个任务包含 Agent-Executed QA Scenarios，执行 agent 通过 Playwright/curl/REPL 直接验证。

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1（立即开始 — 基础设施）：
├── Task 1：测试基建（vitest + @testing-library/react）
├── Task 2：类型系统扩展（Chapter + ChatSession 类型）
├── Task 3：章节数据迁移 + service 更新
├── Task 4：ContextBus（上下文总线）
└── Task 5：AI Orchestrator + Prompt 模板

Wave 2（Wave 1 完成后 — 聊天面板核心）：
├── Task 6：ChatInput @ 提及系统
├── Task 7：ChatMessages RAG 引用 + 三位置插入
├── Task 8：ChatHistory 历史管理面板
├── Task 9：AISidebar 集成增强
└── Task 10：聊天面板集成测试

Wave 3（Wave 1 完成后 — 编辑器 AI 层）：
├── Task 11：Ghost text ProseMirror Plugin
├── Task 12：/ 命令菜单 + InlineCommand UI
├── Task 13：SelectionHoverBar 悬浮操作栏
└── Task 14：NovelEditor 插件注册集成

Wave 4（Wave 2 & 3 完成后 — 大纲 + 章节）：
├── Task 15：章节状态机 + 字数目标
├── Task 16：章节摘要 + AI 生成按钮
├── Task 17：ChapterNotes 笔记面板
├── Task 18：ProjectOutline 全局大纲 + 拖拽排序
└── Task 19：OutlineView 增强

Wave 5（Wave 4 完成后 — 端到端集成）：
├── Task 20：Project.tsx 全组件集成 + 上下文联动
├── Task 21：AI 编排全链路测试
├── Task 22：UI 细节打磨 + 动效
└── Task 23：构建验证 + 错误边界

Wave FINAL（所有完成后）：
├── Task F1：Plan Compliance Audit (oracle)
├── Task F2：Code Quality Review (unspecified-high)
├── Task F3：Real Manual QA (unspecified-high)
└── Task F4：Scope Fidelity Check (deep)
```

**Critical Path**：Task 1 → Task 2 → Task 4 → Task 5 → Task 9 → Task 14 → Task 19 → Task 20 → Task 23 → F1-F4

**Max Concurrent**：Wave 2+3 并行 9 tasks，Wave 4 并行 5 tasks

---

## TODOs

- [x] 1. 测试基础设施建设

  **What to do**：
  - 安装 `vitest`、`@testing-library/react`、`@testing-library/jest-dom`、`jsdom`
  - 创建 `vitest.config.ts`，配置 jsdom 环境和路径别名
  - 在 `package.json` 添加 `"test": "vitest run"` 和 `"test:watch": "vitest"`
  - 创建测试基础设施文件：
    - `src/test/setup.ts`：全局 before/after hooks，jsdom 配置
    - `src/test/utils.tsx`：renderWithProviders 等测试工具
    - `src/test/mocks/editor.ts`：TipTap Editor mock 工厂
    - `src/test/mocks/llm.ts`：LLM 调用 mock 工厂
  - 写一个 smoke test 验证测试环境：`src/test/smoke.test.ts`
  - 确保 `npx vitest run` 通过

  **Must NOT do**：不要碰现有源代码；不要修改 vite.config.ts 中已有的插件配置

  **Recommended Agent Profile**：Category `quick`，Skills []

  **Parallelization**：Wave 1，Sequential，Blocks Tasks 2-23，Blocked By None

  **References**：`package.json:1-48`（项目配置），`vite.config.ts`（Vite 配置）

  **Acceptance Criteria**：
  - [ ] `npx vitest run` → smoke test PASS
  - [ ] vitest.config.ts 存在，jsdom 环境正确

  **QA Scenarios**：
  ```
  Scenario: 测试环境验证
    Tool: Bash | Steps: npx vitest run src/test/smoke.test.ts
    Expected: exit 0, "Tests 1 passed"
    Evidence: .sisyphus/evidence/task-1-smoke.txt
  ```

  **Commit**：YES — `chore: add vitest + testing-library infrastructure`

- [x] 2. 类型系统扩展

  **What to do**：
  - RED：写测试 `src/types/__tests__/novel-types.test.ts` 验证 Chapter 新字段 + ChatSession/MentionTarget 类型
  - 扩展 `src/types/novel.ts` 中 Chapter 接口（summary, wordGoal, status, notes — optional）
  - 新建 `src/types/chat.ts`：ChatSession, RAGCitation, MentionTarget, InsertPosition 类型
  - GREEN：全部类型测试通过

  **Must NOT do**：不改动 Chapter 必需字段；新字段 optional 向后兼容

  **Recommended Agent Profile**：Category `quick`，Skills []

  **Parallelization**：Wave 1，Sequential，Blocks Tasks 4-23，Blocked By Task 1

  **References**：`src/types/novel.ts:15-21`（Chapter 接口），`.sisyphus/drafts/chat-editor-design.md:§9`

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/types/__tests__` → PASS
  - [ ] `npx tsc --noEmit` → 无错误

  **QA Scenarios**：
  ```
  Scenario: 类型编译验证
    Tool: Bash | Steps: npx vitest run src/types/__tests__ && npx tsc --noEmit
    Evidence: .sisyphus/evidence/task-2-types.txt
  ```

  **Commit**：YES — `feat(types): extend Chapter + add ChatSession/RAGCitation types`

- [x] 3. 章节数据迁移 + 数据服务更新

  **What to do**：
  - RED：`src/services/project/__tests__/chapter-service.test.ts` 测试 CRUD 新字段 + status 合法性
  - GREEN：更新 `src/services/project/manager.ts` 适配扩展 Chapter，默认值补全
  - 数据迁移：旧章无新字段 → 自动补 summary=""、wordGoal=5000、status="draft"、notes=""

  **Must NOT do**：不修改数据库 schema；不破坏现有 getChapter/saveChapter

  **Recommended Agent Profile**：Category `quick`，Skills []

  **Parallelization**：Wave 1，Sequential，Blocks Tasks 15-19，Blocked By Task 2

  **References**：`src/services/project/manager.ts`，`src/services/db/database.ts`

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/services/project/__tests__` → PASS
  - [ ] 旧章节自动补默认值，status 类型正确

  **QA Scenarios**：
  ```
  Scenario: 章节 CRUD
    Tool: Bash | Steps: npx vitest run src/services/project/__tests__/chapter-service.test.ts
    Evidence: .sisyphus/evidence/task-3-chapter-crud.txt
  ```

  **Commit**：YES — `feat(service): extend chapter CRUD with status/wordGoal/summary/notes`

- [x] 4. ContextBus — 上下文总线

  **What to do**：
  - RED：`src/components/ai/orchestrator/__tests__/ContextBus.test.ts`
    - `resolveMention("@selection"`, `"@chapter X"`, `"@project"`, `"@unknown"`)
    - `buildContextPrompt()` 在不同 options 下的输出
    - `setEditor` / `setCurrentChapter` / `setProjectContext` 状态保持
  - GREEN：`src/components/ai/orchestrator/ContextBus.ts`
    - `resolveMention(input)` → MentionTarget | null（@selection/@chapter/@project）
    - `buildContextPrompt(options)` → 按设计 §5.3 模板生成 Prompt
    - `getEditorContext()` → 选区/前后文信息

  **Must NOT do**：不直接调用 AIService（单向依赖）

  **Recommended Agent Profile**：Category `deep`，Skills []

  **Parallelization**：Wave 1，Sequential，Blocks Tasks 5-14，Blocked By Task 2

  **References**：`src/components/ai/AISidebar.tsx:39-49`（重构参考），`.sisyphus/drafts/chat-editor-design.md:§5`

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/orchestrator/__tests__/ContextBus.test.ts` → PASS
  - [ ] 三种 @ 提及正确解析；buildContextPrompt 包含系统指令/项目/章节信息

  **QA Scenarios**：
  ```
  Scenario: @ 提及解析
    Tool: Bash (Node REPL)
    Steps: 创建 ContextBus → resolveMention("@selection") → { type: "selection" }
           resolveMention("@chapter X") → MentionTarget | null
    Expected: 解析结果正确，@unknown → null
    Evidence: .sisyphus/evidence/task-4-contextbus.txt
  ```

  **Commit**：YES — `feat(ai): add ContextBus for unified context management`

- [x] 5. AI Orchestrator + Prompt 模板

  **What to do**：
  - RED：`src/components/ai/orchestrator/__tests__/AIService.test.ts`（execute + stream + 错误处理）
  - RED：`src/components/ai/orchestrator/__tests__/prompts.test.ts`（12 模板完整 + 插值正确）
  - GREEN：`src/components/ai/orchestrator/AIService.ts`
    - `execute({ command, context, stream?, onToken? })` 路由 12 命令 → LLM 调用
    - 返回 `{ result, citations, metadata }`
  - GREEN：`src/components/ai/orchestrator/prompts.ts`
    - 12 种命令 Prompt 模板函数（follow §6.3 约束）

  **Must NOT do**：不重写 `services/ai/orchestrator.ts`

  **Recommended Agent Profile**：Category `deep`，Skills []

  **Parallelization**：Wave 1，Sequential，Blocks Tasks 6-14，Blocked By Task 4

  **References**：`src/services/ai/orchestrator.ts`，`src/services/llm/chat.ts`，`src/services/llm/factory.ts`

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/orchestrator/__tests__` → PASS（2 文件）
  - [ ] 12 种 Prompt 模板完整；流式输出 onToken 回调正常

  **QA Scenarios**：
  ```
  Scenario: 命令执行
    Tool: Bash (REPL)
    Steps: execute({ command: "polish", context: mockContext }) → { result, citations, metadata }
    Evidence: .sisyphus/evidence/task-5-aiservice.txt
  ```

  **Commit**：YES — `feat(ai): add AI Orchestrator + 12 command prompt templates`

---

### Wave 2 — 聊天面板核心

- [x] 6. ChatInput @ 提及系统

  **What to do**：
  - RED：`src/components/ai/__tests__/ChatInput.test.tsx` — @弹出菜单、过滤、ESC关闭
  - GREEN：增强 `src/components/ai/ChatInput.tsx` — @检测 → 下拉菜单（@selection/@chapter/@project）
  - `@chapter` 展开章节搜索子列表；键盘导航；pill 样式回填

  **Must NOT do**：不改变已有模式切换逻辑

  **Recommended Agent Profile**：Category `quick`，Skills []
  **Parallelization**：Wave 2，parallel with Tasks 7,8，Blocked By Task 5

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/__tests__/ChatInput.test.tsx` → PASS

  **QA Scenarios**：
  ```
  Scenario: @ 提及流程
    Tool: Playwright
    Steps: 打开聊天 → 输入 @ → 菜单出现 @selection/@chapter/@project
           选 @chapter → 搜索章节 → 选中 → pill 显示
    Evidence: .sisyphus/evidence/task-6-at-mention.png
  ```

  **Commit**：YES — `feat(chat): add @mention system to ChatInput`

- [x] 7. ChatMessages RAG 引用 + 三位置插入

  **What to do**：
  - RED：`src/components/ai/__tests__/ChatMessages.test.tsx` — 引用渲染、跳转、三按钮功能
  - GREEN：增强 `src/components/ai/ChatMessages.tsx`
    - RAG 引用 inline 渲染 `↩ 来源：第X章第Y段`
    - 每条回复底部三个按钮：替换选中/插入到光标/追加到文末
    - 操作后 toast 确认

  **Must NOT do**：不删除已有 复制/插入/替换 按钮

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 2，parallel with Tasks 6,8，Blocked By Task 5

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/__tests__/ChatMessages.test.tsx` → PASS

  **QA Scenarios**：
  ```
  Scenario: 三位置插入
    Tool: Playwright
    Steps: 发消息 → AI返回 → 点「追加到文末」 → 内容出现在文末
    Evidence: .sisyphus/evidence/task-7-insert.png
  ```

  **Commit**：YES — `feat(chat): add RAG citations + 3-position insert`

- [x] 8. ChatHistory 历史管理面板

  **What to do**：
  - RED：`src/components/ai/__tests__/ChatHistory.test.tsx` — 列表排序/搜索/删除/新建
  - GREEN：`src/components/ai/ChatHistory.tsx`
    - 会话列表 + 搜索过滤 + 新建/删除
    - localStorage 键 `chat_sessions_{projectId}`
    - 自动标题：首条用户消息前 30 字

  **Must NOT do**：不引入新数据库

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 2，parallel with Tasks 6,7,9，Blocked By Task 5

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/__tests__/ChatHistory.test.tsx` → PASS

  **QA Scenarios**：
  ```
  Scenario: 历史管理
    Tool: Playwright
    Steps: 打开历史面板 → 搜索关键词 → 验证过滤 → 删除旧会话
    Evidence: .sisyphus/evidence/task-8-chat-history.png
  ```

  **Commit**：YES — `feat(chat): add ChatHistory session management`

- [x] 9. AISidebar 集成增强

  **What to do**：
  - RED：`src/components/ai/__tests__/AISidebar.test.tsx` — ContextBus 初始化、历史切换
  - GREEN：重构 `src/components/ai/AISidebar.tsx`
    - 初始化 ContextBus + 迁移到 AIService.execute()
    - 集成 ChatHistory 面板
    - 保持 quick action + accept/reject bar

  **Must NOT do**：不删除 quick action；不改变 panel 开关逻辑

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 2，parallel with Tasks 6,7,8，Blocked By Task 5

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/__tests__/AISidebar.test.tsx` → PASS

  **QA Scenarios**：
  ```
  Scenario: 面板集成
    Tool: Playwright
    Steps: 开面板 → 验证快速操作 → 发 @chapter 消息 → AI 返回含引用
    Evidence: .sisyphus/evidence/task-9-aisidebar.png
  ```

  **Commit**：YES — `feat(chat): integrate ContextBus+ChatHistory into AISidebar`

- [x] 10. 聊天面板集成测试

  **What to do**：
  - RED：`src/components/ai/__tests__/chat-integration.test.tsx` — 全链路：@→发送→AI回复→插入
  - GREEN：确保 6-9 逻辑贯通

  **Must NOT do**：不添加额外功能

  **Recommended Agent Profile**：Category `deep`，Skills []
  **Parallelization**：Wave 2，Sequential，Blocked By Tasks 6-9

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/__tests__/chat-integration.test.tsx` → PASS

  **Commit**：YES — `test(chat): full chat flow integration tests`

---

### Wave 3 — 编辑器 AI 层

- [x] 11. Ghost text ProseMirror Plugin

  **What to do**：
  - RED：`src/components/editor/__tests__/ghost-text-plugin.test.ts`
    - 创建 Editor + ghostTextKey plugin → verify Widget Decoration 出现在光标处
    - setGhostText("suggested text") → 幽灵文字渲染
    - Tab 键 → 幽灵文字插入到文档；Escape → 清除
    - 光标移动 → 清除幽灵文字
  - GREEN：`src/components/editor/extensions/ghostText.ts`
    - `ghostTextKey` plugin（ProseMirror Plugin）
    - `ghostTextPlugin()` 导出 TipTap Extension
    - Widget Decoration：灰色 0.5 opacity + CSS pulse 动画
    - 键盘：Tab 接受，Escape 取消
    - `setGhostText(text: string)` 命令

  **Must NOT do**：不改变编辑器已有行为

  **Recommended Agent Profile**：Category `deep`，Skills []
  **Parallelization**：Wave 3，parallel with Tasks 12,13，Blocked By Task 5

  **References**：ProseMirror docs — Widget Decoration，`.sisyphus/drafts/chat-editor-design.md:§4`

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/editor/__tests__/ghost-text-plugin.test.ts` → PASS

  **QA Scenarios**：
  ```
  Scenario: 幽灵文字
    Tool: Playwright
    Steps: 光标定位 → 触发 ghost text → 验证灰色脉冲文字 → Tab 接受 → 文字插入
    Evidence: .sisyphus/evidence/task-11-ghost-text.png
  ```

  **Commit**：YES — `feat(editor): add ghost text ProseMirror Widget Decoration`

- [x] 12. / 命令菜单 + InlineCommand UI

  **What to do**：
  - RED：`src/components/editor/__tests__/slash-command-plugin.test.ts` — `/` 检测、菜单弹出、过滤、Enter 确认
  - RED：`src/components/ai/__tests__/InlineCommand.test.tsx` — 12 命令渲染、关键词过滤、键盘导航
  - GREEN：`src/components/editor/extensions/slashCommand.ts`
    - ProseMirror Plugin：检测 `/` 在段落开头 → dispatch command
    - 集成 AIService.execute()
  - GREEN：`src/components/ai/InlineCommand.tsx`
    - ReactDOM.createPortal 渲染弹出菜单
    - 4 分类：写作、润色、分析、创作
    - 搜索过滤，Arrow Up/Down + Enter
    - 选中命令 → 调用 ContextBus.buildContextPrompt() → AIService.execute() → 幽灵文字

  **Must NOT do**：不拦截非段落开头的 `/`

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 3，parallel with Tasks 11,13，Blocked By Task 5

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/editor/__tests__/slash-command-plugin.test.ts` → PASS
  - [ ] `npx vitest run src/components/ai/__tests__/InlineCommand.test.tsx` → PASS

  **QA Scenarios**：
  ```
  Scenario: / 命令
    Tool: Playwright
    Steps: 清空段落 → 输入 / → 菜单弹出 → 输入"润" → 过滤 → Enter → ghost text 出现
    Evidence: .sisyphus/evidence/task-12-slash-command.png
  ```

  **Commit**：YES — `feat(editor): add slash command menu + InlineCommand UI`

- [x] 13. SelectionHoverBar 悬浮操作栏

  **What to do**：
  - RED：`src/components/ai/__tests__/SelectionHoverBar.test.tsx`
    - 短选区 < 5 字符 → 不出现
    - 长选区 + 500ms → bar 出现
    - 点击每个按钮 → 调用正确 AI 命令
    - 选区清除 → bar 消失
    - 选区变化 → 位置更新
  - GREEN：`src/components/ai/SelectionHoverBar.tsx`
    - ReactDOM.createPortal 渲染
    - 5 按钮：润色/扩写/缩写/翻译/续写
    - 位置：`coordsAtPos()` 选区上方 12px
    - 延迟：选区满 5 字符 + 500ms 后出现
    - 消失：ESC / 点击空白 / 选区清除
    - 点击 → AIService.execute() → ghost text

  **Must NOT do**：不覆盖编辑器已有点击事件

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 3，parallel with Tasks 11,12，Blocked By Task 5

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/__tests__/SelectionHoverBar.test.tsx` → PASS

  **QA Scenarios**：
  ```
  Scenario: 悬浮栏
    Tool: Playwright
    Steps: 选 10 个字 → 等 500ms → bar 出现 → 点「润色」→ ghost text 出现
    Evidence: .sisyphus/evidence/task-13-hover-bar.png
  ```

  **Commit**：YES — `feat(editor): add selection hover bar with 5 quick AI actions`

- [x] 14. NovelEditor 插件注册集成

  **What to do**：
  - RED：`src/components/editor/__tests__/NovelEditor-plugins.test.tsx` — slash + ghost 插件共存
  - GREEN：`src/components/editor/NovelEditor.tsx`
    - 注册 ghostTextPlugin + slashCommandPlugin
    - 初始化 ContextBus + AIService
    - 渲染 SelectionHoverBar（条件：编辑器 focus + 选区）
    - 确保所有已有 extensions 正常加载

  **Must NOT do**：不修改 EditorToolbar.tsx

  **Recommended Agent Profile**：Category `deep`，Skills []
  **Parallelization**：Wave 3，Sequential，Blocked By Tasks 11,12,13

  **Acceptance Criteria**：
  - [x] `npx vitest run src/components/editor/__tests__/NovelEditor-plugins.test.tsx` → PASS (4/4)
  - [x] slash + ghost 共存，/ 在已有文字后不触发

  **QA Scenarios**：
  ```
  Scenario: 插件共存
    Tool: Playwright
    Steps: / → 执行命令 → ghost text → Tab → / 再次触发
    Evidence: .sisyphus/evidence/task-14-plugins.png
  ```

  **Commit**：YES — `feat(editor): register slashCommand + ghostText plugins in NovelEditor`

---

### Wave 4 — 大纲 & 章节

- [x] 15. 章节状态机 + 字数目标

  **What to do**：
  - RED：`src/components/editor/__tests__/ChapterTree-state.test.tsx`
    - 状态流转：draft→writing→done（可 paused 到任一状态暂停）
    - 字数目标进度条渲染
    - 无效流转拒绝（e.g., draft 不跳过 writing 直接 done）
  - GREEN：增强 `src/components/editor/ChapterTree.tsx`
    - 状态下拉：从 Chapter.status 渲染，点击切换（合法流转）
    - 字数进度条：`min(content.length, wordGoal) / wordGoal * 100%`
    - 状态颜色标签（draft=灰, writing=蓝, paused=黄, done=绿）

  **Must NOT do**：不改变 ChapterTree 已有拖拽排序逻辑

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 4，parallel with Tasks 16,17,18，Blocked By Task 3

  **Acceptance Criteria**：
  - [x] `npx vitest run src/components/editor/__tests__/ChapterTree-state.test.tsx` → PASS (9/9)
  - [x] 状态流转正确验证

  **QA Scenarios**：
  ```
  Scenario: 状态切换
    Tool: Playwright
    Steps: ChapterTree 点击状态标签 → draft→writing → 验证 UI 更新 → writing→done
    Evidence: .sisyphus/evidence/task-15-chapter-state.png
  ```

  **Commit**：YES — `feat(editor): add chapter status state machine + word goal progress`

- [x] 16. 章节摘要 + AI 生成按钮

  **What to do**：
  - RED：`src/components/editor/__tests__/ChapterTree-summary.test.tsx` — summary 编辑、AI 生成触发
  - GREEN：增强 `src/components/editor/ChapterTree.tsx`
    - 展开章节 → 显示 summary 自由文本区域
    - "AI 生成摘要" 按钮 → AIService.execute("summarize", 后 500 字)
    - 结果插入 summary 字段
  - 实现 `AIService` 中 summarize 命令：取章节内容后 500 字 → summarize Prompt

  **Must NOT do**：不覆盖已有 summary 内容

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 4，parallel with Tasks 15,17,18，Blocked By Tasks 3,5

  **Acceptance Criteria**：
  - [x] `npx vitest run src/components/editor/__tests__/ChapterTree-summary.test.tsx` → PASS (8/8)
  - [x] AI 生成摘要功能正常

  **QA Scenarios**：
  ```
  Scenario: AI 生成摘要
    Tool: Playwright
    Steps: 展开章节 → 点 "AI 生成摘要" → 验证摘要出现 → 可手动编辑
    Evidence: .sisyphus/evidence/task-16-summary.png
  ```

  **Commit**：YES — `feat(editor): add chapter summary with AI generation`

- [x] 17. ChapterNotes 笔记面板

  **What to do**：
  - RED：`src/components/editor/__tests__/ChapterNotes.test.tsx` — 编辑、保存、AI 按钮
  - GREEN：`src/components/editor/ChapterNotes.tsx`
    - 独立笔记面板，渲染在编辑器左侧边栏下半部分
    - Textarea 自由编辑 + 自动保存到 Chapter.notes
    - "AI 提取伏笔" 按钮 → `execute("extract_keywords", context)` → 关键词插入
    - "AI 继续" 按钮 → `execute("continue", context)` → 续写插入

  **Must NOT do**：不放入编辑器正文

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 4，parallel with Tasks 15,16,18，Blocked By Tasks 3,5

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/editor/__tests__/ChapterNotes.test.tsx` → PASS
  - [ ] 编辑自动保存，AI 按钮正常

  **QA Scenarios**：
  ```
  Scenario: 笔记编辑
    Tool: Playwright
    Steps: 在笔记面板输入文字 → 切换章节 → 回来 → 文字仍在 → 点 AI 按钮
    Evidence: .sisyphus/evidence/task-17-chapter-notes.png
  ```

  **Commit**：YES — `feat(editor): add ChapterNotes panel with auto-save + AI assist`

- [x] 18. ProjectOutline 全局大纲 + 拖拽排序

  **What to do**：
  - RED：`src/components/editor/__tests__/ProjectOutline.test.tsx`
    - 拖拽章节 → 顺序交换 + onReorder 回调
    - H1/H2/H3 多层级渲染
    - AI 生成按钮触发和结果渲染
    - 点击标题 → 编辑器定位
  - GREEN：`src/components/editor/ProjectOutline.tsx`
    - 从所有章节构建层级树
    - HTML5 DnD 拖拽排序（蓝色指示线）
    - "AI 生成大纲" 按钮 → `execute("generate_outline", projectContext)` → 返回 Markdown 列表 → 一键应用或逐条确认
    - 点击章节标题 → `editor.chain().scrollIntoView()` 定位

  **Must NOT do**：不生成新章节（仅大纲展示）

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 4，parallel with Tasks 15,16,17，Blocked By Task 3

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/editor/__tests__/ProjectOutline.test.tsx` → PASS
  - [ ] 拖拽排序回调正确；AI 生成大纲卡片显示

  **QA Scenarios**：
  ```
  Scenario: 大纲拖拽
    Tool: Playwright
    Steps: 打开全局大纲 → 拖拽章节 2 到章节 1 上方 → 验证顺序改变
    Evidence: .sisyphus/evidence/task-18-outline-dnd.png
  ```

  **Commit**：YES — `feat(editor): add ProjectOutline with drag-and-drop reorder + AI generation`

- [x] 19. OutlineView 增强

  **What to do**：
  - RED：`src/components/editor/__tests__/OutlineView.test.tsx` — 拖拽回调、多层级渲染
  - GREEN：重构 `src/components/editor/OutlineView.tsx`
    - 改为多层级大纲视图（H1→H2→H3 缩进）
    - 拖拽排序支持（复用 ProjectOutline DnD 模式）
    - 适配新的章节扩展字段

  **Must NOT do**：不删除现有 OutlineView 功能

  **Recommended Agent Profile**：Category `visual-engineering`，Skills []
  **Parallelization**：Wave 4，Sequential，Blocked By Tasks 15,16,17,18

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/editor/__tests__/OutlineView.test.tsx` → PASS

  **Commit**：YES — `feat(editor): enhance OutlineView with multi-level tree + DnD`

---

### Wave 5 — 端到端集成

- [x] 20. Project.tsx 全组件集成

  **What to do**：
  - 注册 ChapterNotes 面板
  - 注册 ProjectOutline（可切换的左侧边栏）
  - 确保 ContextBus 跨组件共享（React Context 或 module singleton）
  - 确保 AISidebar / NovelEditor / ChapterTree 间数据一致
  - 状态：`useReducer` 管理 project-level state（chapters, chatSessions, activeContext）

  **Must NOT do**：不引入新状态管理库

  **Recommended Agent Profile**：Category `deep`，Skills []
  **Parallelization**：Wave 5，Sequential，Blocked By Tasks 9,14,19

  **Acceptance Criteria**：
  - [ ] `npm run build` → PASS
  - [ ] 所有组件渲染正常

  **QA Scenarios**：
  ```
  Scenario: 全局集成
    Tool: Playwright
    Steps: 打开项目 → 验证 AI 面板/编辑器/大纲/章节树全部渲染
           打开 AISidebar → 操作 → 验证编辑器更新
    Evidence: .sisyphus/evidence/task-20-integration.png
  ```

  **Commit**：YES — `feat(project): integrate all Copilot components into Project view`

- [x] 21. AI 编排全链路测试

  **What to do**：
  - RED：`src/components/ai/orchestrator/__tests__/aiservice-integration.test.ts`
    - 测试每个命令的完整链路：prompt → LLM 调用 → result + citations
    - 测试流式输出完整性
    - 测试错误恢复和重试逻辑
  - GREEN：Mock LLM 服务，验证 12 命令全链路

  **Must NOT do**：不调用真实 LLM API

  **Recommended Agent Profile**：Category `deep`，Skills []
  **Parallelization**：Wave 5，Sequential，Blocked By Task 20

  **Acceptance Criteria**：
  - [ ] `npx vitest run src/components/ai/orchestrator/__tests__/aiservice-integration.test.ts` → PASS（12 命令全覆盖）

  **Commit**：YES — `test(ai): full-link AI orchestration tests for all 12 commands`

- [x] 22. UI 细节打磨 + 动效

  **What to do**：
  - Ghost text 脉冲动画（CSS @keyframes）
  - / 命令菜单过渡动画（fade + scale）
  - 选中悬浮栏过渡动画（fade + translate）
  - 章节状态组件过渡
  - 统一间距/配色/圆角
  - 响应式处理

  **Must NOT do**：不改变 pre-laid layout

  **Recommended Agent Profile**：Category `visual-engineering`，Skills ["animation-expert"]
  **Parallelization**：Wave 5，Sequential，Blocked By Task 20

  **Acceptance Criteria**：
  - [ ] 所有动效在 Chromium 无卡顿

  **QA Scenarios**：
  ```
  Scenario: 动效验证
    Tool: Playwright
    Steps: 触发 / 命令 → 验证菜单动画；选中文字 → 验证悬浮栏动画
    Evidence: .sisyphus/evidence/task-22-animations.jpeg
  ```

  **Commit**：YES — `style(ui): polish Copilot interactions with animations + spacing`

- [x] 23. 构建验证 + 错误边界

  **What to do**：
  - 运行 `npx vitest run` → 全测试套件通过
  - 运行 `npx tsc --noEmit` → 无类型错误
  - 运行 `npm run build` → 成功
  - 添加 React ErrorBoundary 包裹关键组件（AISidebar, NovelEditor）

  **Must NOT do**：不修改 build 配置

  **Recommended Agent Profile**：Category `quick`，Skills []
  **Parallelization**：Wave 5，Sequential，Blocked By Tasks 20,21,22

  **Acceptance Criteria**：
  - [ ] `npx vitest run` → 所有测试 PASS
  - [ ] `npm run build` → 成功
  - [ ] ErrorBoundary 渲染正常

  **Commit**：YES — `chore: verify build + add ErrorBoundary wrappers`

---

## Final Verification Wave

> 4 个审查 agent 并行执行。全部 APPROVE 后向用户展示结果。用户确认后标记完成。

- [x] F1. **Plan Compliance Audit** — `oracle`
  逐条检查 Must Have / Must NOT Have。搜索代码查 forbidden 模式。验证 evidence 文件存在。
  输出：`Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  `npx tsc --noEmit` + linter + `npx vitest run`。检查 as any/@ts-ignore, empty catch, console.log, unused imports。
  输出：`Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` + `playwright`
  执行每个 task 的 QA scenarios。测试集成路径。边缘情况：空面板、无选区、AI 错误。
  输出：`Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  对比 "What to do" vs git diff。检查 creep 和 contamination。
  输出：`Tasks [N/N compliant] | Contamination [CLEAN/N] | Unaccounted [CLEAN/N] | VERDICT`

---

## Commit Strategy

按 task 分组提交，每组 1-2 个相关 tasks。

```
Wave 1: chore: add vitest + testing-library infrastructure
       feat(types): extend Chapter + add ChatSession/RAGCitation types
       feat(service): extend chapter CRUD with status/wordGoal/summary/notes
       feat(ai): add ContextBus for unified context management
       feat(ai): add AI Orchestrator + 12 command prompt templates
Wave 2: feat(chat): add @mention system to ChatInput
       feat(chat): add RAG citations + 3-position insert
       feat(chat): add ChatHistory session management
       feat(chat): integrate ContextBus+ChatHistory into AISidebar
       test(chat): full chat flow integration tests
Wave 3: feat(editor): add ghost text ProseMirror Widget Decoration
       feat(editor): add slash command menu + InlineCommand UI
       feat(editor): add selection hover bar
       feat(editor): register slashCommand + ghostText plugins
Wave 4: feat(editor): add chapter status state machine + word goal
       feat(editor): add chapter summary with AI generation
       feat(editor): add ChapterNotes panel
       feat(editor): add ProjectOutline with DnD + AI
       feat(editor): enhance OutlineView with multi-level tree
Wave 5: feat(project): integrate all Copilot components
       test(ai): full-link AI orchestration tests
       style(ui): polish Copilot interactions
       chore: verify build + add ErrorBoundary wrappers
```

---

## Success Criteria

### Verification Commands
```
npx vitest run        → All tests pass
npx tsc --noEmit      → No type errors
npm run build         → Build succeeds
```

### Final Checklist
- [x] 12 种 AI 命令全部可用
- [x] 幽灵文字 Tab/Escape 功能正常
- [x] @ 提及正确解析
- [x] RAG 引用标记可点击跳转
- [x] 三位置插入功能正常
- [x] 聊天历史管理功能正常
- [x] / 命令菜单搜索过滤正确
- [x] 选中悬浮栏显示隐藏正确
- [x] 章节状态机流转正确
- [x] 大纲拖拽排序正常
- [x] 所有测试通过
- [x] Build 成功

