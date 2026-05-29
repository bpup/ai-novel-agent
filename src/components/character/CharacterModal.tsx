import { useState } from "react";
import type { Character } from "../../types/novel";

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: { name: string; description: string; traits: string[] }) => void;
  character?: Character | null;
}

export default function CharacterModal({ isOpen, onClose, onSave, character }: CharacterModalProps) {
  const [name, setName] = useState(character?.name ?? "");
  const [description, setDescription] = useState(character?.description ?? "");
  const [traits, setTraits] = useState<string[]>(character?.traits ?? []);
  const [traitInput, setTraitInput] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function handleAddTrait() {
    const trimmed = traitInput.trim();
    if (trimmed && !traits.includes(trimmed)) {
      setTraits([...traits, trimmed]);
    }
    setTraitInput("");
  }

  function handleRemoveTrait(trait: string) {
    setTraits(traits.filter((t) => t !== trait));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("角色名称不能为空");
      return;
    }
    onSave({ name: name.trim(), description: description.trim(), traits });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-bg/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-ink-surface border border-ink-border rounded-xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-medium text-ink-text mb-4">
          {character ? "编辑角色" : "新建角色"}
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
            <label className="block text-xs text-ink-text-dim mb-1">特征</label>
            <div className="flex gap-1 mb-2 flex-wrap">
              {traits.map((trait) => (
                <span key={trait} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-subtle text-amber rounded-full">
                  {trait}
                  <button type="button" onClick={() => handleRemoveTrait(trait)} className="text-amber/60 hover:text-amber">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={traitInput} onChange={(e) => setTraitInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTrait(); } }}
                placeholder="输入特征按回车添加" className="flex-1 px-3 py-1.5 text-xs bg-ink-surface-raised border border-ink-border rounded text-ink-text placeholder:text-ink-text-subtle focus:outline-none" />
              <button type="button" onClick={handleAddTrait}
                className="px-3 py-1.5 text-xs bg-ink-surface-hover text-ink-text rounded hover:bg-ink-border transition-ink">添加</button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-xs text-ink-text-dim hover:text-ink-text transition-ink">取消</button>
            <button type="submit"
              className="px-4 py-2 text-xs bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink">
              {character ? "保存" : "创建"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}