import { useState, useRef, useEffect } from "react";
import { getRegisteredSkills } from "../../services/skill/loader";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string, skillPath: string) => void;
}

export default function CreateProjectModal({
  open,
  onClose,
  onCreate,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillPath, setSkillPath] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const skills = getRegisteredSkills();

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setSkillPath("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim(), skillPath);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-bg/70 backdrop-blur-sm">
      <div className="bg-ink-surface-raised border border-ink-border rounded-lg shadow-ink-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-ink-text font-(family-name:--font-display) mb-4">新建项目</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-text-dim mb-1">
              项目标题
            </label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给我的小说起个名字..."
              className="w-full px-3 py-2 bg-ink-surface border border-ink-border rounded-lg text-sm text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink-text-dim mb-1">
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述你的故事..."
              rows={3}
              className="w-full px-3 py-2 bg-ink-surface border border-ink-border rounded-lg text-sm text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber resize-none"
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-ink-text-dim mb-1">
              写作灵魂
            </label>
            {skills.length === 0 ? (
              <p className="text-xs text-ink-text-subtle py-2">
                暂无已注册的写作灵魂 — 可在设置中导入
              </p>
            ) : (
              <select
                value={skillPath}
                onChange={(e) => setSkillPath(e.target.value)}
                className="w-full px-3 py-2 bg-ink-surface border border-ink-border rounded-lg text-sm text-ink-text focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber"
              >
                <option value="">通用模式（不使用技能）</option>
                {skills.map((s) => (
                  <option key={s.filePath} value={s.filePath}>
                    {s.meta.name} — {s.meta.author}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-ink-text-dim hover:text-ink-text transition-ink"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-sm bg-amber text-ink-bg rounded-lg hover:bg-amber-hover disabled:opacity-40 disabled:cursor-not-allowed transition-ink"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
