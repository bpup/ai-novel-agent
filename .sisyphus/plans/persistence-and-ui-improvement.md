# Ink & Vellum — P0+P1 Persistence & UI Improvement Plan

## TL;DR

> **Quick Summary**: Fix 5 critical P0/P1 gaps in the Ink & Vellum novel writing app: (P0) SQLite data loss on refresh — switch to `@tauri-apps/plugin-sql` for native file-backed persistence with auto-save; (P1) missing character/world setting CRUD UIs, enhanced editor toolbar (lists, blockquote, code block, alignment, hr, clear formatting), persona/skill switching in AI panel, and SearchDialog integration.

> **Deliverables**:
> - File-backed SQLite persistence via `@tauri-apps/plugin-sql` (replaces in-memory sql.js)
> - Auto-save on every write + manual save + load-on-startup
> - Enhanced EditorToolbar (12 buttons: B/I/H1/H2/H3/UL/OL/blockquote/code/align/hr/clear)
> - SearchDialog integrated via toolbar icon
> - Character CRUD UI (modal with name/description/traits)
> - World Setting CRUD UI (modal with name/description/category)
> - Persona dropdown + Skill dropdown in AISidebar header
> - Tauri plugin infrastructure (Cargo.toml crates + capabilities + lib.rs registration)

> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 (Tauri plugin infra) → Task 2 (database rewrite) → Task 3 (auto-save wiring) → Task 8 (CharacterService) → Task 10 (integration) → Final verification

---

## Context

### Original Request
Fix P0 (SQLite data loss) and P1 (missing UI features) in the Ink & Vellum novel writing app.

### Interview Summary
**Key Discussions**:
- Scope: ALL 5 P0+P1 items
- Test strategy: TDD with existing vitest infrastructure (22 files, 250 tests)
- Persistence approach: `@tauri-apps/plugin-sql` (recommended by Metis) — project already has npm packages + tauri.conf.json configured, only missing Rust crates + capabilities file

### Metis Review (Key Findings)
**Critical Architecture Decision**:
- Project has `@tauri-apps/plugin-sql` and `@tauri-apps/plugin-fs` in package.json + tauri.conf.json but Rust crates NOT in Cargo.toml
- **Option A (Recommended)**: Use `@tauri-apps/plugin-sql` to replace sql.js entirely — removes WASM dep, unlocks native file-backed persistence. Add `tauri-plugin-sql` to Cargo.toml + capabilities file + lib.rs registration.
- **Option B**: Keep sql.js + add `@tauri-apps/plugin-fs` for binary export persistence (minimal change path)
- **Avoid**: Custom Rust SQLite commands (most work, least maintainable)

**Guardrails Applied**:
- P0 (persistence) must land independently before P1 UI changes
- Character/World CRUD uses existing DB schemas (no schema changes without migration planning)
- Each EditorToolbar button must have a corresponding TipTap extension — no placeholder icons
- SearchDialog is navigation-only (no highlight-in-editor)
- No character avatar upload, no world setting category CRUD
- Auto-save debounced at 2s (existing pattern), not on every keystroke

---

## Work Objectives

### Core Objective
Eliminate data loss and complete the UI feature set for a production-ready novel writing experience.

### Concrete Deliverables
- `src-tauri/capabilities/default.json` — Tauri v2 capabilities file
- `src-tauri/Cargo.toml` — updated with `tauri-plugin-sql` + `tauri-plugin-fs`
- `src-tauri/src/lib.rs` — updated with plugin registration
- `src/services/db/database.ts` — rewritten for `@tauri-apps/plugin-sql`
- `src/services/character/service.ts` — Character CRUD service
- `src/services/world/service.ts` — World Setting CRUD service
- `src/components/editor/EditorToolbar.tsx` — enhanced with 12 buttons
- `src/components/editor/NovelEditor.tsx` — updated with new TipTap extensions
- `src/pages/Project.tsx` — integrated SearchDialog + character/world UI
- `src/components/ai/AISidebar.tsx` — persona + skill dropdowns
- `src/components/character/` — Character CRUD modal component
- `src/components/world/` — World Setting CRUD modal component
- `src/services/character/__tests__/` + `src/services/world/__tests__/` — service tests
- `src/components/character/__tests__/` + `src/components/world/__tests__/` — component tests

