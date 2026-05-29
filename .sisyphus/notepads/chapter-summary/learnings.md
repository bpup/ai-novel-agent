# ChapterTree Summary — Implementation Learnings

## What was done
- Added `onSummaryChange` prop to `ChapterTreeProps` (chapterId, summary) => void
- Added collapsible summary area per chapter: toggle button (▶/▼ 摘要), textarea, "AI 生成摘要" button
- Textarea uses local `draftSummaries` state, only calls `onSummaryChange` on blur if value changed
- AI button calls `aiService.execute("summarize", ch.content.slice(-500))`
- All existing status/progress/reorder features untouched

## Test patterns
- Mock `aiService` via `vi.mock("../../ai/orchestrator/AIService", ...)` — same pattern as InlineCommand
- Use `screen.getByText(/摘要/)` with regex (not exact string) because button text is "▶ 摘要"
- Use `/▶.*摘要/` for toggle button specifically (avoids clash with "AI 生成摘要")
- Textarea text is queried via text content, not attribute value
- `fireEvent.change` + `fireEvent.blur` to test onSummaryChange callback

## Key decisions
- Collapse/expand state tracked per chapter via `expandedSummaryId: string | null`
- Draft text stored in `draftSummaries: Record<string, string>` for unsaved edits
- Only save on blur and only if `draft !== ch.summary` (avoid unnecessary saves)
