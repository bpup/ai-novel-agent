import { useState } from "react";
import type { Chapter } from "../../types/novel";
import type { ChapterStatus } from "../../types/chat";
import { aiService } from "../ai/orchestrator/AIService";

interface ChapterTreeProps {
  chapters: Chapter[];
  selectedChapterId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder?: (chapters: Chapter[]) => void;
  onStatusChange?: (chapterId: string, status: ChapterStatus) => void;
  onSummaryChange?: (chapterId: string, summary: string) => void;
}

const VALID_TRANSITIONS: [ChapterStatus, ChapterStatus, boolean][] = [
  ["draft", "writing", true],
  ["writing", "done", true],
  ["writing", "paused", true],
  ["paused", "writing", true],
  ["draft", "paused", true],
  ["done", "paused", true],
  ["paused", "done", true],
];

const STATUS_LABELS: Record<ChapterStatus, string> = {
  draft: "草稿",
  writing: "写作中",
  paused: "已暂停",
  done: "已完成",
};

const STATUS_COLORS: Record<ChapterStatus, string> = {
  draft: "text-gray-500",
  writing: "text-blue-500",
  paused: "text-yellow-500",
  done: "text-green-500",
};

function nextStatus(current: ChapterStatus): ChapterStatus[] {
  return VALID_TRANSITIONS.filter(([f, , valid]) => f === current && valid).map(
    ([, t]) => t
  );
}

function computeProgress(content: string, wordGoal: number): number {
  if (!wordGoal || wordGoal <= 0) return 0;
  return Math.min(content.length, wordGoal) / wordGoal;
}

export default function ChapterTree({
  chapters,
  selectedChapterId,
  onSelect,
  onAdd,
  onDelete,
  onReorder,
  onStatusChange,
  onSummaryChange,
}: ChapterTreeProps) {
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);
  const [draftSummaries, setDraftSummaries] = useState<Record<string, string>>({});

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...chapters];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onReorder?.(updated);
  };

  const moveDown = (index: number) => {
    if (index >= chapters.length - 1) return;
    const updated = [...chapters];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onReorder?.(updated);
  };

  const handleStatusClick = (ch: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStatusChange) return;
    const current = ch.status ?? "draft";
    const next = nextStatus(current);
    if (next.length > 0) {
      onStatusChange(ch.id, next[0]);
    }
  };

  const handleSummaryToggle = (id: string) => {
    setExpandedSummaryId((prev) => (prev === id ? null : id));
  };

  const handleSummaryDraftChange = (id: string, value: string) => {
    setDraftSummaries((prev) => ({ ...prev, [id]: value }));
  };

  const handleSummaryBlur = (ch: Chapter) => {
    const draft = draftSummaries[ch.id];
    if (draft !== undefined && draft !== (ch.summary ?? "")) {
      onSummaryChange?.(ch.id, draft);
    }
  };

  const handleAISummarize = async (ch: Chapter) => {
    const content = ch.content.slice(-500);
    const result = await aiService.execute("summarize", content);
    setDraftSummaries((prev) => ({ ...prev, [ch.id]: result.result }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-ink-border">
        <h3 className="text-xs font-semibold text-ink-text-dim uppercase tracking-wider font-(family-name:--font-ui)">
          章节
        </h3>
        <button
          onClick={onAdd}
          className="px-2 py-0.5 text-xs text-amber hover:text-amber-hover transition-ink"
        >
          + 新增
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-ink-text-subtle">暂无章节</p>
          </div>
        ) : (
          <ul className="py-1">
            {chapters.map((ch, index) => {
              const status = ch.status ?? "draft";
              return (
                <li
                  key={ch.id}
                  onClick={() => onSelect(ch.id)}
                  className={`group flex flex-col cursor-pointer text-sm transition-ink ${
                    selectedChapterId === ch.id
                      ? "bg-amber-subtle text-amber border-l-2 border-amber"
                      : "text-ink-text-dim hover:bg-ink-surface-hover"
                  }`}
                >
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      <button
                        onClick={(e) => handleStatusClick(ch, e)}
                        className={`text-xs font-medium flex-shrink-0 hover:opacity-80 transition-ink ${STATUS_COLORS[status]}`}
                        title={`状态: ${STATUS_LABELS[status]}`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                      <span className="truncate text-xs">
                        {ch.title || "未命名"}
                      </span>
                    </div>
                    <span className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-ink">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveUp(index);
                        }}
                        disabled={index === 0}
                        className="px-0.5 text-xs text-ink-text-subtle hover:text-ink-text disabled:opacity-20 disabled:cursor-not-allowed"
                        title="上移"
                      >
                        ▲
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDown(index);
                        }}
                        disabled={index === chapters.length - 1}
                        className="px-0.5 text-xs text-ink-text-subtle hover:text-ink-text disabled:opacity-20 disabled:cursor-not-allowed"
                        title="下移"
                      >
                        ▼
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(ch.id);
                        }}
                        className="px-0.5 text-xs text-ink-text-subtle hover:text-error"
                        title="删除"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                  {ch.wordGoal && ch.wordGoal > 0 && (
                    <div className="px-3 pb-1.5">
                      <div className="h-1 bg-ink-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber rounded-full transition-all duration-300"
                          style={{
                            width: `${computeProgress(ch.content, ch.wordGoal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="px-3 pb-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSummaryToggle(ch.id);
                      }}
                      className="text-xs text-ink-text-subtle hover:text-ink-text transition-ink"
                    >
                      {expandedSummaryId === ch.id ? "▼" : "▶"} 摘要
                    </button>
                    {expandedSummaryId === ch.id && (
                      <div className="mt-1 space-y-1">
                        <textarea
                          value={draftSummaries[ch.id] ?? ch.summary ?? ""}
                          onChange={(e) => handleSummaryDraftChange(ch.id, e.target.value)}
                          onBlur={() => handleSummaryBlur(ch)}
                          rows={3}
                          className="w-full text-xs bg-ink-surface border border-ink-border rounded px-2 py-1 text-ink-text resize-none focus:outline-none focus:border-amber transition-ink"
                          placeholder="添加章节摘要..."
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAISummarize(ch);
                          }}
                          className="text-xs text-amber hover:text-amber-hover transition-ink"
                        >
                          AI 生成摘要
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
