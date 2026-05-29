import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadConfig, saveConfig } from "../services/llm/config";
import { getRegisteredSkills } from "../services/skill/loader";
import type { LLMConfig } from "../types/llm";
import type { SkillMeta } from "../types/skill";

interface StoredSkill {
  filePath: string;
  meta: SkillMeta;
}

const PROVIDERS: Array<{ key: LLMConfig["provider"]; label: string }> = [
  { key: "openai", label: "OpenAI" },
  { key: "deepseek", label: "DeepSeek" },
  { key: "anthropic", label: "Anthropic" },
  { key: "ollama", label: "Ollama（本地）" },
  { key: "custom", label: "自定义" },
];

const MODEL_SUGGESTIONS: Record<string, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  anthropic: ["claude-3-5-sonnet-latest", "claude-3-opus-latest", "claude-3-haiku-latest"],
  ollama: ["llama3", "mistral", "qwen2.5", "phi3"],
  custom: ["moonshot-v1-8k", "glm-4", "gemini-1.5-flash", "groq-llama3-70b"],
};

export default function Settings() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LLMConfig>(loadConfig);
  const [skills, setSkills] = useState<StoredSkill[]>([]);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setSkills(getRegisteredSkills());
  }, []);

  function updateConfig<K extends keyof LLMConfig>(key: K, value: LLMConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-text mb-6 font-(family-name:--font-display)">设置</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-ink-text mb-4">LLM 提供商</h2>
        <div className="bg-ink-surface rounded-lg border border-ink-border p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-text-dim mb-2">
              提供商
            </label>
            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => updateConfig("provider", p.key)}
                  className={`px-4 py-2 text-sm rounded-lg transition-ink ${
                    config.provider === p.key
                      ? "bg-amber text-ink-bg"
                      : "bg-ink-surface-hover text-ink-text-dim hover:text-ink-text"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-text-dim mb-1">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showKey ? "text" : "password"}
                value={config.apiKey ?? ""}
                onChange={(e) => updateConfig("apiKey", e.target.value || undefined)}
                placeholder="输入 API Key..."
                className="flex-1 px-3 py-2 bg-ink-surface-raised border border-ink-border rounded-lg text-sm font-(family-name:--font-mono) text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-2 text-xs bg-ink-surface-hover text-ink-text-dim rounded-lg hover:text-amber transition-ink"
              >
                {showKey ? "隐藏" : "显示"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-text-dim mb-1">
              模型名称
            </label>
            <div className="flex gap-2 flex-wrap">
              {(MODEL_SUGGESTIONS[config.provider] ?? []).map((model) => (
                <button
                  key={model}
                  onClick={() => updateConfig("modelName", model)}
                  className={`px-3 py-1 text-xs rounded-lg transition-ink ${
                    config.modelName === model
                      ? "bg-amber-subtle text-amber border border-amber/30"
                      : "bg-ink-surface-hover text-ink-text-dim border border-ink-border hover:text-ink-text"
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={config.modelName}
              onChange={(e) => updateConfig("modelName", e.target.value)}
              placeholder="或输入自定义模型名..."
              className="mt-2 w-full px-3 py-2 bg-ink-surface-raised border border-ink-border rounded-lg text-sm text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber"
            />
          </div>

          {(config.provider === "ollama" || config.provider === "deepseek" || config.provider === "custom") && (
            <div>
              <label className="block text-sm font-medium text-ink-text-dim mb-1">
                Base URL
              </label>
              <input
                type="text"
                value={config.baseUrl ?? ""}
                onChange={(e) =>
                  updateConfig("baseUrl", e.target.value || undefined)
                }
                placeholder={
                  config.provider === "ollama"
                    ? "http://localhost:11434"
                    : config.provider === "deepseek"
                      ? "https://api.deepseek.com/v1"
                      : "https://api.openai.com/v1"
                }
                className="w-full px-3 py-2 bg-ink-surface-raised border border-ink-border rounded-lg text-sm text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber"
              />
              {config.provider === "custom" && (
                <p className="mt-1 text-xs text-ink-text-subtle">
                  支持任何 OpenAI 兼容 API：Moonshot、Groq、智谱、硅基流动等
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink-text">写作灵魂</h2>
          <button
            onClick={() => navigate("/skills")}
            className="text-xs text-amber hover:text-amber-hover transition-ink"
          >
            全部管理 →
          </button>
        </div>
        <div className="bg-ink-surface rounded-lg border border-ink-border p-5">
          {skills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-ink-text-dim mb-3">
                暂无已注册的写作灵魂
              </p>
              <p className="text-xs text-ink-text-subtle mb-4">
                在「灵魂写手」页面导入包含 SKILL-*.md 文件的目录，然后创建项目时即可选择
              </p>
              <button
                onClick={() => navigate("/skills")}
                className="px-4 py-2 text-sm bg-amber text-ink-bg rounded-lg hover:bg-amber-hover transition-ink"
              >
                前往导入
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {skills.slice(0, 5).map((skill) => (
                <div
                  key={skill.filePath}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-surface-hover"
                >
                  <span className="w-8 h-8 rounded-md bg-amber-subtle flex items-center justify-center shrink-0">
                    <span className="text-amber text-sm font-display">✦</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-text truncate">
                      {skill.meta.name}
                    </p>
                    <p className="text-[11px] text-ink-text-dim truncate">
                      {skill.meta.author} · v{skill.meta.version}
                    </p>
                  </div>
                </div>
              ))}
              {skills.length > 5 && (
                <p className="text-xs text-ink-text-subtle text-center pt-1">
                  还有 {skills.length - 5} 个技能未显示 —
                  <button
                    onClick={() => navigate("/skills")}
                    className="text-amber hover:underline ml-1"
                  >
                    查看全部
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-amber text-ink-bg text-sm font-medium rounded-lg hover:bg-amber-hover transition-ink"
        >
          保存设置
        </button>
        {saved && (
          <span className="text-sm text-sage">已保存</span>
        )}
      </div>
    </div>
  );
}