### Definition of Done
- [ ] `npx vitest run` → all tests pass (existing 250 + new)
- [ ] `npm run build` → exit 0
- [ ] `cargo build` → Rust compilation succeeds
- [ ] Data survives app restart (save + load cycle)
- [ ] Character CRUD: create, read, update, delete via modal
- [ ] World Setting CRUD: create, read, update, delete via modal
- [ ] EditorToolbar shows all 12 buttons, each functional
- [ ] SearchDialog opens from toolbar icon, navigates to chapter
- [ ] Persona dropdown changes active persona
- [ ] Skill dropdown changes active skill

### Must Have
- File-backed persistence with `@tauri-apps/plugin-sql`
- Auto-save on content change (debounced 2s) + manual save
- Load database on project open
- Character CRUD (name/description/traits)
- World Setting CRUD (name/description/category)
- Enhanced EditorToolbar (12 buttons, all functional)
- SearchDialog from toolbar
- Persona dropdown in AISidebar
- Skill dropdown in AISidebar
- TDD with vitest coverage for all new code

### Must NOT Have (Guardrails)
- No character avatar/image upload
- No world setting category CRUD (free-text only)
- No editor-in-text search highlighting
- No cloud sync or data export
- No database encryption
- No persona creation/editing UI (read simple dropdown of existing personas)
- No skill import UI (read from already-registered skills)
- No refactoring of existing Chapter CRUD
- No new state management library

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (vitest, 22 files, 250 tests)
- **Automated tests**: TDD — RED → GREEN → REFACTOR for all new code
- **Framework**: vitest + @testing-library/react
- **Tauri plugin tests**: Mock `invoke()` calls in unit tests; integration tests via `cargo build` verification

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — Tauri plugin infrastructure):
├── Task 1: Tauri plugin setup (Cargo.toml + capabilities + lib.rs)
├── Task 2: Database rewrite (sql.js → @tauri-apps/plugin-sql)
├── Task 3: Database integration (auto-save + load-on-startup)
└── Task 4: Database migration strategy

Wave 2 (After Wave 1 — editor + persistence verification):
├── Task 5: TipTap extension config (lists, blockquote, code, alignment)
├── Task 6: EditorToolbar enhancement (12 buttons)
├── Task 7: SearchDialog integration (toolbar icon)
└── Task 8: CharacterService + WorldSettingService

Wave 3 (After Wave 2 — CRUD UI + AI sidebar):
├── Task 9: Character CRUD UI component
├── Task 10: World Setting CRUD UI component
├── Task 11: Project.tsx integration (sidebar tabs for char/world)
├── Task 12: Persona dropdown in AISidebar
└── Task 13: Skill dropdown in AISidebar

Wave 4 (After Wave 3 — integration + build):
├── Task 14: Full integration + build verification
└── Task 15: Tauri build + smoke test

