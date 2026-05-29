import type { SkillMeta, SkillDefinition, ModelRef, ModelContent } from "../../types/skill";

const SKILL_REGISTRY_KEY = "ai-novel-agent-skill-registry";
const SKILL_CONTENT_PREFIX = "ai-novel-agent-skill-content_";
const PROJECT_SKILL_KEY = "ai-novel-agent-project-skills";

/** A skill's metadata as stored in localStorage */
interface StoredSkill {
  filePath: string;
  meta: SkillMeta;
  modelIndex: ModelRef[];
  baseDir: string;
  cachedAt: string;
}

interface SkillRegistry {
  skills: StoredSkill[];
}

function parseYamlFrontmatter(markdown: string): { meta: Record<string, unknown>; body: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: markdown };
  const yamlBlock = match[1];
  const body = match[2];
  const meta: Record<string, unknown> = {};
  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    if (key === "description") value = value.replace(/^\|\s*/, "").trim();
    meta[key] = value;
  }
  return { meta, body };
}

function parseModelIndex(body: string): ModelRef[] {
  const refs: ModelRef[] = [];
  const lines = body.split("\n");
  let inTable = false;

  for (const line of lines) {
    if (line.includes("|") && (line.includes("模型文件") || line.includes("包含模型"))) {
      inTable = true;
      continue;
    }
    if (inTable && !line.startsWith("|")) { inTable = false; continue; }
    if (!inTable) continue;

    const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;

    const filePath = extractLink(cols[0]);
    if (!filePath) continue;

    refs.push({
      file: filePath,
      name: filePath.split("/").pop()?.replace(".md", "") ?? filePath,
      models: parseModels(cols[1]),
      loadWhen: parseLoadWhen(cols[2]),
    });
  }

  return refs;
}

function extractLink(cell: string): string | null {
  const m = cell.match(/\[.+?\]\((.+?)\)/);
  return m ? m[1] : null;
}

function parseModels(cell: string): string[] {
  return [...cell.matchAll(/模型\d+/g)].map((m) => m[0]);
}

function parseLoadWhen(cell: string): string[] {
  const t = cell.trim();
  if (t.includes("始终加载")) return ["always"];
  if (t === "-") return [];
  const results: string[] = [];
  const kw: Record<string, string[]> = {
    "开篇": ["opening"], "首章": ["opening"],
    "大纲": ["opening", "continue"], "规划": ["opening", "continue"],
    "结构": ["opening", "edit"], "爽点": ["opening", "continue"],
    "钩子": ["opening", "continue"], "反转": ["opening", "continue", "battle"],
    "角色": ["character"], "创建": ["character"],
    "修改": ["character", "edit"], "感情线": ["character", "scene"],
    "感情": ["character", "scene"], "性格": ["character", "scene"],
    "世界观": ["world"], "修炼": ["world"],
    "势力": ["world"], "地理": ["world"],
    "对话": ["scene"], "情感": ["scene"],
    "战斗": ["battle"], "打斗": ["battle"],
    "伏笔": ["opening", "continue", "edit"],
    "润色": ["edit"], "修文": ["edit"],
    "审查": ["edit"], "质量": ["edit"], "检查": ["edit"],
  };
  for (const [k, modes] of Object.entries(kw)) {
    if (t.includes(k)) for (const m of modes) { if (!results.includes(m)) results.push(m); }
  }
  return results;
}

function parseMeta(raw: Record<string, unknown>): SkillMeta {
  return {
    name: String(raw.name ?? "未命名 Skill"),
    description: String(raw.description ?? ""),
    version: String(raw.version ?? "0.1.0"),
    type: "skill",
    author: String(raw.author ?? "unknown"),
    created: String(raw.created ?? ""),
    updated: String(raw.updated ?? raw.created ?? ""),
  };
}

export function parseSkillMarkdown(markdown: string, filePath: string): SkillDefinition {
  const { meta: rawMeta, body } = parseYamlFrontmatter(markdown);
  const baseDir = filePath.substring(0, filePath.lastIndexOf("/"));
  return {
    filePath,
    meta: parseMeta(rawMeta),
    body,
    modelIndex: parseModelIndex(body),
    baseDir,
  };
}

function loadRegistry(): SkillRegistry {
  try {
    const r = localStorage.getItem(SKILL_REGISTRY_KEY);
    return r ? JSON.parse(r) : { skills: [] };
  } catch { return { skills: [] }; }
}

