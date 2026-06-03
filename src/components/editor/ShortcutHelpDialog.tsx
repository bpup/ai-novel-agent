import { useCallback, useRef, useEffect } from "react";

interface ShortcutHelpDialogProps {
  onClose: () => void;
}

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string; desc: string }[];
}

const groups: ShortcutGroup[] = [
  {
    label: "编辑",
    shortcuts: [
      { keys: "⌘S", desc: "手动保存" },
      { keys: "⌘Z", desc: "撤销" },
      { keys: "⌘⇧Z", desc: "重做" },
      { keys: "⌘B", desc: "加粗" },
      { keys: "⌘I", desc: "斜体" },
    ],
  },
  {
    label: "AI 对话",
    shortcuts: [
      { keys: "⌘.", desc: "打开/关闭 AI 侧边栏" },
      { keys: "@selection", desc: "在对话中引用选中文本" },
      { keys: "@chapter", desc: "在对话中引用当前章节" },
      { keys: "@project", desc: "在对话中引用项目信息" },
    ],
  },
  {
    label: "导航",
    shortcuts: [
      { keys: "⌘P", desc: "搜索章节" },
      { keys: "⌘⇧[", desc: "上一个章节" },
      { keys: "⌘⇧]", desc: "下一个章节" },
    ],
  },
];

export default function ShortcutHelpDialog({ onClose }: ShortcutHelpDialogProps) {
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
        className="bg-ink-surface border border-ink-border rounded-lg shadow-lg w-96 max-h-[80vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-border">
          <h3 className="text-sm font-medium text-ink-text">快捷键</h3>
          <button type="button" onClick={onClose} className="text-ink-text-dim hover:text-ink-text text-lg leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <h4 className="text-xs font-semibold text-ink-text-dim uppercase tracking-wider mb-2">{g.label}</h4>
              <div className="space-y-1.5">
                {g.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between">
                    <span className="text-xs text-ink-text">{s.desc}</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-(family-name:--font-mono) bg-ink-surface-raised border border-ink-border rounded text-ink-text-dim">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-ink-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