Wave FINAL (After ALL tasks):
├── F1: Plan Compliance Audit (oracle)
├── F2: Code Quality Review (unspecified-high)
├── F3: Real Manual QA (unspecified-high + playwright)
└── F4: Scope Fidelity Check (deep)
```

**Critical Path**: Task 1 → Task 2 → Task 3 → Task 8 → Task 11 → Task 14 → F1-F4
**Max Concurrent**: Wave 2 has 4 parallel, Wave 3 has 5 parallel

---

## TODOs

- [x] 1. Tauri Plugin Infrastructure Setup

  **What to do**:
  - Add `tauri-plugin-sql` and `tauri-plugin-fs` to `src-tauri/Cargo.toml` dependencies
  - Create `src-tauri/capabilities/default.json` with sql + fs permissions
  - Register plugins in `src-tauri/src/lib.rs`
  - Verify `cargo build` succeeds
  - Install npm packages if not already present (`@tauri-apps/plugin-sql`, `@tauri-apps/plugin-fs`)

  **Must NOT do**: Don't modify any frontend code yet

  **Recommended Agent Profile**: `quick` — clear dependency + config changes
  **Parallelization**: Wave 1, Sequential, Blocks Tasks 2-15, Blocked By None
  **References**: `src-tauri/Cargo.toml` (current deps), `src-tauri/src/lib.rs` (current plugin registration), `src-tauri/tauri.conf.json` (current plugin config)

  **Acceptance Criteria**:
  - [ ] `cd src-tauri && cargo build` → exit 0
  - [ ] `src-tauri/capabilities/default.json` exists with sql + fs permissions
  - [ ] `lib.rs` registers both plugins

  **QA Scenarios**:
  ```
  Scenario: Tauri plugin build
    Tool: Bash | Steps: cd src-tauri && cargo build
    Expected: exit 0, "Compiling tauri-plugin-sql" and "Compiling tauri-plugin-fs" in output
    Evidence: .sisyphus/evidence/task-1-cargo-build.txt

  Scenario: Capabilities file exists
    Tool: Bash | Steps: cat src-tauri/capabilities/default.json
    Expected: JSON with "sql:default" and "fs:default" permissions
    Evidence: .sisyphus/evidence/task-1-capabilities.txt
  ```

  **Commit**: YES — `feat(tauri): add plugin-sql + plugin-fs infrastructure`

- [x] 2. Database Layer Rewrite (sql.js → @tauri-apps/plugin-sql)

  **What to do**:
  - RED: `src/services/db/__tests__/database.test.ts` — test init(), query(), execute(), save(), load(), close()
    - Mock `@tauri-apps/plugin-sql` Database constructor + `@tauri-apps/api/core` invoke
    - Test table creation (CREATE TABLE IF NOT EXISTS for all 6 tables)
    - Test CRUD operations: insert, select, update, delete
    - Test save/load roundtrip
  - GREEN: Rewrite `src/services/db/database.ts`
    - Replace `SQL.Database` (sql.js) with `Database` from `@tauri-apps/plugin-sql`
    - Use `Database.load("sqlite:ai_novel_agent.db")` for initialization
    - Implement `initDatabase()`: creates all tables (projects, chapters, characters, world_settings, chat_messages, rag_documents)
    - Keep existing `getDB()` singleton pattern but return the plugin Database
    - Keep existing query helper functions (`getRows<T>`, `executeSQL`, `runSQL`)
    - Remove sql.js WASM loading (`initSqlJs`, `locateFile`)

  **Must NOT do**: Don't change public API surface of database.ts (callers should not need changes)
  **Must NOT do**: Don't remove `saveDatabase()`/`loadDatabase()` — reimplement them with plugin API

  **Recommended Agent Profile**: `deep` — significant rewrite with test-first approach
  **Parallelization**: Wave 1, Sequential, Blocks Tasks 3-15, Blocked By Task 1
  **References**: `src/services/db/database.ts` (current implementation), `.sisyphus/drafts/persistence-and-ui-improvement.md` (design doc), `src/services/db/__tests__/database.test.ts` (should exist after TDD)

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/services/db/__tests__` → PASS (at least 6 tests)
  - [ ] `npx tsc --noEmit` → zero errors
  - [ ] Database layer uses `@tauri-apps/plugin-sql` not sql.js

  **QA Scenarios**:
  ```
  Scenario: Database initialization
    Tool: Bash | Steps: npx vitest run src/services/db/__tests__/database.test.ts
    Expected: All tests pass, no sql.js references
    Evidence: .sisyphus/evidence/task-2-db-test.txt
  ```

  **Commit**: YES — `feat(db): rewrite database layer with @tauri-apps/plugin-sql`

