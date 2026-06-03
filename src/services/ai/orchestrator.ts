import type { ChatMessage, StreamEvent } from "../../types/llm";
import type { SearchResult } from "../../types/rag";
import type { SkillMode } from "../../types/skill";
import { chatService } from "../llm/chat";
import { ragEngine } from "../rag/engine";
import { styleConfig } from "../style/config";
import { personaService } from "../style/persona";
import { skillManager } from "../skill/manager";

const MAX_HISTORY = 20;

export class AIOrchestrator {
  private histories = new Map<string, ChatMessage[]>();
  private lastRefCounts = new Map<string, number>();

  getLastReferenceCount(projectId: string): number {
    return this.lastRefCounts.get(projectId) ?? 0;
  }

  private getOrCreateHistory(projectId: string): ChatMessage[] {
    let history = this.histories.get(projectId);
    if (!history) {
      history = [];
      this.histories.set(projectId, history);
    }
    return history;
  }

  private addToHistory(
    projectId: string,
    userMessage: string,
    assistantMessage: string,
  ): void {
    const history = this.getOrCreateHistory(projectId);
    const now = new Date().toISOString();

    history.push({ role: "user", content: userMessage, timestamp: now });
    history.push({ role: "assistant", content: assistantMessage, timestamp: now });

    while (history.length > MAX_HISTORY) {
      history.shift();
    }
  }

  private convertHistoryForLLM(
    messages: ChatMessage[],
  ): Array<{ role: "user" | "assistant"; content: string }> {
    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }

