import { useState } from "react";
import type { WorldSetting } from "../../types/novel";

interface WorldSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ws: { name: string; description: string; category: string }) => void;
  worldSetting?: WorldSetting | null;
}

export default function WorldSettingModal({ isOpen, onClose, onSave, worldSetting }: WorldSettingModalProps) {
  const [name, setName] = useState(worldSetting?.name ?? "");
  const [description, setDescription] = useState(worldSetting?.description ?? "");
  const [category, setCategory] = useState(worldSetting?.category ?? "");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("名称不能为空");
      return;
    }
    onSave({ name: name.trim(), description: description.trim(), category: category.trim() });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-bg/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-ink-surface border border-ink-border rounded-xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-medium text-ink-text mb-4">
          {worldSetting ? "编辑世界观设定" : "新建世界观设定"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-text-dim mb-1">名称</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
              className="w-full px-3 py-2 text-sm bg-ink-surface-raised border border-ink-border rounded text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-1 focus:ring-amber/30 focus:border-amber" />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-xs text-ink-text-dim mb-1">描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm bg-ink-surface-raised border border-ink-border rounded text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-1 focus:ring-amber/30 focus:border-amber resize-none" />
          </div>
          <div>
            <label className="block text-xs text-ink-text-dim mb-1">类别</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
              placeholder="如: 地理、魔法、历史..." className="w-full px-3 py-2 text-sm bg-ink-surface-raised border border-ink-border rounded text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-1 focus:ring-amber/30 focus:border-amber" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs text-ink-text-dim hover:text-ink-text transition-ink">取消</button>
            <button type="submit"
              className="px-4 py-2 text-xs bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink">
              {worldSetting ? "保存" : "创建"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}