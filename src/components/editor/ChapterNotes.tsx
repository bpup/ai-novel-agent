import { useState } from "react";
import type { Chapter } from "../../types/novel";
import { aiService } from "../ai/orchestrator/AIService";

interface ChapterNotesProps {
  chapter: Chapter;
  onNotesChange: (notes: string) => void;
}

export default function ChapterNotes({ chapter, onNotesChange }: ChapterNotesProps) {
  const [draft, setDraft] = useState(chapter.notes ?? "");

  const currentNotes = chapter.notes ?? "";

  const handleChange = (value: string) => {
    setDraft(value);
  };

  const handleBlur = () => {
    if (draft !== currentNotes) {
      onNotesChange(draft);
    }
  };

  const handleExtractKeywords = async () => {
    const slice = chapter.content.slice(-1000);
    const result = await aiService.execute("extract_keywords", slice);
    setDraft(result.result);
  };

  const handleContinue = async () => {
    const result = await aiService.execute("continue", chapter.content);
    setDraft((prev) => prev + result.result);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-ink-border">
        <h3 className="text-xs font-semibold text-ink-text-dim uppercase tracking-wider font-(family-name:--font-ui)">
          笔记
        </h3>
      </div>
      <div className="flex-1 flex flex-col p-3 gap-2 overflow-y-auto">
        <textarea
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          rows={8}
          className="w-full flex-1 text-xs bg-ink-surface border border-ink-border rounded px-2 py-1 text-ink-text resize-none focus:outline-none focus:border-amber transition-ink"
          placeholder="记录灵感、伏笔、情节构思..."
        />
        <div className="flex gap-2">
          <button
            onClick={handleExtractKeywords}
            className="text-xs text-amber hover:text-amber-hover transition-ink"
          >
            AI 提取伏笔
          </button>
          <button
            onClick={handleContinue}
            className="text-xs text-amber hover:text-amber-hover transition-ink"
          >
            AI 继续
          </button>
        </div>
      </div>
    </div>
  );
}
