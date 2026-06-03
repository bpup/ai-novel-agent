import { useState, useCallback, useRef, useEffect } from "react";
import { exportChapter, exportProject, type ExportFormat } from "../../services/export";
import type { Chapter } from "../../types/novel";

interface ExportDialogProps {
  projectTitle: string;
  chapters: Chapter[];
  selectedChapterId?: string | null;
  onClose: () => void;
}

export default function ExportDialog({ projectTitle, chapters, selectedChapterId, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [scope, setScope] = useState<"all" | "current">("all");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  function handleExport() {
    if (scope === "all") {
      exportProject(
        projectTitle,
        chapters.map((c) => ({ title: c.title, content: c.content })),
        format,
      );
    } else {
      const current = chapters.find((c) => c.id === selectedChapterId) ?? chapters[0];
      if (current) {
        exportChapter({ title: current.title, content: current.content }, format);
      }
    }
    onClose();
  }

  const formats: { key: ExportFormat; label: string }[] = [
    { key: "markdown", label: "Markdown" },
    { key: "txt", label: "纯文本" },
    { key: "html", label: "HTML" },
  ];

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        className="bg-ink-surface border border-ink-border rounded-lg shadow-lg w-80 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-border">
          <h3 className="text-sm font-medium text-ink-text">导出</h3>
          <button type="button" onClick={onClose} className="text-ink-text-dim hover:text-ink-text text-lg leading-none">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <fieldset>
            <legend className="block text-xs text-ink-text-dim mb-2">格式</legend>
            <div className="flex gap-2">
              {formats.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFormat(f.key)}
                  className={`flex-1 py-1.5 text-xs rounded transition-ink ${
                    format === f.key
                      ? "bg-amber text-ink-bg"
                      : "bg-ink-surface-hover text-ink-text-dim hover:text-ink-text"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="block text-xs text-ink-text-dim mb-2">范围</legend>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`flex-1 py-1.5 text-xs rounded transition-ink ${
                  scope === "all"
                    ? "bg-amber text-ink-bg"
                    : "bg-ink-surface-hover text-ink-text-dim hover:text-ink-text"
                }`}
              >
                全部章节
              </button>
              <button
                type="button"
                onClick={() => setScope("current")}
                className={`flex-1 py-1.5 text-xs rounded transition-ink ${
                  scope === "current"
                    ? "bg-amber text-ink-bg"
                    : "bg-ink-surface-hover text-ink-text-dim hover:text-ink-text"
                }`}
              >
                当前章节
              </button>
            </div>
          </fieldset>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-ink-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-ink-text-dim hover:text-ink-text transition-ink"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-1.5 text-xs bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink"
          >
            导出
          </button>
        </div>
      </div>
    </div>
  );
}