- [x] 3. Database Integration — Auto-Save + Load-on-Startup + Manual Save

  **What to do**:
  - RED: `src/services/db/__tests__/persistence.test.ts`
    - Test `saveDatabase()` triggers `Database.save()` on plugin instance
    - Test `loadDatabase()` loads project data from plugin
    - Test auto-save triggers on content change (debounced)
    - Test manual save via button
  - GREEN: Wire persistence into application flow
    - `src/pages/Project.tsx`: Call `initDatabase()` on mount, `loadDatabase(projectId)` on project open
    - `src/components/editor/NovelEditor.tsx`: Add debounced (2s) auto-save on editor `onUpdate`
    - `src/services/project/manager.ts`: Call `saveDatabase()` after chapter updates
    - Manual save: Add save button to Project page header (shown as "保存" next to project title)
    - `database.ts`: `closeDatabase()` called on project unmount

  **Must NOT do**: Don't save on every keystroke (use existing 2s debounce)
  **Must NOT do**: Don't add cloud sync or backup features

  **Recommended Agent Profile**: `deep` — integration wiring across multiple files
  **Parallelization**: Wave 1, Sequential, Blocks Tasks 4-15, Blocked By Task 2
  **References**: `src/pages/Project.tsx` (mount/unmount hooks), `src/components/editor/NovelEditor.tsx` (onUpdate handler), `src/services/project/manager.ts` (chapter update calls)

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/services/db/__tests__/persistence.test.ts` → PASS
  - [ ] Auto-save triggers after 2s debounce on editor content change
  - [ ] Manual save button appears in project header
  - [ ] `closeDatabase()` called on unmount

  **QA Scenarios**:
  ```
  Scenario: Auto-save persistence
    Tool: Bash (unit test) | Steps: Mock plugin → trigger content change → wait 2s → verify save called
    Expected: saveDatabase() called once with debounce
    Evidence: .sisyphus/evidence/task-3-autosave.txt
  ```

  **Commit**: YES — `feat(db): wire auto-save + load-on-startup + manual save`

- [x] 4. Schema Migration Strategy

  **What to do**:
  - RED: `src/services/db/__tests__/migration.test.ts`
    - Test `checkSchemaVersion()` detects old/new/empty schemas
    - Test `runMigrations()` runs pending migrations in order
    - Test migration adds new columns (e.g., adding `status`/`summary`/`wordGoal`/`notes` to chapters)
    - Test migration creates new tables (e.g., `characters` table)
  - GREEN: Implement migration system
    - Add `_schema_version` table in database.ts
    - `checkSchemaVersion()`: query `SELECT version FROM _schema_version` — return 0 if table missing
    - `runMigrations()`: sequential migrations array, each with `version` + `sql` array
    - Migration v1: Create `characters` table (id, projectId, name, description, traits)
    - Migration v2: Create `world_settings` table (id, projectId, name, description, category)
    - Migration v3: Add `status`, `summary`, `wordGoal`, `notes` columns to `chapters`
    - Call `runMigrations()` after `initDatabase()` in Project.tsx

  **Must NOT do**: Don't add rollback support (forward-only migrations)
  **Must NOT do**: Don't modify existing data — only add columns/tables

  **Recommended Agent Profile**: `deep` — data migration logic with test-first
  **Parallelization**: Wave 1, Sequential, Blocked By Task 2
  **References**: `src/services/db/database.ts` (table creation), existing Chapter schema with new fields

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/services/db/__tests__/migration.test.ts` → PASS
  - [ ] Fresh database gets all migrations applied
  - [ ] Old database (no _schema_version) gets migrations starting from v1

  **QA Scenarios**:
  ```
  Scenario: Fresh schema migration
    Tool: Bash | Steps: npx vitest run src/services/db/__tests__/migration.test.ts
    Expected: All migration tests pass, correct version detected
    Evidence: .sisyphus/evidence/task-4-migration.txt
  ```

  **Commit**: YES — `feat(db): add schema migration strategy`

