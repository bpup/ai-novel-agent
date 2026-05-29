export {
  parseSkillMarkdown,
  registerSkill,
  unregisterSkill,
  getRegisteredSkills,
  getSkillByFilePath,
  getCachedSkillBody,
  cacheSkillBody,
  loadSkillViaDir,
  scanSkillFiles,
  loadModelFromDir,
  getProjectSkillPath,
  setProjectSkill,
  clearProjectSkill,
} from "./loader";

export {
  resolveModels,
  assemblePrompt,
  chatModeToSkillMode,
  getSkillForProject,
  getCachedModel,
  cacheModel,
  clearModelCache,
  skillManager,
} from "./manager";

export {
  recordCorrection,
  getCorrections,
  deleteCorrection,
  clearCorrectionsForSkill,
  invalidateSkillCache,
} from "./correction";

export type {
  SkillMode,
  SkillMeta,
  ModelRef,
  SkillDefinition,
  ProjectSkill,
  ModelContent,
  AssembledPrompt,
  CorrectionRecord,
} from "../../types/skill";
