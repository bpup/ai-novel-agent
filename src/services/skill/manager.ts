import type {
  SkillMode,
  SkillDefinition,
  ModelRef,
  AssembledPrompt,
} from "../../types/skill";
import {
  getSkillByFilePath,
  getProjectSkillPath,
  getCachedSkillBody,
} from "./loader";

const MODEL_CACHE_PREFIX = "ai-novel-agent-model-cache_";

const modelMemoryCache = new Map<string, Map<string, string>>();

function getModelCache(filePath: string): Map<string, string> {
  let cache = modelMemoryCache.get(filePath);
  if (!cache) {
    cache = new Map();
    modelMemoryCache.set(filePath, cache);
  }
  return cache;
}

export function getCachedModel(skillFilePath: string, modelFile: string): string | null {
  const memCache = getModelCache(skillFilePath);
  if (memCache.has(modelFile)) return memCache.get(modelFile)!;

  const key = MODEL_CACHE_PREFIX + skillFilePath + "::" + modelFile;
  const cached = localStorage.getItem(key);
  if (cached) {
    memCache.set(modelFile, cached);
  }
  return cached;
}

export function cacheModel(skillFilePath: string, modelFile: string, content: string): void {
  const memCache = getModelCache(skillFilePath);
  memCache.set(modelFile, content);
  try {
    localStorage.setItem(MODEL_CACHE_PREFIX + skillFilePath + "::" + modelFile, content);
  } catch {
    /* localStorage full — content stays in memory cache only */
  }
}

export function clearModelCache(skillFilePath: string): void {
  modelMemoryCache.delete(skillFilePath);
  const prefix = MODEL_CACHE_PREFIX + skillFilePath + "::";
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) localStorage.removeItem(key);
  }
}

export function resolveModels(
  modelIndex: ModelRef[],
  mode: SkillMode,
): ModelRef[] {
  const selected: ModelRef[] = [];
  const seen = new Set<string>();

  for (const ref of modelIndex) {
    if (seen.has(ref.file)) continue;
    const isAlwaysLoaded = ref.loadWhen.includes("always");
    const matchesMode = ref.loadWhen.includes(mode);

    if (isAlwaysLoaded || matchesMode) {
      selected.push(ref);
      seen.add(ref.file);
    }
  }

  return selected;
}

export function chatModeToSkillMode(chatMode: string): SkillMode {
  switch (chatMode) {
    case "continue": return "continue";
    case "brainstorm": return "brainstorm";
    default: return "continue";
  }
}

export function assemblePrompt(
  skill: SkillDefinition,
  mode: SkillMode,
): AssembledPrompt {
  const refs = resolveModels(skill.modelIndex, mode);
  const loadedModels: string[] = [];

  const identityCard = extractIdentityCard(skill.body);

  const modelBlocks: string[] = [];
  for (const ref of refs) {
    const content = getCachedModel(skill.filePath, ref.file);
    if (content) {
      modelBlocks.push(`## 模型: ${ref.name}\n\n${content}`);
      loadedModels.push(ref.file);
    }
  }

  const workflow = extractWorkflow(skill.body, mode);

  const parts: string[] = [];
  if (identityCard) parts.push(identityCard);
  parts.push("你是一位专业的小说作家。请严格按照以下创作风格和流程进行创作。");
  if (workflow) parts.push(workflow);
  if (modelBlocks.length > 0) parts.push(modelBlocks.join("\n\n---\n\n"));

  return {
    systemPrompt: parts.join("\n\n"),
    temperature: undefined,
    loadedModels,
  };
}

function extractIdentityCard(body: string): string {
  const match = body.match(/## 身份卡\n\n([\s\S]*?)(?=\n##\s|\n---\n|$)/);
  if (!match) return "";
  const content = match[1].trim();
  return content ? `## 身份卡\n\n${content}` : "";
}

function extractWorkflow(body: string, mode: SkillMode): string {
  const modeHeaders: Record<SkillMode, string> = {
    opening: "开篇模式",
    continue: "续写模式",
    character: "角色模式",
    world: "世界观模式",
    edit: "编辑模式",
    battle: "战斗模式",
    scene: "场景模式",
    brainstorm: "头脑风暴",
  };

  const header = modeHeaders[mode];
  if (!header) return "";

  const pattern = new RegExp(
    `####\\s+${escapeRegex(header)}\\n\`\`\`\\n([\\s\\S]*?)\`\`\``,
    "i",
  );
  const match = body.match(pattern);
  if (!match) return `\n## ${header}\n请按照「${header}」工作流进行创作。`;

  const content = match[1].trim();
  return `\n## ${header} 工作流\n\`\`\`\n${content}\n\`\`\``;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getSkillForProject(
  projectId: string,
): SkillDefinition | null {
  const skillPath = getProjectSkillPath(projectId);
  if (!skillPath) return null;

  const stored = getSkillByFilePath(skillPath);
  if (!stored) return null;

  const body = getCachedSkillBody(skillPath);
  if (!body) return null;

  return {
    filePath: stored.filePath,
    meta: stored.meta,
    body,
    modelIndex: stored.modelIndex,
    baseDir: stored.baseDir,
  };
}

export const skillManager = {
  resolveModels,
  assemblePrompt,
  chatModeToSkillMode,
  getSkillForProject,
  getCachedModel,
  cacheModel,
  clearModelCache,
};
