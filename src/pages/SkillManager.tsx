import { useState, useEffect } from "react";
import {
  getRegisteredSkills,
  scanSkillFiles,
  loadSkillViaDir,
  unregisterSkill,
} from "../services/skill/loader";
import { useToast } from "../components/common/Toast";
import type { SkillMeta } from "../types/skill";

interface StoredSkill {
  filePath: string;
  meta: SkillMeta;
  cachedAt: string;
}

export default function SkillManager() {
  const [skills, setSkills] = useState<StoredSkill[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const toast = useToast();

  useEffect(() => {
    refreshSkills();
  }, []);

  function refreshSkills() {
    setSkills(getRegisteredSkills());
  }

  async function handleImportDir() {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: "read" });
      setIsImporting(true);
      setImportCount(0);

      const files = await scanSkillFiles(dirHandle);
      for (const fileName of files) {
        try {
          await loadSkillViaDir(dirHandle, fileName);
          setImportCount((c) => c + 1);
        } catch {
          // skip unparseable files
        }
      }

      refreshSkills();
      toast.success(`成功导入 ${files.length} 个技能`);
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        toast.error("导入失败，请重试");
      }
    } finally {
      setIsImporting(false);
    }
  }

  function handleRemove(filePath: string) {
    const skill = skills.find((s) => s.filePath === filePath);
    const name = skill?.meta.name ?? filePath;
    if (!confirm(`确定移除写作灵魂 "${name}"？`)) return;
    unregisterSkill(filePath);
    refreshSkills();
    toast.success(`已移除 "${name}"`);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink-text font-(family-name:--font-display)">
            灵魂写手管理器
          </h1>
          <p className="text-sm text-ink-text-dim mt-1">
            管理已注册的写作灵魂技能，从本地 SKILL-*.md 文件中导入
          </p>
        </div>
        <button
          onClick={handleImportDir}
          disabled={isImporting}
          className="px-5 py-2.5 bg-amber text-ink-bg text-sm font-medium rounded-lg hover:bg-amber-hover disabled:opacity-50 disabled:cursor-not-allowed transition-ink"
        >
          {isImporting ? `导入中 (${importCount})...` : "+ 导入技能目录"}
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4 opacity-20">✧</div>
          <p className="text-ink-text-dim mb-2">暂无已注册的写作灵魂</p>
          <p className="text-xs text-ink-text-subtle mb-4">
            点击上方按钮导入一个包含 SKILL-*.md 文件的目录
          </p>
          <div className="bg-ink-surface border border-ink-border rounded-lg p-4 max-w-sm">
            <p className="text-xs text-ink-text-dim mb-2 font-medium">SKILL 文件格式示例：</p>
            <pre className="text-xs text-ink-text-subtle font-mono whitespace-pre-wrap">
{`---
name: 三境笔
description: |
  以"诗境、琴境、卦境"三重...
version: 1.0.0
author: 女娲 · 人格蒸馏
---
`}
            </pre>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => (
            <div
              key={skill.filePath}
              className="flex items-start gap-4 bg-ink-surface border border-ink-border rounded-lg p-4 hover:border-ink-border-focus transition-ink"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-subtle flex items-center justify-center shrink-0">
                <span className="text-amber text-lg font-display">✦</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-ink-text truncate">
                    {skill.meta.name}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-subtle text-amber font-medium">
                    v{skill.meta.version}
                  </span>
                </div>
                <p className="text-xs text-ink-text-dim line-clamp-2 mb-2">
                  {skill.meta.description || "无描述"}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-ink-text-subtle">
                  <span>作者：{skill.meta.author}</span>
                  <span className="font-mono text-[10px] opacity-60 truncate max-w-[200px]">
                    {skill.filePath}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRemove(skill.filePath)}
                className="px-3 py-1 text-xs text-error hover:bg-error-bg rounded transition-ink shrink-0"
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
