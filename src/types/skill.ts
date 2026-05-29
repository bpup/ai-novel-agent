/** Writing mode that determines which models to load from a skill. */
export type SkillMode =
  | "opening"      // 开篇/第一章
  | "continue"     // 续写/接着写
  | "character"    // 角色设计
  | "world"        // 世界观/修炼/势力
  | "edit"         // 润色/修文/检查
  | "battle"       // 战斗/打斗
  | "scene"        // 日常/对话/感情戏
  | "brainstorm";  // 头脑风暴/创意

/** Parsed from SKILL-*.md YAML frontmatter */
export interface SkillMeta {
  name: string;
  description: string;
  version: string;
  type: "skill";
  author: string;
  created: string;
  updated: string;
}

/** A single entry in the skill's model index table */
export interface ModelRef {
  /** Relative path from the skill file, e.g. "models/01-writing-core.md" */
  file: string;
  /** Display name, e.g. "01-writing-core" */
  name: string;
  /** Model IDs the file contains, e.g. ["模型1(笔境)", "模型4(士之骨)"] */
  models: string[];
  /** Modes that trigger this file, e.g. ["opening", "continue"] or ["始终加载"] */
  loadWhen: string[];
}

/** A fully parsed skill loaded from disk */
export interface SkillDefinition {
  /** Absolute file path */
  filePath: string;
  /** Parsed YAML frontmatter */
  meta: SkillMeta;
  /** Markdown body (identity card + model index + decision tree + workflows) */
  body: string;
  /** Parsed model index entries */
  modelIndex: ModelRef[];
  /** Directory containing this skill (for resolving model file paths) */
  baseDir: string;
}

/** Project-to-skill linkage stored in localStorage */
export interface ProjectSkill {
  projectId: string;
  skillFilePath: string;
}

/** Content of a loaded model file */
export interface ModelContent {
  /** File relative path */
  file: string;
  /** Full markdown content */
  content: string;
  /** Whether load succeeded */
  loaded: boolean;
}

/** The assembled system prompt for a given mode */
export interface AssembledPrompt {
  /** Skill identity + core models + mode-specific models */
  systemPrompt: string;
  /** Temperature override from skill config */
  temperature?: number;
  /** Which model files were loaded */
  loadedModels: string[];
}

/** Self-correction feedback record */
export interface CorrectionRecord {
  id: string;
  skillFilePath: string;
  /** Which chapter/context triggered the correction */
  context: string;
  /** What the AI suggested improving */
  suggestion: string;
  /** Which file was modified (skill or model) */
  targetFile: string;
  /** The actual diff applied */
  patch: string;
  createdAt: string;
}