function saveRegistry(reg: SkillRegistry): void {
  localStorage.setItem(SKILL_REGISTRY_KEY, JSON.stringify(reg));
}

export function getRegisteredSkills(): StoredSkill[] { return loadRegistry().skills; }

export function getSkillByFilePath(filePath: string): StoredSkill | undefined {
  return loadRegistry().skills.find((s) => s.filePath === filePath);
}

export function registerSkill(def: SkillDefinition): void {
  const r = loadRegistry();
  const idx = r.skills.findIndex((s) => s.filePath === def.filePath);
  const stored: StoredSkill = {
    filePath: def.filePath,
    meta: def.meta,
    modelIndex: def.modelIndex,
    baseDir: def.baseDir,
    cachedAt: new Date().toISOString(),
  };
  if (idx >= 0) r.skills[idx] = stored;
  else r.skills.push(stored);
  saveRegistry(r);
}

export function unregisterSkill(filePath: string): void {
  const r = loadRegistry();
  r.skills = r.skills.filter((s) => s.filePath !== filePath);
  saveRegistry(r);

  const ps = loadProjectSkillMap();
  let changed = false;
  for (const pid of Object.keys(ps)) {
    if (ps[pid] === filePath) { delete ps[pid]; changed = true; }
  }
  if (changed) localStorage.setItem(PROJECT_SKILL_KEY, JSON.stringify(ps));
}

export function getCachedSkillBody(filePath: string): string | null {
  return localStorage.getItem(SKILL_CONTENT_PREFIX + filePath);
}

export function cacheSkillBody(filePath: string, body: string): void {
  try { localStorage.setItem(SKILL_CONTENT_PREFIX + filePath, body); } catch { /* too large */ }
}

async function navigatePath(
  dirHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<FileSystemFileHandle | null> {
  const parts = relativePath.split("/");
  let current: FileSystemDirectoryHandle | FileSystemFileHandle = dirHandle;
  for (let i = 0; i < parts.length; i++) {
    if (i === parts.length - 1) {
      return await (current as FileSystemDirectoryHandle).getFileHandle(parts[i]);
    }
    current = await (current as FileSystemDirectoryHandle).getDirectoryHandle(parts[i]);
  }
  return null;
}

export async function loadSkillViaDir(
  dirHandle: FileSystemDirectoryHandle,
  skillFileName: string,
): Promise<SkillDefinition | null> {
  const fh = await dirHandle.getFileHandle(skillFileName);
  const file = await fh.getFile();
  const content = await file.text();
  const filePath = `${dirHandle.name}/${skillFileName}`;
  const skill = parseSkillMarkdown(content, filePath);
  registerSkill(skill);
  cacheSkillBody(filePath, content);
  return skill;
}

export async function scanSkillFiles(
  dirHandle: FileSystemDirectoryHandle,
): Promise<string[]> {
  const names: string[] = [];
  for await (const [name] of Object.entries(dirHandle)) {
    if (name.startsWith("SKILL-") && name.endsWith(".md")) names.push(name);
  }
  return names;
}

export async function loadModelFromDir(
  dirHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<ModelContent> {
  try {
    const fh = await navigatePath(dirHandle, relativePath);
    if (!fh) return { file: relativePath, content: "", loaded: false };
    const file = await fh.getFile();
    return { file: relativePath, content: await file.text(), loaded: true };
  } catch {
    return { file: relativePath, content: "", loaded: false };
  }
}

function loadProjectSkillMap(): Record<string, string> {
  try {
    const r = localStorage.getItem(PROJECT_SKILL_KEY);
    return r ? JSON.parse(r) : {};
  } catch { return {}; }
}

export function getProjectSkillPath(projectId: string): string | null {
  return loadProjectSkillMap()[projectId] ?? null;
}

export function setProjectSkill(projectId: string, skillFilePath: string): void {
  const m = loadProjectSkillMap();
  m[projectId] = skillFilePath;
  localStorage.setItem(PROJECT_SKILL_KEY, JSON.stringify(m));
}

export function clearProjectSkill(projectId: string): void {
  const m = loadProjectSkillMap();
  delete m[projectId];
  localStorage.setItem(PROJECT_SKILL_KEY, JSON.stringify(m));
}
