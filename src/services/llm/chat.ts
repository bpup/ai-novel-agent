import { createLLM } from "./factory";
import { loadConfig } from "./config";
import type { LLMConfig } from "../../types/llm";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

const NOVEL_SYSTEM_PROMPT = `你是一位专业的小说创作助手。你的职责是帮助作者进行小说构思、章节撰写、角色塑造和世界观构建。

创作原则：
1. 保持一致的叙事风格和语调
2. 深入了解角色动机和世界观设定
3. 提供具体、可操作的写作建议
4. 尊重作者的核心创意和意图

当你被要求续写时，请基于前面的内容保持连贯性。当你被要求修改时，请给出具体的改进方案。`;

export class ChatService {
  private model: BaseChatModel | null = null;
  private config: LLMConfig | null = null;

  private ensureModel(): BaseChatModel {
    const freshConfig = loadConfig();
    if (
      !this.model ||
      !this.config ||
      JSON.stringify(freshConfig) !== JSON.stringify(this.config)
    ) {
      this.config = freshConfig;
      this.model = createLLM(freshConfig);
    }
    return this.model;
  }

  /** @deprecated Config is now auto-reloaded each call; kept for backward compat. */
  updateConfig(config: LLMConfig): void {
    this.config = config;
    this.model = null;
  }

  async sendMessage(
    userMessage: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
    context?: string,
  ): Promise<string> {
    const model = this.ensureModel();
    const messages = this.buildMessages(userMessage, history, context);

    const response = await model.invoke(messages);
    const content = response.content;

    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("");
    }
    return "";
  }

  async *streamMessage(
    userMessage: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
    context?: string,
  ): AsyncGenerator<string> {
    const model = this.ensureModel();
    const messages = this.buildMessages(userMessage, history, context);

    const stream = await model.stream(messages);
    for await (const chunk of stream) {
      const content = chunk.content;
      if (typeof content === "string") {
        yield content;
      } else if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === "text" && "text" in part) {
            yield (part as { text: string }).text;
          }
        }
      }
    }
  }

  async continueWriting(
    previousContent: string,
    direction?: string,
    style?: string,
  ): Promise<string> {
    const prompt = [
      "请基于以下内容进行续写：",
      "",
      "=== 已有内容 ===",
      previousContent,
      "=== 续写说明 ===",
      direction
        ? `续写方向：${direction}`
        : "请自然流畅地继续故事，保持一致的风格。",
      style ? `写作风格要求：${style}` : "",
      "",
      "请直接从续写内容开始，不要重复已有内容。",
    ]
      .filter(Boolean)
      .join("\n");

    return this.sendMessage(prompt);
  }

  private buildMessages(
    userMessage: string,
    history: Array<{ role: "user" | "assistant"; content: string }>,
    context?: string,
  ) {
    const messages: (SystemMessage | HumanMessage | AIMessage)[] = [];

    let systemPrompt = NOVEL_SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\n## 当前上下文\n${context}`;
    }
    messages.push(new SystemMessage(systemPrompt));

    for (const msg of history) {
      if (msg.role === "user") {
        messages.push(new HumanMessage(msg.content));
      } else {
        messages.push(new AIMessage(msg.content));
      }
    }

    messages.push(new HumanMessage(userMessage));
    return messages;
  }
}

export const chatService = new ChatService();
