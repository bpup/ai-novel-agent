## ChapterNotes 笔记面板 (2026-05-28)

Created `src/components/editor/ChapterNotes.tsx` with TDD:
- Sidebar panel component with header "笔记" and textarea
- Auto-saves `onNotesChange` on blur (only when text changed)
- "AI 提取伏笔" button → `aiService.execute("extract_keywords", chapter.content.slice(-1000))` → replaces notes
- "AI 继续" button → `aiService.execute("continue", chapter.content)` → appends result to notes
- Follows ink-themed design system (same Tailwind pattern as ChapterTree)
- 10 passing tests, zero TypeScript errors
