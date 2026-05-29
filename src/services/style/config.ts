export type NovelTone = "严肃" | "轻松" | "悬疑" | "浪漫" | "史诗" | "日常";
export type NovelPOV = "第一人称" | "第三人称" | "第二人称";

export interface StyleConfig {
  temperature: number;
  maxTokens: number;
  tone: NovelTone;
  pov: NovelPOV;
}

export interface ProjectStyleOverride {
  projectId: string;
  config: Partial<StyleConfig>;
}

const GLOBAL_KEY = "ai-novel-agent-style-config";
const OVERRIDES_KEY = "ai-novel-agent-style-overrides";

const DEFAULT_STYLE: StyleConfig = {
  temperature: 0.8,
  maxTokens: 4096,
  tone: "轻松",
  pov: "第三人称",
};

const TONE_PROMPTS: Record<NovelTone, string> = {
  "严肃": "请使用严肃、庄重的写作风格，注重语言的准确性和深度。",
  "轻松": "请使用轻松、自然的写作风格，让读者感到舒适愉悦。",
  "悬疑": "请使用悬疑、紧张的写作风格，营造神秘感，设置巧妙的伏笔和转折。",
  "浪漫": "请使用浪漫、细腻的写作风格，注重情感表达和氛围营造。",
  "史诗": "请使用宏大、史诗般的写作风格，语言华丽而富有感染力。",
  "日常": "请使用朴实、生活化的写作风格，贴近日常，真实自然。",
};

const POV_PROMPTS: Record<NovelPOV, string> = {
  "第一人称": "请以第一人称视角（\"我\"）进行叙事。",
  "第三人称": "请以第三人称视角进行叙事。",
  "第二人称": "请以第二人称视角（\"你\"）进行叙事。",
};

export class StyleConfigService {
  private overrides: ProjectStyleOverride[] = [];

  constructor() {
    this.loadOverrides();
  }

  getGlobalConfig(): StyleConfig {
    try {
      const raw = localStorage.getItem(GLOBAL_KEY);
      if (!raw) return { ...DEFAULT_STYLE };
      return { ...DEFAULT_STYLE, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_STYLE };
    }
  }

  saveGlobalConfig(config: Partial<StyleConfig>): void {
    const current = this.getGlobalConfig();
    const merged = { ...current, ...config };
    localStorage.setItem(GLOBAL_KEY, JSON.stringify(merged));
  }

  getProjectConfig(projectId: string): StyleConfig {
    const global = this.getGlobalConfig();
    const override = this.overrides.find((o) => o.projectId === projectId);
    if (!override) return { ...global };
    return { ...global, ...override.config };
  }

  setProjectOverride(projectId: string, config: Partial<StyleConfig>): void {
    const idx = this.overrides.findIndex((o) => o.projectId === projectId);
    if (idx >= 0) {
      this.overrides[idx] = { projectId, config: { ...this.overrides[idx].config, ...config } };
    } else {
      this.overrides.push({ projectId, config });
    }
    this.saveOverrides();
  }

  clearProjectOverride(projectId: string): void {
    this.overrides = this.overrides.filter((o) => o.projectId !== projectId);
    this.saveOverrides();
  }

  getStylePrompt(projectId?: string): string {
    const config = projectId ? this.getProjectConfig(projectId) : this.getGlobalConfig();
    const parts: string[] = [];

    parts.push(`## 写作风格要求`);
    parts.push(`- 创造力温度: ${config.temperature.toFixed(1)} (0=保守, 2=创意)`);

    const tonePrompt = TONE_PROMPTS[config.tone];
    if (tonePrompt) parts.push(`- ${tonePrompt}`);

    const povPrompt = POV_PROMPTS[config.pov];
    if (povPrompt) parts.push(`- ${povPrompt}`);

    parts.push(`- 每次回复请控制在适中的长度范围内。`);

    return parts.join("\n");
  }

  private loadOverrides(): void {
    try {
      const raw = localStorage.getItem(OVERRIDES_KEY);
      if (raw) this.overrides = JSON.parse(raw);
    } catch {
      this.overrides = [];
    }
  }

  private saveOverrides(): void {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(this.overrides));
  }
}

export const styleConfig = new StyleConfigService();
