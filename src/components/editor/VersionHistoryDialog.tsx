import { useState, useEffect, useRef, useCallback } from "react";
import { chapterVersionService, type ChapterVersion } from "../../services/version/service";

interface VersionHistoryDialogProps {
  chapterId: string;
  currentTitle: string;
  currentContent: string;
  onRestore: (title: string, content: string) => void;
  onClose: () => void;
}

export default function VersionHistoryDialog({
  chapterId,
  currentTitle,
  currentContent,
  onRestore,
  onClose,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  useEffect(() => {
    chapterVersionService.getVersions(chapterId).then((list) => {
      setVersions(list);
      setLoading(false);
    });
  }, [chapterId]);

  async function handleSaveVersion() {
    await chapterVersionService.saveVersion(chapterId, currentTitle, currentContent, description);
    setDescription("");
    const list = await chapterVersionService.getVersions(chapterId);
    setVersions(list);
  }

  async function handleRestore(versionId: string) {
    const version = await chapterVersionService.restoreVersion(chapterId, versionId);
    onRestore(version.title, version.content);
    onClose();
  }

  async function handleDelete(versionId: string) {
    await chapterVersionService.deleteVersion(versionId);
    setVersions((prev) => prev.filter((v) => v.id !== versionId));
    if (previewId === versionId) setPreviewId(null);
  }

  const previewVersion = previewId ? versions.find((v) => v.id === previewId) : null;
  const previewContent = previewVersion?.content ?? "";

  if (loading) {
    return (
      <div ref={overlayRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose} onKeyDown={handleKeyDown} role="presentation">
        <div className="bg-ink-surface border border-ink-border rounded-lg shadow-lg w-[640px] p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-ink-text-dim">加载版本历史...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={overlayRef} tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose} onKeyDown={handleKeyDown} role="presentation">
      <div
        className="bg-ink-surface border border-ink-border rounded-lg shadow-lg w-[640px] max-h-[80vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-border shrink-0">
          <h3 className="text-sm font-medium text-ink-text">版本历史</h3>
          <button type="button" onClick={onClose} className="text-ink-text-dim hover:text-ink-text text-lg leading-none">&times;</button>
        </div>

        <div className="flex items-center gap-2 px-5 py-2 border-b border-ink-border shrink-0">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="版本描述（可选）..."
            className="flex-1 px-2 py-1 text-xs bg-ink-surface-raised border border-ink-border rounded text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-1 focus:ring-amber/30"
            onKeyDown={(e) => e.key === "Enter" && handleSaveVersion()}
          />
          <button
            type="button"
            onClick={handleSaveVersion}
            className="px-3 py-1 text-xs bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink shrink-0"
          >
            保存当前版本
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-1/2 border-r border-ink-border overflow-y-auto">
            {versions.length === 0 ? (
              <p className="text-xs text-ink-text-subtle text-center py-8">暂无历史版本</p>
            ) : (
              <div className="divide-y divide-ink-border">
                {versions.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    className={`w-full text-left px-4 py-2.5 transition-ink ${
                      previewId === v.id ? "bg-amber-subtle" : "hover:bg-ink-surface-hover"
                    }`}
                    onClick={() => setPreviewId(v.id)}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-ink-text truncate">
                        {v.description || "无描述"}
                      </span>
                      <span className="text-[10px] text-ink-text-subtle shrink-0 ml-2">
                        {v.wordCount} 字
                      </span>
                    </div>
                    <div className="text-[10px] text-ink-text-dim">
                      {new Date(v.savedAt).toLocaleString("zh-CN", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRestore(v.id); }}
                        className="text-[10px] text-amber hover:text-amber-hover transition-ink"
                      >
                        恢复
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                        className="text-[10px] text-error hover:opacity-80 transition-ink"
                      >
                        删除
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-1/2 overflow-y-auto p-4">
            {previewContent ? (
              <div
                className="text-xs text-ink-text leading-relaxed font-body"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            ) : (
              <p className="text-xs text-ink-text-subtle text-center py-8">
                选择一个版本预览
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center px-5 py-3 border-t border-ink-border shrink-0">
          <span className="text-[10px] text-ink-text-subtle">
            {versions.length} 个版本
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-ink-surface-hover text-ink-text-dim rounded hover:text-ink-text transition-ink"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
