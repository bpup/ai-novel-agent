const STORAGE_KEY = "ink-vellum-prompt-templates";

export interface PromptTemplates {
  systemPrompt: string;
  writingInstructions: string;
}

const defaults: PromptTemplates = {
  systemPrompt: "你是一位专业的小说创作助手，帮助作家完成故事创作。你的任务是理解作者的意图，提供有深度的建议和创作内容。",
  writingInstructions: "保持文学性，注重人物刻画和场景描写。回复使用中文。",
};

export function loadPromptTemplates(): PromptTemplates {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PromptTemplates>;
      return { ...defaults, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaults;
}

export function savePromptTemplates(templates: PromptTemplates): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}
