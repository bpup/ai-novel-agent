import type { LLMConfig } from "../../types/llm";

const STORAGE_KEY = "ai-novel-agent-llm-config";

const defaults: LLMConfig = {
  provider: "openai",
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 4096,
};

export function loadConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function saveConfig(config: LLMConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
