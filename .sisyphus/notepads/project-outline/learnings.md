# ProjectOutline 全局大纲 + 拖拽排序

## Summary
- Created `ProjectOutline.tsx` — a new component that displays chapters sorted by `order` field with HTML5 drag-and-drop reordering.
- Added `generateOutline` prompt function in `prompts.ts` (returns a prompt asking LLM to suggest improved outline structure).
- Registered `"generate_outline" => prompts.generateOutline` in `AIService.ts` COMMAND_MAP.

## Implementation Details
- Component uses native HTML5 DnD (`draggable`, `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`).
- Sorted by `chapters[].order` before rendering.
- DnD passes dragged index via `e.dataTransfer.setData("text/plain", String(index))`.
- Dragged item gets reduced opacity; drop target gets blue left-border + background.
- AI button calls `aiService.execute("generate_outline", allTitlesJoinedByNewline)`.
- Click on chapter title calls `onNavigateToChapter(chapterId)` and `onSelectChapter?.(chapterId)`.

## Files Changed
1. `src/components/editor/ProjectOutline.tsx` — new file (116 lines)
2. `src/components/editor/__tests__/ProjectOutline.test.tsx` — new file (147 lines)
3. `src/components/ai/orchestrator/prompts.ts` — added `generateOutline` function
4. `src/components/ai/orchestrator/AIService.ts` — added `generate_outline` to COMMAND_MAP

## Test Coverage (5 tests)
- renders chapters in order with hierarchical indentation
- sorts chapters by order when order differs from array position
- drag-and-drop reorder triggers onReorder callback with correct new order
- AI button triggers aiService.execute with generate_outline and all titles
- click on chapter title calls onNavigateToChapter with chapter id

## Key Notes
- jsdom does NOT support `new DataTransfer()` constructor — use plain object mock with `getData: vi.fn(() => "...")` instead.
- Follow existing test pattern (vi.mock AIService, createChapter helper, fireEvent).
- `npx vitest run src/components/editor/__tests__/ProjectOutline.test.tsx` → 5 passed
- `npx tsc --noEmit` → zero errors
