# AI 小说创作 Agent — 桌面应用

## TL;DR

> **Quick Summary**: 构建一个基于 LangChain + RAG + LLM 的桌面端 AI 小说创作助手，支持多模型、项目级上下文检索、人机协写与独立创作，并为后续「作者灵魂」自我训练系统预留架构。
> 
> **Deliverables**:
> - Tauri 桌面应用（React 前端）
> - 富文本小说编辑器 + AI 对话侧边栏
> - LangChain 多模型 LLM 服务（OpenAI / Claude / Ollama）
> - LanceDB 向量 RAG 引擎（项目级上下文检索）
> - 项目管理（创建/切换/删除小说项目）
> - 基础风格配置（temperature、tone 预设）
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: 项目初始化 → LLM 服务 → RAG 引擎 → 编辑器 UI → 集成联调

---

## Context

### Original Request
用户需要创建一个基于 RAG + LLM + 自我训练 Skill 作者灵魂的 AI 小说创作 Agent 软件，运行于桌面环境。

### Interview Summary
**Key Discussions**:
- **桌面框架**: Tauri（轻量、安全、Rust 后端）
- **AI 框架**: LangChain.js — 统一 LLM 接口、RAG 管道、Memory、Chain/Agent 编排
- **LLM 方案**: 混合后端（OpenAI API、Claude API、Ollama 本地模型）
- **向量数据库**: LanceDB（嵌入式、零配置、LangChain 原生集成）
- **前端技术**: React + Tailwind CSS + TypeScript
- **协作模式**: AI 独立创作 + 人机协写（用户写 → AI 续写 / AI 建议 → 用户修改）
- **MVP 范围**: 基础写作编辑器 + LLM 对话/续写 + 简单 RAG + 基础风格配置
- **作者灵魂系统**: Post-MVP（风格提取、持续记忆、可选 LoRA 微调）
- **测试策略**: Agent 自验证（不写传统单元测试）

### Gap Analysis (Self-Review)
- **未确认项已自决**:
  - 富文本编辑器选型 → 默认 TipTap（ProseMirror based，扩展性强）
  - 状态管理 → Zustand（轻量、TS 友好）
  - RAG 分块策略 → 默认按段落 + 滑动窗口
  - Embedding 模型 → 默认 text-embedding-3-small（API 端）/ bge-small（本地端）
  - API Key 存储 → 本地加密文件（不在 Git 中）

---

## Work Objectives

### Core Objective
构建一个可用的桌面端 AI 小说创作助手，用户能创建小说项目、在编辑器中写作、通过 AI 侧边栏获得续写/建议/头脑风暴，AI 能检索当前项目上下文保证一致性。

### Concrete Deliverables
- Tauri 桌面应用安装包（macOS）
- 小说项目管理功能（创建/切换/删除）
- 富文本编辑器（格式工具栏、自动保存）
- AI 对话侧边栏（多轮对话、上下文感知）
- LLM 多提供商切换（OpenAI / Claude / Ollama）
- RAG 引擎（索引小说内容/角色/设定）
- 设置页面（LLM 配置、风格参数）

### Definition of Done
- [ ] `npm run tauri dev` 启动正常
- [ ] 能创建小说项目并在编辑器中写作
- [ ] AI 侧边栏能正常对话和续写
- [ ] RAG 能检索已写内容作为 LLM 上下文
- [ ] 能切换不同 LLM 提供商
- [ ] Agent 自验证全部通过

### Must Have
- 本地运行，不依赖云服务（Ollama 模式）
- 项目数据本地持久化
- AI 生成内容可编辑、可采纳/拒绝
- 基础错误处理和用户提示

### Must NOT Have (Guardrails)
- **不要**在 MVP 中实现微调/训练功能 — 留接口即可
- **不要**实现在线同步/云存储 — 纯本地
- **不要**过度设计抽象层 — MVP 以实用为先
- **不要**在 UI 中使用 emoji（除非用户要求）
- **不要**自动联网搜索 — RAG 仅限本地项目文档
- **不要**在 Rust 后端写 AI 逻辑 — 全在 TS 前端

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO（greenfield 项目）
- **Automated tests**: None
- **Agent-Executed QA**: ALWAYS — 每个任务包含详细 QA 场景

### QA Policy
每个任务包含 Agent 自验证场景：
- **UI**: Playwright 打开应用，操作 UI，截图验证
- **API/服务**: curl / node REPL 验证
- **CLI**: tmux 运行命令验证输出
- **构建**: npm 命令验证编译通过

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 基础设施，MAX PARALLEL):
├── Task 1: Tauri 项目脚手架 + 配置
├── Task 2: React + Vite + Tailwind + 路由
├── Task 3: 核心类型定义 & Zod Schema
├── Task 4: LangChain.js 集成 + LLM Provider 配置
├── Task 5: LanceDB 集成 + 向量存储抽象
└── Task 6: 项目数据模型 + SQLite 持久化

Wave 2 (After Wave 1 — 核心服务，MAX PARALLEL):
├── Task 7: LLM 多提供商服务（depends: 4）
├── Task 8: RAG 引擎 — 文档加载/切片/嵌入/检索（depends: 5, 6）
├── Task 9: 项目管理服务 CRUD（depends: 6）
├── Task 10: 风格配置服务（depends: 4）
└── Task 11: AI 对话/续写编排服务（depends: 7, 8）

Wave 3 (After Waves 1-2 — UI 组件，MAX PARALLEL):
├── Task 12: 富文本写作编辑器（depends: 2）
├── Task 13: AI 对话侧边栏（depends: 11）
├── Task 14: 项目管理页面 UI（depends: 9）
├── Task 15: 设置/配置页面 UI（depends: 7, 10）
└── Task 16: 小说内容导航/大纲视图（depends: 12）