---

### Wave 2 — Editor Enhancements

- [x] 5. TipTap Extension Configuration

  **What to do**:
  - RED: `src/components/editor/__tests__/NovelEditor-extensions.test.tsx`
    - Test all new extensions are registered: OrderedList, BulletList, ListItem, Blockquote, CodeBlockLowlight, TextAlign, HorizontalRule
    - Test existing extensions still work
    - Test StarterKit config: ensure list/blockquote/code are enabled
  - GREEN: Update `src/components/editor/NovelEditor.tsx`
    - Import `OrderedList`, `BulletList`, `ListItem` from `@tiptap/extension-list`
    - Import `Blockquote` from `@tiptap/extension-blockquote`
    - Import `CodeBlockLowlight` from `@tiptap/extension-code-block-lowlight`
    - Import `TextAlign` from `@tiptap/extension-text-align` (config: `{ types: ['heading', 'paragraph'] }`)
    - Import `HorizontalRule` from `@tiptap/extension-horizontal-rule`
    - Add all to `extensions` array

  **Must NOT do**: Don't modify existing extension configs

  **Recommended Agent Profile**: `visual-engineering`
  **Parallelization**: Wave 2, parallel with Tasks 6, 7, 8, Blocked By None
  **References**: `src/components/editor/NovelEditor.tsx`

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/components/editor/__tests__/NovelEditor-extensions.test.tsx` → PASS
  - [ ] `npx tsc --noEmit` → zero errors

  **QA Scenarios**:
  ```
  Scenario: Extension registration
    Tool: Bash | Steps: npx vitest run src/components/editor/__tests__/NovelEditor-extensions.test.tsx
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-5-extensions.txt
  ```

  **Commit**: YES — `feat(editor): configure lists/blockquote/code/alignment extensions`

- [x] 6. EditorToolbar Enhancement

  **What to do**:
  - RED: `src/components/editor/__tests__/EditorToolbar.test.tsx`
    - Test all 12 buttons: B, I, H1, H2, H3, OL, UL, Blockquote, Code, Align (L/C/R cycle), HR, ClearFormatting
    - Test each button calls correct editor command
    - Test alignment cycles L→C→R→L
    - Test clear formatting calls `unsetAllMarks()` + `clearNodes()`
  - GREEN: Rewrite `src/components/editor/EditorToolbar.tsx`
    - Groups: text (B/I), headings (H1/H2/H3), lists (OL/UL), blocks (blockquote/code), alignment (L/C/R), utilities (HR/clear)
    - Search icon button on right side (triggers SearchDialog via prop)
    - Active state highlighting for toggle buttons
    - Visual separators between groups

  **Must NOT do**: Don't remove existing B/I/H1/H2/H3/HR/undo/redo

  **Recommended Agent Profile**: `visual-engineering`
  **Parallelization**: Wave 2, parallel with Tasks 5, 7, 8, Blocked By Task 5
  **References**: `src/components/editor/EditorToolbar.tsx`

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/components/editor/__tests__/EditorToolbar.test.tsx` → PASS
  - [ ] All 12 buttons visible and functional

  **QA Scenarios**:
  ```
  Scenario: Toolbar buttons
    Tool: Bash | Steps: npx vitest run src/components/editor/__tests__/EditorToolbar.test.tsx
    Expected: All button tests pass
    Evidence: .sisyphus/evidence/task-6-toolbar.txt
  ```

  **Commit**: YES — `feat(editor): enhance toolbar with 12 formatting buttons`

