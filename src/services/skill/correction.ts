import type { CorrectionRecord } from "../../types/skill";
import { getSkillByFilePath, unregisterSkill } from "./loader";
import { clearModelCache } from "./manager";

const CORRECTIONS_KEY = "ai-novel-agent-skill-corrections";

function loadCorrections(): CorrectionRecord[] {
  try {
    const raw = localStorage.getItem(CORRECTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCorrections(records: CorrectionRecord[]): void {
  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(records));
}

export function getCorrections(skillFilePath?: string): CorrectionRecord[] {
  const all = loadCorrections();
  if (!skillFilePath) return all;
  return all.filter((r) => r.skillFilePath === skillFilePath);
}

export function recordCorrection(
  skillFilePath: string,
  context: string,
  suggestion: string,
  targetFile: string,
  patch: string,
): CorrectionRecord {
  const record: CorrectionRecord = {
    id: `corr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    skillFilePath,
    context,
    suggestion,
    targetFile,
    patch,
    createdAt: new Date().toISOString(),
  };

  const all = loadCorrections();
  all.push(record);
  saveCorrections(all);
  return record;
}

export function deleteCorrection(id: string): boolean {
  const all = loadCorrections();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;
  saveCorrections(filtered);
  return true;
}

export function clearCorrectionsForSkill(skillFilePath: string): void {
  const all = loadCorrections();
  saveCorrections(all.filter((r) => r.skillFilePath !== skillFilePath));
}

/**
 * After self-correction changes are applied (by user or AI), refresh the cached skill.
 * The skill must be re-registered to pick up the changes.
 */
export function invalidateSkillCache(skillFilePath: string): void {
  clearModelCache(skillFilePath);
  const skill = getSkillByFilePath(skillFilePath);
  if (skill) {
    unregisterSkill(skillFilePath);
  }
}