Wave 4 (After Wave 3 — 集成联调):
├── Task 17: 编辑器 ↔ AI 侧边栏联动（depends: 12, 13）
├── Task 18: RAG 上下文注入对话流（depends: 8, 13）
├── Task 19: 端到端流程完善 + 错误处理（depends: 14-18）
└── Task 20: 桌面打包 + Tauri 构建配置（depends: 1, 19）

Wave FINAL（4 个审查代理并行 → 等待用户确认）:
├── Task F1: 计划合规审计
├── Task F2: 代码质量审查
├── Task F3: 实际 QA 执行
└── Task F4: 范围保真度检查
```

> **Critical Path**: Task 1 → Task 4 → Task 7 → Task 11 → Task 13 → Task 17 → Task 19 → Task 20 → F1-F4
> **Parallel Speedup**: ~65% faster than sequential
> **Max Concurrent**: 6 (Wave 1)

---

## TODOs

- [x] 1. Tauri 项目脚手架 + 基础配置

  **What to do**:
  - 使用 `npm create tauri-app@latest` 初始化项目（选 React + TypeScript + Vite 模板）
  - 配置 `src-tauri/tauri.conf.json`：窗口标题「AI Novel Agent」、默认尺寸 1280x800、最小尺寸 900x600
  - 配置 `src-tauri/Cargo.toml`：添加 `tauri-plugin-sql`（SQLite）和 `tauri-plugin-fs`（文件系统）依赖
  - 配置 `src-tauri/src/main.rs`：注册 SQL 和 FS 插件
  - 验证：`npm run tauri dev` 能正常启动空白窗口

  **Must NOT do**:
  - 不要添加任何 AI 逻辑到 Rust 层
  - 不要配置自动更新

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
  - **Reason**: 纯脚手架操作，标准 Tauri CLI 命令

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（with Tasks 2-6）
  - **Blocks**: Task 20
  - **Blocked By**: None

  **References**:
  - Tauri 官方文档: `https://v2.tauri.app/start/create-project/` — 项目初始化指南
  - Plugin SQL: `https://v2.tauri.app/plugin/sql/` — SQLite 插件用法

  **Acceptance Criteria**:
  - [ ] `npm run tauri dev` 正常启动窗口
  - [ ] `src-tauri/tauri.conf.json` 包含正确窗口配置
  - [ ] `src-tauri/Cargo.toml` 包含 sql 和 fs 插件

  **QA Scenarios (MANDATORY)**:
  ```
  Scenario: Tauri 应用能成功启动并显示窗口
    Tool: interactive_bash (tmux)
    Preconditions: 项目根目录，依赖已安装
    Steps:
      1. 运行: npm run tauri dev
      2. 等待窗口出现
      3. 使用 screenshot 工具截取窗口
    Expected Result: 窗口标题为 "AI Novel Agent"，无报错
    Failure Indicators: 窗口未出现、控制台有 error 日志
    Evidence: .sisyphus/evidence/task-1-startup.png

  Scenario: 构建配置正确（检查模式）
    Tool: Bash
    Preconditions: 项目已初始化
    Steps:
      1. 运行: cargo check --manifest-path src-tauri/Cargo.toml
      2. 验证无编译错误
    Expected Result: exit code 0，无 error 输出
    Failure Indicators: 编译错误、依赖缺失
    Evidence: .sisyphus/evidence/task-1-cargo-check.txt
  ```

  **Commit**: YES
  - Message: `chore: init Tauri project with React + TypeScript + Vite`
  - Files: `src-tauri/`, `package.json`, `tsconfig.json`, `vite.config.ts`

- [x] 2. React + Vite + Tailwind CSS + 路由 + 状态管理

  **What to do**:
  - 确认 Vite + React + TypeScript 配置正确（Task 1 模板自带）
  - 安装并配置 Tailwind CSS v3：`tailwind.config.js` 指向 `./src/**/*.{ts,tsx}`
  - 创建 `src/index.css`：`@tailwind base/components/utilities`
  - 安装 `react-router-dom`，创建路由结构：`/`（项目管理）、`/project/:id`（编辑器）、`/settings`（设置）
  - 安装 `zustand`，创建全局 store 骨架（后续任务填充）
  - 创建 `src/components/Layout.tsx`：侧边导航 + 主内容区
  - 创建 `src/App.tsx`：路由配置 + Layout 包裹

  **Must NOT do**:
  - 不要写具体的业务组件 — 只搭骨架
  - 不要添加主题切换或暗色模式 — 先做亮色

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`
  - **Reason**: 前端 UI 框架搭建，需要视觉布局判断

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（with Tasks 1, 3-6）
  - **Blocks**: Tasks 12-16
  - **Blocked By**: Task 1

  **References**:
  - Tailwind CSS 安装: `https://tailwindcss.com/docs/guides/vite` — Vite 集成步骤
  - React Router v6: `https://reactrouter.com/en/main/start/tutorial` — 路由配置
  - Zustand: `https://docs.pmnd.rs/zustand/getting-started/introduction` — store 创建

  **Acceptance Criteria**:
  - [ ] `npm run dev` 前端热更新正常
  - [ ] 访问 `/` `/project/test` `/settings` 三个路由不报错
  - [ ] Tailwind 样式类在组件中生效

  **QA Scenarios**:
  ```
  Scenario: 前端开发服务器正常启动 + 路由可用
    Tool: Playwright
    Preconditions: npm install 完成
    Steps:
      1. 启动: npm run dev
      2. Playwright 打开 http://localhost:5173/
      3. 断言: 页面包含 Layout 组件（侧边导航可见）
      4. 导航到 /settings
      5. 断言: URL 变为 /settings，页面不白屏
    Expected Result: 两个路由均渲染正常，无 console error
    Failure Indicators: 白屏、路由跳转失败、console error
    Evidence: .sisyphus/evidence/task-2-routes.png
  ```

  **Commit**: YES
  - Message: `feat: setup React routing, Tailwind CSS, and Zustand store skeleton`
  - Files: `src/App.tsx`, `src/main.tsx`, `tailwind.config.js`, `src/index.css`, `src/components/Layout.tsx`, package 相关文件

