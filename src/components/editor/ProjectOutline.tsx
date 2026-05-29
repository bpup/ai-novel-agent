import { useState } from "react";
import type { Chapter } from "../../types/novel";
import { aiService } from "../ai/orchestrator/AIService";

interface ProjectOutlineProps {
  chapters: Chapter[];
  onReorder: (chapters: Chapter[]) => void;
  onNavigateToChapter: (chapterId: string) => void;
  onSelectChapter?: (chapterId: string) => void;
}

export default function ProjectOutline({
  chapters,
  onReorder,
  onNavigateToChapter,
  onSelectChapter,
}: ProjectOutlineProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const sorted = [...chapters].sort((a, b) => a.order - b.order);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      const updated = [...sorted];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onReorder(updated);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleGenerateOutline = async () => {
    const allTitles = sorted.map((ch) => ch.title).join("\n");
    await aiService.execute("generate_outline", allTitles);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-ink-border">
        <h3 className="text-xs font-semibold text-ink-text-dim uppercase tracking-wider font-(family-name:--font-ui)">
          大纲
        </h3>
        <button
          onClick={handleGenerateOutline}
          className="px-2 py-0.5 text-xs text-amber hover:text-amber-hover transition-ink"
        >
          AI 生成大纲
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-ink-text-subtle">暂无章节</p>
          </div>
        ) : (
          <ul className="py-1">
            {sorted.map((ch, index) => (
              <li
                key={ch.id}
                draggable
                role="listitem"
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop(index)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  onNavigateToChapter(ch.id);
                  onSelectChapter?.(ch.id);
                }}
                className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition-ink border-l-2 ${
                  dropIndex === index
                    ? "border-blue-500 bg-blue-50"
                    : dragIndex === index
                      ? "border-amber bg-amber-subtle opacity-60"
                      : "border-transparent hover:border-ink-border hover:bg-ink-surface-hover"
                } ${index < sorted.length - 1 ? "border-b border-ink-border/30" : ""}`}
              >
                <span className="text-xs text-ink-text-dim tabular-nums w-5 text-right flex-shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="truncate text-xs text-ink-text flex-1">
                  {ch.title || "未命名"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
