/**
 * 12 种命令 Prompt 模板
 * 每种命令返回适合发送给 LLM 的 prompt 文本。
 */

/** 1. 续写 — 基于已有内容自然流畅地继续 */
export function continueWriting(context: string): string {
  return [
    "请基于以下内容进行续写：",
    "",
    "=== 已有内容 ===",
    context,
    "",
    "请从续写内容开始，保持风格一致，确保情节衔接流畅。不要重复已有内容，直接输出续写结果。",
  ].join("\n");
}

/** 2. 扩写 — 增加细节描写、情感表达和场景渲染 */
export function expandWriting(text: string): string {
  return [
    "请扩写以下段落，增加更多细节描写、情感表达和场景渲染，使内容更加丰富生动：",
    "",
    "=== 待扩写段落 ===",
    text,
    "",
    "请直接输出扩写后的完整段落，保持原有风格和基调。",
  ].join("\n");
}

/** 3. 缩写/总结段落 — 精简提炼核心内容 */
export function summarizeText(text: string): string {
  return [
    "请将以下内容进行精简总结，保留核心情节和关键信息，去除冗余描述：",
    "",
    "=== 待总结内容 ===",
    text,
    "",
    "请输出简洁的总结，控制在原内容30%-50%的长度。",
  ].join("\n");
}

/** 4. 润色 — 保持原意前提下优化文笔 */
export function polishText(text: string): string {
  return [
    "请润色以下文字，保持原意和风格不变，优化措辞和句式，使文笔更加优美流畅：",
    "",
    "=== 待润色文字 ===",
    text,
    "",
    "请直接输出润色后的文字，不要添加解释。",
  ].join("\n");
}

/** 5. 改写语气 — 调整文字的情感语气 */
export function rewriteTone(text: string, tone: string = "formal"): string {
  const toneMap: Record<string, string> = {
    formal: "正式、庄重的语气",
    casual: "轻松、口语化的语气",
    literary: "文学性、富有诗意的语气",
    urgent: "紧张、急促的语气",
  };
  const toneDesc = toneMap[tone] ?? toneMap.formal;

  return [
    `请将以下文字改写为${toneDesc}：`,
    "",
    "=== 原文 ===",
    text,
    "",
    "请直接输出改写后的文字，保持原意不变。",
  ].join("\n");
}

/** 6. 检查错别字和语法 — 修正错别字、标点、句法错误 */
export function fixGrammar(text: string): string {
  return [
    "请检查以下文字的错别字、标点、语法和句法错误，并给出修改后的版本：",
    "",
    "=== 待检查文字 ===",
    text,
    "",
    "请直接输出修改后的完整文字。如果没有任何错误，请原样输出并注明「未发现错误」。",
  ].join("\n");
}

/** 7. 提取关键词 — 从文本中抽取关键元素 */
export function extractKeywords(text: string): string {
  return [
    "请从以下内容中提取关键信息，包括：人物、地点、事件、情感、主题。",
    "",
    "=== 源文本 ===",
    text,
    "",
    "请以结构化列表输出，每项一行，使用「类别：内容」格式。",
  ].join("\n");
}

/** 8. 自动分段 — 将连续文本合理分段 */
export function autoParagraph(text: string): string {
  return [
    "请将以下连续文本进行合理的段落划分，根据情节推进、场景切换、对话转折等因素分段：",
    "",
    "=== 待分段文本 ===",
    text,
    "",
    "请直接输出分段后的完整文本，段与段之间用空行分隔。",
  ].join("\n");
}

/** 9. 生成标题 — 为内容生成多个标题建议 */
export function generateTitle(text: string): string {
  return [
    "请为以下内容生成3-5个不同风格的标题：",
    "",
    "=== 内容摘要 ===",
    text,
    "",
    "请输出标题列表，每行一个，包含不同风格（如：诗意型、悬念型、简洁型）。",
  ].join("\n");
}

/** 10. 添加描写 — 为指定内容补充描写性文字 */
export function addDescription(text: string): string {
  return [
    "请为以下内容添加更多描写，包括环境描写、人物心理描写、动作细节等，使场景更加鲜活：",
    "",
    "=== 待补充的内容 ===",
    text,
    "",
    "请直接输出增强后的完整内容，将描写自然融入原文。",
  ].join("\n");
}

/** 11. 翻译 — 将中文翻译为英文（默认）或其他语言 */
export function translateText(text: string, targetLang: string = "English"): string {
  return [
    `请将以下中文内容翻译为${targetLang}：`,
    "",
    "=== 原文 ===",
    text,
    "",
    "请只输出翻译结果，不要添加原文或注释。",
  ].join("\n");
}

/** 13. 生成大纲 — 根据章节标题生成优化的大纲结构 */
export function generateOutline(context: string): string {
  return [
    "Based on the following chapters, suggest an improved outline structure with logical ordering:",
    "",
    context,
    "",
    "Return your response as a numbered list.",
  ].join("\n");
}

/** 12. 头脑风暴 — 为指定主题提供多个创意方向 */
export function brainstormIdeas(topic: string): string {
  return [
    "请针对以下主题进行头脑风暴，提供3-5个不同角度的创意方向：",
    "",
    `主题：${topic}`,
    "",
    "请发挥创意，每个方向包括核心创意点和简要说明。大胆想象，探索多种可能性。",
  ].join("\n");
}