- [x] 3. 核心类型定义 & Zod Schema

  **What to do**:
  - 创建 `src/types/novel.ts`：`NovelProject`（id, title, description, createdAt, updatedAt）、`Chapter`（id, projectId, title, content, order）、`Character`（id, projectId, name, description, traits）、`WorldSetting`（id, projectId, name, description, category）
  - 创建 `src/types/llm.ts`：`LLMProvider`（openai | anthropic | ollama）、`LLMConfig`（provider, apiKey?, modelName, baseUrl?, temperature, maxTokens）、`ChatMessage`（role, content, timestamp）
  - 创建 `src/types/rag.ts`：`RAGDocument`（id, projectId, content, metadata, embedding?）、`SearchResult`（document, score）
  - 创建 `src/schemas/index.ts`：用 Zod 定义所有类型的校验 schema
  - 导出统一的 `index.ts` barrel

  **Must NOT do**:
  - 不要包含业务逻辑
  - 不要对字段做过度设计 — 保持 MVP 够用

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`
  - **Reason**: 纯类型定义，标准 TypeScript 工作

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（with Tasks 1-2, 4-6）
  - **Blocks**: Tasks 4-11
  - **Blocked By**: None

  **References**:
  - Zod: `https://zod.dev/?id=basic-usage` — schema 定义语法
  - TypeScript 类型导出: Barrel export pattern — `export * from './novel'`

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` 类型检查通过
  - [ ] 所有 Zod schema 可通过 `.parse()` 校验合法数据
  - [ ] 类型文件 barrel 导出正确

  **QA Scenarios**:
  ```
  Scenario: 类型定义 + Zod schema 编译和校验正确
    Tool: Bash (node REPL)
    Preconditions: 类型文件已创建
    Steps:
      1. 运行: npx tsc --noEmit
      2. 断言: exit code 0
      3. 运行: node -e "
         const { NovelProjectSchema } = require('./src/schemas');
         const result = NovelProjectSchema.parse({
           id: 'test', title: 'Test', description: '',
           createdAt: Date.now(), updatedAt: Date.now()
         });
         console.log('PASS:', result.title);
       "
    Expected Result: tsc 无错误，Zod parse 成功
    Failure Indicators: 类型错误、parse 抛异常
    Evidence: .sisyphus/evidence/task-3-types-check.txt
  ```

  **Commit**: YES
  - Message: `feat: add core TypeScript types and Zod validation schemas`
  - Files: `src/types/*.ts`, `src/schemas/*.ts`

- [x] 4. LangChain.js 集成 + LLM Provider 配置

  **What to do**:
  - 安装依赖：`langchain` `@langchain/core` `@langchain/openai` `@langchain/anthropic` `@langchain/community`（Ollama）
  - 创建 `src/services/llm/config.ts`：`LLMProviderConfig` — 管理各提供商的 API key、base URL、默认模型
  - 创建 `src/services/llm/factory.ts`：`createLLM(config: LLMConfig)` — 根据 provider 类型返回对应的 LangChain ChatModel 实例
  - 支持三种 provider：`openai`（ChatOpenAI）、`anthropic`（ChatAnthropic）、`ollama`（ChatOllama）
  - 创建 `src/services/llm/index.ts`：barrel 导出
  - API key 从环境变量或本地配置文件读取（不硬编码）

  **Must NOT do**:
  - 不要在代码中硬编码 API key
  - 不要实现聊天逻辑 — 只是创建模型实例

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
  - **Reason**: 需要理解 LangChain API 和多提供商差异

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（with Tasks 1-3, 5-6）
  - **Blocks**: Task 7, Task 10
  - **Blocked By**: None（类型定义在 Task 3 但可独立创建）

  **References**:
  - LangChain.js Chat Models: `https://js.langchain.com/docs/integrations/chat/` — 各 provider 用法
  - ChatOpenAI: `https://js.langchain.com/docs/integrations/chat/openai`
  - ChatOllama: `https://js.langchain.com/docs/integrations/chat/ollama`

  **Acceptance Criteria**:
  - [ ] `createLLM({ provider: 'openai' })` 返回 ChatOpenAI 实例
  - [ ] `createLLM({ provider: 'ollama' })` 返回 ChatOllama 实例
  - [ ] 类型检查通过，无 `any`

  **QA Scenarios**:
  ```
  Scenario: LLM factory 正确创建各提供商实例
    Tool: Bash (node REPL)
    Preconditions: 依赖已安装
    Steps:
      1. 运行: node -e "
         const { createLLM } = require('./src/services/llm');
         const openaiModel = createLLM({ provider: 'openai', modelName: 'gpt-4o-mini' });
         const ollamaModel = createLLM({ provider: 'ollama', modelName: 'llama3' });
         console.log('OpenAI model:', openaiModel.constructor.name);
         console.log('Ollama model:', ollamaModel.constructor.name);
       "
      2. 断言: 输出包含 'ChatOpenAI' 和 'ChatOllama'
    Expected Result: 两个模型实例正确创建，类型正确
    Failure Indicators: 报错、实例化失败、类型不匹配
    Evidence: .sisyphus/evidence/task-4-llm-factory.txt
  ```

  **Commit**: YES
  - Message: `feat: integrate LangChain.js with multi-provider LLM factory`
  - Files: `src/services/llm/*.ts`, `package.json`

- [x] 5. LanceDB 集成 + 向量存储抽象层

  **What to do**:
  - 安装依赖：`vectordb`（LanceDB Node.js SDK，即 `@lancedb/lancedb`）
  - 创建 `src/services/rag/vectorstore.ts`：封装 LanceDB 连接、表创建、文档插入、向量检索
  - 实现 `VectorStore` 类：`init(dbPath)`、`createTable(name)`、`addDocuments(docs)`、`search(query, topK)`
  - 表结构：id、content（text）、vector（float array）、metadata（JSON string）
  - 项目隔离：每个 NovelProject 一个独立的 LanceDB table

  **Must NOT do**:
  - 不要在此任务中写 embedding 逻辑 — 那是 Task 8

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`
  - **Reason**: 需要理解向量数据库和 Node.js 原生模块

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（with Tasks 1-4, 6）
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:
  - LanceDB JS SDK: `https://lancedb.github.io/lancedb/javascript/`

  **Acceptance Criteria**:
  - [ ] LanceDB 连接成功，表创建/插入/检索正常
  - [ ] 检索结果按 score 降序排列

  **QA Scenarios**:
  ```
  Scenario: LanceDB 基本 CRUD 和检索
    Tool: Bash (node REPL)
    Steps:
      1. 初始化 VectorStore，创建表 "test_novel"
      2. 插入 3 条文档（带假 embedding 向量）
      3. 执行 search 查询
      4. 断言: 返回结果数 ≤ topK，按 score 排序
    Expected Result: 插入和检索均成功
    Evidence: .sisyphus/evidence/task-5-lancedb.txt
  ```

  **Commit**: YES
  - Message: `feat: integrate LanceDB vector store abstraction`
  - Files: `src/services/rag/vectorstore.ts`, `package.json`

- [x] 6. 项目数据模型 + SQLite 持久化

  **What to do**:
  - 使用 Tauri SQL plugin（`@tauri-apps/plugin-sql`）封装 SQLite 操作
  - 创建 `src/services/storage/database.ts`：数据库初始化 + 表迁移
  - 创建表：`projects`、`chapters`、`characters`、`world_settings`
  - 创建 `src/services/storage/projects.ts`：ProjectRepository CRUD
  - 数据路径：`$APP_DATA/novel-agent/`（Tauri 标准路径）

  **Must NOT do**:
  - 不要在此任务实现 RAG 索引

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1（with Tasks 1-5）
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 1

  **References**:
  - Tauri SQL Plugin: `https://v2.tauri.app/plugin/sql/`

  **Acceptance Criteria**:
  - [ ] 数据库文件在正确路径创建
  - [ ] 四张表 schema 正确
  - [ ] ProjectRepository CRUD 正常

  **QA Scenarios**:
  ```
  Scenario: SQLite CRUD 流程
    Tool: Bash
    Steps:
      1. 应用启动后验证 .db 文件存在
      2. 调用 ProjectRepository.create 和 getAll
      3. 断言: 返回数组包含刚创建的项目
    Expected Result: 数据库 + CRUD 均正常
    Evidence: .sisyphus/evidence/task-6-sqlite.txt
  ```

  **Commit**: YES
  - Message: `feat: SQLite persistence for projects/chapters/characters/settings`
  - Files: `src/services/storage/*.ts`

- [x] 7. LLM 多提供商对话服务

  **What to do**:
  - 创建 `src/services/llm/chat.ts`：`ChatService` 类
  - 基于 Task 4 factory，实现：`sendMessage`（非流式）、`streamMessage`（流式）、`continueWriting`（续写模式）
  - system prompt：小说创作助手角色定义
  - 统一错误处理：API key 缺失、网络错误、模型不可用

  **Must NOT do**:
  - 不处理 RAG 上下文注入（Task 18）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2（with Tasks 8-11）
  - **Blocks**: Task 11
  - **Blocked By**: Task 4

  **References**:
  - LangChain Chat Models: `https://js.langchain.com/docs/how_to/chat_models/`
  - Streaming: `https://js.langchain.com/docs/how_to/streaming/`

  **Acceptance Criteria**:
  - [ ] `sendMessage` 返回正确 AI 回复
  - [ ] `streamMessage` 逐 token 输出
  - [ ] 无效 API key 返回友好错误

  **QA Scenarios**:
  ```
  Scenario: 对话和续写功能正常
    Tool: Bash (node REPL)
    Steps:
      1. sendMessage("你好，请用一句话介绍自己") → 断言非空
      2. streamMessage 同上 → 断言多 chunk 输出
      3. continueWriting("他推开门，看到") → 断言返回续写内容
    Expected Result: 三个模式均正常
    Evidence: .sisyphus/evidence/task-7-chat.txt
  ```

  **Commit**: YES
  - Message: `feat: LLM chat service with streaming and continuation`
  - Files: `src/services/llm/chat.ts`

- [x] 8. RAG 引擎 — 文档加载/切片/嵌入/检索

  **What to do**:
  - 创建 `src/services/rag/engine.ts`：`RAGEngine` 类
  - LangChain 管道：`RecursiveCharacterTextSplitter`（chunkSize=500, overlap=50）→ Embeddings → LanceDB
  - 实现：`indexProject(projectId, content)`、`searchProject(projectId, query, topK)`
  - 实现：`indexCharacter`/`searchCharacters`、`indexWorldSetting`/`searchWorldSettings`
  - Embedding 模型：API 用 `OpenAIEmbeddings`，本地用 `OllamaEmbeddings`

  **Must NOT do**:
  - 不要在每次检索时重新索引

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`
  - **Reason**: RAG 管道需要深入理解 LangChain 链式调用

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2（with Tasks 7, 9-11）
  - **Blocks**: Tasks 11, 18
  - **Blocked By**: Tasks 5, 6

  **References**:
  - Text Splitters: `https://js.langchain.com/docs/how_to/recursive_text_splitter/`
  - Embeddings: `https://js.langchain.com/docs/integrations/text_embedding/`

  **Acceptance Criteria**:
  - [ ] 测试文本索引后检索结果语义相关
  - [ ] 角色和世界设定检索独立工作

  **QA Scenarios**:
  ```
  Scenario: RAG 索引 + 检索端到端
    Tool: Bash (node REPL)
    Steps:
      1. 索引文本："主角李明在青云山修炼十年"
      2. 检索 "剑客修炼" → 断言包含 "李明" 相关内容、score > 0
    Expected Result: 检索结果语义匹配
    Evidence: .sisyphus/evidence/task-8-rag.txt
  ```

  **Commit**: YES
  - Message: `feat: RAG engine with chunking, embedding, and LanceDB retrieval`
  - Files: `src/services/rag/engine.ts`

- [x] 9. 项目管理服务 CRUD

  **What to do**:
  - 创建 `src/services/project/manager.ts`：`ProjectManager` 类
  - 封装完整项目管理逻辑：
    - `createProject(title, description)`: 创建项目 + 初始化 SQLite 记录 + 创建 LanceDB table
    - `getAllProjects()`: 获取所有项目列表
    - `getProject(projectId)`: 获取单个项目详情（含章节列表）
    - `updateProject(projectId, data)`: 更新项目信息
    - `deleteProject(projectId)`: 级联删除（SQLite + LanceDB）
  - 创建 `src/services/project/chapters.ts`：`ChapterService` — 章节 CRUD + 排序
  - 章节内容变更后触发 RAG 重新索引

  **Must NOT do**:
  - 不要写 UI 组件

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2（with Tasks 7-8, 10-11）
  - **Blocks**: Task 14
  - **Blocked By**: Task 6

  **Acceptance Criteria**:
  - [ ] 创建/查询/更新/删除项目全流程正常
  - [ ] 删除项目时关联数据级联清理
  - [ ] 章节内容更新后 RAG 索引刷新

  **QA Scenarios**:
  ```
  Scenario: 项目全生命周期
    Tool: Bash (node REPL)
    Steps:
      1. createProject("测试小说") → 断言返回项目对象
      2. getAllProjects() → 断言数组包含创建的项目
      3. addChapter(projectId, "第一章", "内容...") → 断言章节创建成功
      4. deleteProject(projectId) → 断言删除成功且无残留
    Expected Result: 全流程无报错
    Evidence: .sisyphus/evidence/task-9-project-crud.txt
  ```

  **Commit**: YES
  - Message: `feat: project management service with CRUD and chapter handling`
  - Files: `src/services/project/*.ts`

- [x] 10. 风格配置服务

  **What to do**:
  - 创建 `src/services/style/config.ts`：`StyleConfigService` 类
  - 管理全局风格参数：
    - `temperature`（0-2，默认 0.8）
    - `maxTokens`（输出最大长度）
    - `tone`（tone preset：严肃/轻松/悬疑/浪漫）
    - `pov`（视角：第一人称/第三人称）
  - 存储：JSON 文件持久化在 `$APP_DATA/novel-agent/style-config.json`
  - 支持项目级 override（每个项目可覆盖全局风格）
  - 提供 `getStylePrompt(config)`：将配置转为 system prompt 片段

  **Must NOT do**:
  - 不要在此任务实现风格提取（那是 post-MVP）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2（with Tasks 7-9, 11）
  - **Blocks**: Task 15
  - **Blocked By**: Task 4

  **Acceptance Criteria**:
  - [ ] 风格配置可读写持久化
  - [ ] 项目级配置可覆盖全局配置
  - [ ] `getStylePrompt` 返回格式正确的 prompt 片段

  **QA Scenarios**:
  ```
  Scenario: 风格配置读写和 prompt 生成
    Tool: Bash (node REPL)
    Steps:
      1. saveConfig({ temperature: 0.7, tone: '悬疑' })
      2. loadConfig() → 断言返回保存的配置
      3. getStylePrompt(config) → 断言返回非空字符串包含 "悬疑"
    Expected Result: 读写一致，prompt 生成正确
    Evidence: .sisyphus/evidence/task-10-style-config.txt
  ```

  **Commit**: YES
  - Message: `feat: style configuration service with persistence and prompt generation`
  - Files: `src/services/style/config.ts`

- [x] 11. AI 对话/续写编排服务

  **What to do**:
  - 创建 `src/services/ai/orchestrator.ts`：`AIOrchestrator` 类
  - 编排 LLM 对话 + RAG 上下文 + 风格配置：
    - `chat(projectId, userMessage, history)`: 1. RAG 检索相关上下文 2. 拼接风格 prompt 3. 调用 LLM
    - `continueWriting(projectId, beforeText, afterHint?)`: 续写模式
    - `brainstorm(projectId, topic)`: 头脑风暴 — 偏创意性的高 temperature 生成
  - 对话历史管理：在内存中维护最近 N 轮对话
  - 流式和非流式双模式

  **Must NOT do**:
  - 不要写 UI 组件

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`
  - **Reason**: 多服务编排需要仔细的状态管理

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖多个上游）
  - **Parallel Group**: Wave 2 末尾
  - **Blocks**: Tasks 13, 17, 18
  - **Blocked By**: Tasks 7, 8

  **Acceptance Criteria**:
  - [ ] chat 模式下 RAG 上下文正确注入
  - [ ] continueWriting 返回流畅续写
  - [ ] 对话历史在内存中正确维护

  **QA Scenarios**:
  ```
  Scenario: 编排服务端到端流程
    Tool: Bash (node REPL)
    Steps:
      1. 预设项目 + RAG 索引："主角李明的武器是青云剑"
      2. chat(projectId, "李明的武器是什么？") → 断言回复提及 "青云剑"
      3. continueWriting(projectId, "李明拔出") → 断言续写长度 > 20 字符
    Expected Result: RAG 上下文生效，续写连贯
    Evidence: .sisyphus/evidence/task-11-orchestrator.txt
  ```

  **Commit**: YES
  - Message: `feat: AI orchestrator combining LLM, RAG, and style config`
  - Files: `src/services/ai/orchestrator.ts`

- [x] 12. 富文本写作编辑器（TipTap）

  **What to do**:
  - 安装：`@tiptap/react` `@tiptap/starter-kit` `@tiptap/extension-placeholder` `@tiptap/extension-character-count`
  - 创建 `src/components/editor/NovelEditor.tsx`：
    - TipTap 编辑器实例，配置基础扩展（Bold/Italic/Heading/Paragraph/Undo）
    - 字数统计（character-count 扩展）
    - placeholder："开始书写你的故事..."
    - 自动保存：3 秒无输入后自动保存到 SQLite
  - 创建 `src/components/editor/EditorToolbar.tsx`：格式工具栏（B/I/H1/H2 按钮）
  - 创建 `src/components/editor/ChapterNav.tsx`：左侧章节列表，点击切换章节
  - 编辑器状态同步到 Zustand store

  **Must NOT do**:
  - 不要在此任务连接 AI 侧边栏 — Task 17 负责

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`
  - **Reason**: 富文本编辑器 UI 需要视觉精确度和交互体验判断

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3（with Tasks 13-16）
  - **Blocks**: Tasks 16, 17
  - **Blocked By**: Task 2

  **References**:
  - TipTap React: `https://tiptap.dev/docs/editor/getting-started/install/react`
  - TipTap Extensions: `https://tiptap.dev/docs/editor/extensions`

  **Acceptance Criteria**:
  - [ ] 编辑器可正常输入和格式化文本
  - [ ] 自动保存功能正常（3 秒 debounce）
  - [ ] 章节切换后编辑器内容正确更新

  **QA Scenarios**:
  ```
  Scenario: 编辑器输入 + 格式化 + 自动保存
    Tool: Playwright
    Steps:
      1. 打开 /project/:id 页面
      2. 在编辑器中输入 "第一章内容测试"
      3. 选中文字，点击 Bold 按钮 → 断言文字变粗
      4. 等待 4 秒（自动保存触发）
      5. 刷新页面 → 断言编辑器内容仍在
    Expected Result: 输入持久化，格式化生效
    Failure Indicators: 内容丢失、格式按钮无反应
    Evidence: .sisyphus/evidence/task-12-editor.png

  Scenario: 章节切换
    Tool: Playwright
    Steps:
      1. 创建 2 个章节
      2. 在章节 1 输入 "第一章"
      3. 点击章节 2 → 断言编辑器清空
      4. 在章节 2 输入 "第二章"
      5. 切回章节 1 → 断言显示 "第一章"
    Expected Result: 章节内容正确隔离
    Evidence: .sisyphus/evidence/task-12-chapter-switch.png
  ```

  **Commit**: YES
  - Message: `feat: TipTap rich text editor with auto-save and chapter navigation`
  - Files: `src/components/editor/*.tsx`

- [x] 13. AI 对话侧边栏 UI

  **What to do**:
  - 创建 `src/components/ai/AISidebar.tsx`：固定在右侧的侧边栏面板（可折叠）
  - 创建 `src/components/ai/ChatMessages.tsx`：对话气泡列表（用户/AI 区分样式）
  - 创建 `src/components/ai/ChatInput.tsx`：消息输入框 + 发送按钮 + 续写/头脑风暴模式切换
  - 集成 `AIOrchestrator`：发送消息 → 流式显示回复 → 消息历史滚动
  - 显示当前使用的模型名称和温度参数

  **Must NOT do**:
  - 不要在此任务处理上下文注入 UI — Task 18 负责

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3（with Tasks 12, 14-16）
  - **Blocks**: Task 17
  - **Blocked By**: Task 11

  **Acceptance Criteria**:
  - [ ] 对话消息可发送和接收（流式显示）
  - [ ] 续写和头脑风暴模式可切换
  - [ ] 侧边栏可折叠/展开

  **QA Scenarios**:
  ```
  Scenario: AI 对话流式交互
    Tool: Playwright
    Steps:
      1. 打开项目编辑器页面
      2. 在 AI 侧边栏输入 "帮我写一个开场" 并发送
      3. 断言: 回复逐字显示（流式效果）
      4. 切换到 "续写" 模式 → 断言输入框 placeholder 变化
    Expected Result: 对话流式正常，模式切换生效
    Evidence: .sisyphus/evidence/task-13-chat.png
  ```

  **Commit**: YES
  - Message: `feat: AI chat sidebar with streaming, continuation, and brainstorm modes`
  - Files: `src/components/ai/*.tsx`

- [x] 14. 项目管理页面 UI

  **What to do**:
  - 创建 `src/pages/ProjectList.tsx`（路由 `/`）：
    - 项目卡片网格：显示标题、描述摘要、章节数、最后编辑时间
    - "新建项目"按钮 → 弹窗输入标题和描述
    - 点击项目卡片 → 导航到 `/project/:id`
    - 删除按钮（带确认弹窗）
  - 创建 `src/components/project/ProjectCard.tsx`
  - 创建 `src/components/project/CreateProjectModal.tsx`

  **Must NOT do**:
  - 不要在此页面放编辑器 — 那是 `/project/:id` 的事

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3（with Tasks 12-13, 15-16）
  - **Blocks**: Task 19
  - **Blocked By**: Task 9

  **Acceptance Criteria**:
  - [ ] 项目列表正确显示已有项目
  - [ ] 新建和删除操作正常
  - [ ] 点击卡片正确导航

  **QA Scenarios**:
  ```
  Scenario: 项目管理 UI 流程
    Tool: Playwright
    Steps:
      1. 打开 http://localhost:5173/
      2. 点击 "新建项目" → 输入标题 → 确认
      3. 断言: 列表中出现新项目卡片
      4. 点击删除按钮 → 确认 → 断言卡片消失
    Expected Result: 新建和删除 UI 正常
    Evidence: .sisyphus/evidence/task-14-project-list.png
  ```

  **Commit**: YES
  - Message: `feat: project list page with create and delete`
  - Files: `src/pages/ProjectList.tsx`, `src/components/project/*.tsx`

- [x] 15. 设置/配置页面 UI

  **What to do**:
  - 创建 `src/pages/Settings.tsx`（路由 `/settings`）：
    - LLM Provider 选择（OpenAI / Anthropic / Ollama 下拉）
    - API Key 输入（password 类型，本地存储）
    - 模型名称输入（或下拉选择常用模型）
    - Temperature 滑块（0-2，步长 0.1）
    - 风格预设选择（严肃/轻松/悬疑/浪漫）
    - Base URL（Ollama 本地地址等）
  - 配置变更实时保存到 localStorage + JSON 文件

  **Must NOT do**:
  - 不要将 API key 打印到 console 或日志

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3（with Tasks 12-14, 16）
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 7, 10

  **Acceptance Criteria**:
  - [ ] 所有配置项可编辑和保存
  - [ ] 切换 Provider 后对话功能使用新配置
  - [ ] API key 不以明文存储在可访问位置

  **QA Scenarios**:
  ```
  Scenario: 设置页面配置流程
    Tool: Playwright
    Steps:
      1. 导航到 /settings
      2. 选择 Provider: Ollama，设置 Base URL: http://localhost:11434
      3. 设置 Temperature: 1.2
      4. 选择风格: 悬疑
      5. 刷新页面 → 断言所有设置保持不变
    Expected Result: 配置持久化正确
    Evidence: .sisyphus/evidence/task-15-settings.png
  ```

  **Commit**: YES
  - Message: `feat: settings page for LLM provider, style, and API key configuration`
  - Files: `src/pages/Settings.tsx`

- [x] 16. 小说内容导航/大纲视图

  **What to do**:
  - 在编辑器页面左侧添加章节树形导航面板
  - 创建 `src/components/editor/ChapterTree.tsx`：
    - 章节列表（可拖拽排序）
    - 当前选中章节高亮
    - 新增章节按钮
    - 每个章节显示字数统计
  - 创建 `src/components/editor/OutlineView.tsx`：
    - 基于编辑器 heading 自动生成大纲
    - 点击大纲项跳转到对应位置

  **Must NOT do**:
  - 不要实现复杂的拖拽动画 — 简单可排序即可

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3（with Tasks 12-15）
  - **Blocks**: Task 19
  - **Blocked By**: Task 12

  **Acceptance Criteria**:
  - [ ] 章节列表正确渲染
  - [ ] 点击章节切换编辑器内容
  - [ ] 大纲自动从 heading 生成

  **QA Scenarios**:
  ```
  Scenario: 章节导航和大纲视图
    Tool: Playwright
    Steps:
      1. 在编辑器中输入 "# 第一章"、换行、"## 第一节"、换行、"内容"
      2. 切换到 OutlineView → 断言显示 "第一章" 和 "第一节"
      3. 点击 "第一节" → 断言编辑器滚动到对应位置
    Expected Result: 大纲正确生成，跳转正常
    Evidence: .sisyphus/evidence/task-16-outline.png
  ```

  **Commit**: YES
  - Message: `feat: chapter tree navigation and heading outline view`
  - Files: `src/components/editor/ChapterTree.tsx`, `src/components/editor/OutlineView.tsx`

- [x] 17. 编辑器 ↔ AI 侧边栏联动

  **What to do**:
  - 实现编辑器内容选中 → AI 侧边栏快捷操作：
    - "续写"：获取选中内容前 500 字符，调用 AI 续写，结果插入光标位置
    - "润色"：选中文字 → AI 优化文笔后替换
    - "扩写"：选中段落 → AI 展开细节
  - 在编辑器顶部添加 AI 快捷按钮栏
  - 实现 AI 生成内容可接受/拒绝（diff 对比样式）

  **Must NOT do**:
  - 不要改编辑器核心功能（TipTap extensions）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖 Task 12, 13）
  - **Parallel Group**: Wave 4（with Tasks 18-20）
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 12, 13

  **Acceptance Criteria**:
  - [ ] "续写"按钮能获取光标前文并产生续写
  - [ ] "润色"替换选中文字
  - [ ] AI 内容可接受/拒绝

  **QA Scenarios**:
  ```
  Scenario: 编辑器与 AI 联动
    Tool: Playwright
    Steps:
      1. 在编辑器中输入 "他站在门口，" 
      2. 点击 AI 工具栏 "续写"
      3. 断言: 编辑器中出现新内容（在 "他站在门口，" 之后）
      4. 选中一段文字 → 点击 "润色"
      5. 断言: AI 返回润色建议，可点击接受或拒绝
    Expected Result: 联动按钮正常工作
    Evidence: .sisyphus/evidence/task-17-editor-ai-link.png
  ```

  **Commit**: YES
  - Message: `feat: editor-AI sidebar integration with continue/polish/expand`
  - Files: `src/components/editor/*.tsx`, `src/components/ai/*.tsx`

- [x] 18. RAG 上下文注入对话流

  **What to do**:
  - 在 `AIOrchestrator.chat()` 中集成 RAG 检索结果：
    - 检索当前项目相关上下文（章节、角色、世界设定）
    - 将检索结果格式化为 system message 的一部分
    - 控制上下文窗口（限制注入 token 数）
  - 对话时显示当前使用的参考源（UI 提示 "引用了 3 个相关段落"）
  - 实现章节变动后的增量重新索引

  **Must NOT do**:
  - 不要实现向量数据库的版本管理

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4（with Tasks 17, 19-20）
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 8, 13

  **Acceptance Criteria**:
  - [ ] 对话时能引用项目上下文
  - [ ] 上下文注入不导致 token 超限
  - [ ] 增量索引正确更新

  **QA Scenarios**:
  ```
  Scenario: RAG 上下文注入效果
    Tool: Playwright
    Steps:
      1. 项目中已索引内容："主角李明的武器是青云剑"
      2. 在 AI 侧边栏问 "李明的武器是什么？"
      3. 断言: AI 回复提及 "青云剑"
      4. 断言: UI 显示 "引用了 N 个相关段落"
    Expected Result: RAG 上下文生效，可见引用提示
    Evidence: .sisyphus/evidence/task-18-rag-context.png
  ```

  **Commit**: YES
  - Message: `feat: RAG context injection into chat with incremental re-indexing`
  - Files: `src/services/ai/orchestrator.ts`, `src/components/ai/*.tsx`

- [x] 19. 端到端流程完善 + 错误处理 + 边界状态

  **What to do**:
  - 覆盖所有页面/模块的错误状态：
    - LLM 连接失败 → Toast 提示 + 重试按钮
    - API key 未配置 → 引导去设置页
    - Ollama 离线 → 建议检查本地服务
    - 空项目列表 → 引导创建第一个项目
    - 编辑器无内容 → 显示开始写作引导
  - 加载状态骨架屏（Skeleton）
  - 统一 Toast/Notification 组件
  - 全局错误边界（React ErrorBoundary）
  - 路由守卫：直接访问 `/project/:id` 时检查项目是否存在

  **Must NOT do**:
  - 不要添加分析或埋点
  - 不要添加多语言 i18n

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖所有上游 UI/Service）
  - **Parallel Group**: Wave 4 末尾
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 14-18

  **Acceptance Criteria**:
  - [ ] 所有错误场景有用户可见提示
  - [ ] 空状态引导正确显示
  - [ ] Toast 通知系统工作正常

  **QA Scenarios**:
  ```
  Scenario: 错误状态覆盖
    Tool: Playwright
    Steps:
      1. 清空 API key → 发送 AI 消息 → 断言 Toast "请先配置 API Key"
      2. 删除所有项目 → 断言页面显示 "创建你的第一个项目" 引导
      3. 手动断开网络 → 发送 AI 消息 → 断言错误提示有重试按钮
    Expected Result: 所有错误状态有合理提示
    Evidence: .sisyphus/evidence/task-19-error-states.png
  ```

  **Commit**: YES
  - Message: `feat: error handling, loading states, empty states, and toast notifications`
  - Files: `src/components/common/*.tsx`, `src/pages/*.tsx`

- [x] 20. 桌面打包 + Tauri 构建配置

  **What to do**:
  - 配置 `src-tauri/tauri.conf.json`：应用 ID、版本、图标、安全策略
  - 配置 `src-tauri/bundle`：macOS dmg 打包参数
  - 添加应用图标（256x256 png → ico/icns）
  - 构建命令：`npm run tauri build`
  - 验证生产包能正常运行

  **Must NOT do**:
  - 不要配置自动更新
  - 不要签名证书配置（本地开发用）

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 最后
  - **Blocks**: Final Verification
  - **Blocked By**: Task 19

  **Acceptance Criteria**:
  - [ ] `npm run tauri build` 成功生成 .dmg 文件
  - [ ] 安装后应用能正常启动

  **QA Scenarios**:
  ```
  Scenario: 桌面打包验证
    Tool: Bash
    Steps:
      1. 运行: npm run tauri build
      2. 断言: src-tauri/target/release/bundle/dmg/*.dmg 文件存在
      3. 挂载 dmg，启动应用 → 断言窗口正常打开
    Expected Result: dmg 成功生成且可用
    Evidence: .sisyphus/evidence/task-20-build.txt
  ```

  **Commit**: YES
  - Message: `chore: Tauri build configuration and macOS packaging`
  - Files: `src-tauri/tauri.conf.json`, `src-tauri/icons/`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 个审查代理并行执行。ALL must APPROVE。向用户展示合并结果并等待明确 "okay" 后方可标记完成。

- [x] F1. **Plan Compliance Audit** — `oracle`
  通读计划端到端。每个 "Must Have"：验证实现存在（读文件、curl 接口、运行命令）。每个 "Must NOT Have"：搜索代码库中禁止的模式，发现则拒绝并报告 file:line。检查 evidence 文件存在于 `.sisyphus/evidence/`。对比交付物是否符合计划。
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  运行 `npx tsc --noEmit` + ESLint。审查所有变更文件：`as any`/`@ts-ignore`、空 catch、console.log 遗留、注释掉的代码、未使用导入。检查 AI slop：过度注释、过度抽象、泛型命名（data/result/item/temp）。
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  从干净状态开始。执行每个任务中的 QA 场景 — 严格按步骤、捕获证据。测试跨任务集成（功能协作，非孤立测试）。测试边缘情况：空状态、无效输入、快速操作。
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  对每个任务：读 "What to do"，读实际 diff（git log/diff）。验证 1:1 — 规范中的每项都已构建（无遗漏），未超范构建（无蔓延）。检查 "Must NOT do" 合规。检测跨任务污染。标记未计入变更的文件。
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: 每个任务独立 commit（6 commits）
- **Wave 2**: 每个任务独立 commit（5 commits）
- **Wave 3**: 每个任务独立 commit（5 commits）
- **Wave 4**: 每个任务独立 commit（4 commits）
- **Final**: 如审查发现修复项，修复后统一 commit

---

## Success Criteria

### Verification Commands
```bash
npm run tauri dev      # 应用启动正常
npx tsc --noEmit       # 类型检查通过
npm run tauri build    # 构建成功
```

### Final Checklist
- [ ] 所有 "Must Have" 已实现
- [ ] 所有 "Must NOT Have" 无一违反
- [ ] Agent 自验证全部通过（20 个任务 + 4 个审查）
- [ ] .dmg 安装包可生成