- [x] 7. SearchDialog Integration

  **What to do**:
  - RED: `src/components/editor/__tests__/SearchDialog-integration.test.tsx`
    - Test clicking search icon → SearchDialog opens
    - Test SearchDialog receives correct projectId + callbacks
    - Test Escape closes SearchDialog
  - GREEN: Wire SearchDialog into Project.tsx
    - Import `SearchDialog` in `src/pages/Project.tsx`
    - Add `showSearch` state
    - Pass `onClose`, `onJumpToChapter` callbacks
    - EditorToolbar gets `onSearchClick` prop

  **Must NOT do**: Don't modify SearchDialog.tsx

  **Recommended Agent Profile**: `quick`
  **Parallelization**: Wave 2, parallel with Tasks 5, 6, 8, Blocked By None

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/components/editor/__tests__/SearchDialog-integration.test.tsx` → PASS

  **QA Scenarios**:
  ```
  Scenario: Search dialog opens
    Tool: Bash | Steps: npx vitest run SearchDialog-integration.test.tsx
    Expected: All tests pass
    Evidence: .sisyphus/evidence/task-7-search.txt
  ```

  **Commit**: YES — `feat(editor): integrate SearchDialog via toolbar icon`

- [x] 8. CharacterService + WorldSettingService

  **What to do**:
  - RED: `src/services/character/__tests__/CharacterService.test.ts`
    - Test createCharacter/getCharacters/updateCharacter/deleteCharacter
    - Test validation: name required (min 1)
  - RED: `src/services/world/__tests__/WorldSettingService.test.ts`
    - Test createWorldSetting/getWorldSettings/updateWorldSetting/deleteWorldSetting
  - GREEN: Create `src/services/character/service.ts` (follows ChapterService pattern)
  - GREEN: Create `src/services/world/service.ts` (follows same pattern)

  **Must NOT do**: Don't modify existing chapter service

  **Recommended Agent Profile**: `quick` — pattern-copy CRUD services
  **Parallelization**: Wave 2, parallel with Tasks 5, 6, 7, Blocked By Tasks 2, 3, 4
  **References**: `src/services/project/manager.ts`, `src/schemas/index.ts`

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/services/character/__tests__` → PASS
  - [ ] `npx vitest run src/services/world/__tests__` → PASS

  **QA Scenarios**:
  ```
  Scenario: Character CRUD
    Tool: Bash | Steps: npx vitest run src/services/character/__tests__/CharacterService.test.ts
    Expected: All CRUD tests pass
    Evidence: .sisyphus/evidence/task-8-character-service.txt
  ```

  **Commit**: YES — `feat(services): add CharacterService + WorldSettingService`

---

### Wave 3 — CRUD UI + AI Sidebar Enhancements

- [x] 9. Character CRUD UI Component
- [x] 10. World Setting CRUD UI Component
- [x] 11. Project.tsx Integration (Sidebar Tabs for Characters + World Settings)

  **What to do**:
  - RED: `src/pages/__tests__/Project-sidebar.test.tsx`
    - Test sidebar has character tab + world settings tab
    - Test clicking character tab shows Character list + "新建" button
    - Test clicking world tab shows World Setting list + "新建" button
    - Test item click opens respective edit modal
    - Test delete removes item
    - Test character/world data loads on project mount
  - GREEN: Update `src/pages/Project.tsx`
    - Add new sidebar tabs: "角色" and "世界观" (alongside existing chapter/outline/notes)
    - Character tab: list view with create/edit/delete via CharacterModal
    - World tab: list view with create/edit/delete via WorldSettingModal
    - Load characters/worlds on project mount via respective services
    - Pass `onSearchClick` to EditorToolbar

  **Must NOT do**: Don't remove existing sidebar tabs (chapter/outline/notes)

  **Recommended Agent Profile**: `visual-engineering`
  **Parallelization**: Wave 3, parallel with Tasks 9, 10, 12, 13, Blocked By Tasks 8, 9, 10
  **References**: `src/pages/Project.tsx` (current sidebar tab implementation)

  **Acceptance Criteria**:
  - [ ] `npx vitest run src/pages/__tests__/Project-sidebar.test.tsx` → PASS
  - [ ] Character and World tabs appear in sidebar
  - [ ] CRUD operations work from sidebar

  **QA Scenarios**:
  ```
  Scenario: Sidebar integration
    Tool: Bash | Steps: npx vitest run src/pages/__tests__/Project-sidebar.test.tsx
    Expected: All tab integration tests pass
    Evidence: .sisyphus/evidence/task-11-integration.txt
  ```

  **Commit**: YES — `feat(project): integrate character/world sidebar tabs`