  private async buildRAGContext(
    projectId: string,
    query: string,
  ): Promise<string> {
    try {
      const result = await Promise.race([
        this.doRAGSearch(projectId, query),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("RAG search timed out")), 8000),
        ),
      ]);
      return result;
    } catch {
      return "";
    }
  }

  private async doRAGSearch(
    projectId: string,
    query: string,
  ): Promise<string> {
    const [contentResults, charResults, worldResults] = await Promise.all([
      ragEngine.searchContent(projectId, query, 5, "chapter"),
      ragEngine.searchCharacters(projectId, query, 3),
      ragEngine.searchWorldSettings(projectId, query, 3),
    ]);

    const allResults = [...contentResults, ...charResults, ...worldResults].filter(
      (r: SearchResult) => r.score > 0.3,
    );

    if (allResults.length === 0) {
      this.lastRefCounts.set(projectId, 0);
      return "";
    }

    this.lastRefCounts.set(projectId, allResults.length);

    const snippets = allResults.map(
      (r: SearchResult) => {
        const meta = r.document.metadata;
        const relevance = (r.score * 100).toFixed(1);
        let sourceTag = "";
        if (meta?.type === "chapter") {
          sourceTag = `[章节: ${meta.title || "未命名"}] [相似度: ${relevance}%]`;
        } else if (meta?.type === "character") {
          sourceTag = `[角色: ${meta.name}] [相似度: ${relevance}%]`;
        } else if (meta?.type === "world_setting") {
          sourceTag = `[设定: ${meta.name}] [相似度: ${relevance}%]`;
        }
        return sourceTag
          ? `${sourceTag}\n${r.document.content.trim()}`
          : r.document.content.trim();
      },
    );

    return `\n\n## 相关上下文（从你的小说项目中检索）\n${snippets.join("\n\n---\n\n")}`;
  }

  private async buildContext(
    projectId: string,
    query: string,
    mode?: SkillMode,
    additionalContext?: string,
  ): Promise<string> {
    const skill = skillManager.getSkillForProject(projectId);
    let stylePrompt: string;

    if (skill) {
      const resolvedMode = mode ?? "continue";
      const assembled = skillManager.assemblePrompt(skill, resolvedMode);
      stylePrompt = assembled.systemPrompt;
    } else {
      const persona = personaService.getForProject(projectId);
      stylePrompt = persona
        ? personaService.compileSystemPrompt(persona)
        : styleConfig.getStylePrompt(projectId);
    }

    const ragContext = await this.buildRAGContext(projectId, query);
    const parts = [stylePrompt, ragContext];
    if (additionalContext) {
      parts.push(`\n\n## 用户指定的上下文\n${additionalContext}`);
    }
    return parts.join("");
  }

  async chat(
    projectId: string,
    userMessage: string,
    additionalContext?: string,
  ): Promise<string> {
    const history = this.getOrCreateHistory(projectId);
    const llmHistory = this.convertHistoryForLLM(history);
    const context = await this.buildContext(projectId, userMessage, undefined, additionalContext);

    const response = await chatService.sendMessage(
      userMessage,
      llmHistory,
      context,
    );

    this.addToHistory(projectId, userMessage, response);
    return response;
  }

  async *streamChat(
    projectId: string,
    userMessage: string,
    additionalContext?: string,
  ): AsyncGenerator<StreamEvent> {
    const history = this.getOrCreateHistory(projectId);
    const llmHistory = this.convertHistoryForLLM(history);

    yield { type: "thinking", text: "正在分析写作上下文..." };
    const context = await this.buildContext(projectId, userMessage, undefined, additionalContext);

    yield { type: "thinking", text: "正在生成回复..." };

    let fullResponse = "";
    try {
      for await (const chunk of chatService.streamMessage(
        userMessage,
        llmHistory,
        context,
      )) {
        fullResponse += chunk;
        yield { type: "token", text: chunk };
      }

      this.addToHistory(projectId, userMessage, fullResponse);
      yield { type: "done", fullText: fullResponse };
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      yield { type: "error", message, retryable: true };
    }
  }

  async continueWriting(
    projectId: string,
    beforeText: string,
    afterHint?: string,
  ): Promise<string> {
    const searchText = beforeText.slice(-500);
    const context = await this.buildContext(projectId, searchText, "continue");

    const direction = afterHint ?? "请自然流畅地继续故事，保持一致的风格";

    const prompt = [
      "请基于以下内容进行续写：",
      "",
      "=== 已有内容 ===",
      beforeText.slice(-1000),
      "=== 续写说明 ===",
      direction,
      "",
      "请直接从续写内容开始，不要重复已有内容。",
    ].join("\n");

    return chatService.sendMessage(prompt, [], context);
  }

  async brainstorm(
    projectId: string,
    topic: string,
  ): Promise<string> {
    const context = await this.buildContext(projectId, topic, "brainstorm");
    const brainstormContext =
      context +
      "\n\n## 头脑风暴模式\n请发挥创造力，提供多个不同角度的想法和可能性。不要局限于单一方案，探索多样的叙事方向。鼓励大胆想象，给出 3-5 个不同的创意方向。";

    const prompt = `请针对以下主题进行头脑风暴，提供多个创意方向：\n\n${topic}`;

    return chatService.sendMessage(prompt, [], brainstormContext);
  }

  async polishText(
    projectId: string,
    selectedText: string,
    surroundingContext?: string,
  ): Promise<string> {
    const context = await this.buildContext(projectId, selectedText, "edit");

    const prompt = [
      "请润色以下文字，保持原意和风格，使文笔更加优美流畅：",
      "",
      surroundingContext ? "=== 上下文 ===" : "",
      surroundingContext ?? "",
      surroundingContext ? "" : "",
      "=== 待润色文字 ===",
      selectedText,
      "",
      "请直接输出润色后的文字，不要添加解释。",
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    return chatService.sendMessage(prompt, [], context);
  }

  async expandText(
    projectId: string,
    selectedText: string,
    surroundingContext?: string,
  ): Promise<string> {
    const context = await this.buildContext(projectId, selectedText, "edit");

    const prompt = [
      "请扩写以下段落，增加更多细节、描写和情感表达，使内容更加丰满：",
      "",
      surroundingContext ? "=== 上下文 ===" : "",
      surroundingContext ?? "",
      surroundingContext ? "" : "",
      "=== 待扩写段落 ===",
      selectedText,
      "",
      "请直接输出扩写后的完整段落，不要添加解释。",
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    return chatService.sendMessage(prompt, [], context);
  }

  clearHistory(projectId: string): void {
    this.histories.delete(projectId);
  }

  getHistory(projectId: string): ChatMessage[] {
    return [...this.getOrCreateHistory(projectId)];
  }
}

export const aiOrchestrator = new AIOrchestrator();