- [x] 12. Persona Dropdown in AISidebar
- [x] 13. Skill Dropdown in AISidebar
- [x] 14. Full Integration + Build Verification

  **What to do**:
  - Run `npx vitest run` → all tests pass (existing 250 + new)
  - Run `npx tsc --noEmit` → zero type errors
  - Run `npm run build` → exit 0
  - Run `cd src-tauri && cargo build` → Rust compilation succeeds
  - Verify all components render without crash
  - Verify SearchDialog opens from toolbar
  - Verify Character/World tabs show in sidebar
  - Verify persona/skill dropdowns visible in AISidebar

  **Must NOT do**: Don't add new features in this task

  **Recommended Agent Profile**: `quick` — verification only
  **Parallelization**: Wave 4, Sequential, Blocked By Tasks 5-13

  **Acceptance Criteria**:
  - [ ] `npx vitest run` → ALL tests pass
  - [ ] `npx tsc --noEmit` → zero errors
  - [ ] `npm run build` → exit 0
  - [ ] `cd src-tauri && cargo build` → exit 0

  **QA Scenarios**:
  ```
  Scenario: Full build
    Tool: Bash | Steps: npx vitest run && npx tsc --noEmit && npm run build && cd src-tauri && cargo build
    Expected: All commands exit 0
    Evidence: .sisyphus/evidence/task-14-build.txt
  ```

  **Commit**: YES — `chore: full build verification + smoke test`

---

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results.

- [x] F1. **Plan Compliance Audit** — `oracle`
- [x] F2. **Code Quality Review** — `unspecified-high`
- [x] F3. **Real Manual QA** — `unspecified-high` + `playwright`
- [x] F4. **Scope Fidelity Check** — `deep`
  Compare "What to do" vs actual diff. Verify no creep, no contamination.
  Output: `Tasks [N/N] | Contamination [CLEAN/N] | Unaccounted [CLEAN/N] | VERDICT`

---

## Commit Strategy

```
Wave 1: feat(tauri): add plugin-sql + plugin-fs infrastructure for persistence
        feat(db): rewrite database layer with @tauri-apps/plugin-sql
        feat(db): wire auto-save + load-on-startup + manual save
        feat(db): add schema migration strategy

Wave 2: feat(editor): configure lists/blockquote/code/alignment extensions
        feat(editor): enhance toolbar with 12 formatting buttons
        feat(editor): integrate SearchDialog via toolbar icon
        feat(services): add CharacterService + WorldSettingService

Wave 3: feat(ui): add Character CRUD modal component
        feat(ui): add WorldSetting CRUD modal component
        feat(project): integrate character/world sidebar tabs
        feat(ai): add persona switching dropdown
        feat(ai): add skill switching dropdown

Wave 4: chore: full build verification + smoke test
```

---

## Success Criteria

### Verification Commands
```bash
npx vitest run          # All tests pass
npx tsc --noEmit        # Zero type errors
npm run build           # Frontend build succeeds
cargo build             # Rust build succeeds (in src-tauri/)
```

### Final Checklist
- [ ] Data survives app restart
- [ ] Character CRUD: create, edit, delete works
- [ ] World Setting CRUD: create, edit, delete works
- [ ] All 12 toolbar buttons functional
- [ ] SearchDialog opens, searches, navigates
- [ ] Persona switching changes AI behavior
- [ ] Skill switching changes AI behavior
- [ ] All tests pass (existing + new)
- [ ] Build succeeds (frontend + Tauri)