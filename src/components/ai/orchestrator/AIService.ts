import type { RAGCitation } from "../../../types/chat";
import * as prompts from "./prompts";
import { chatService } from "../../../services/llm/chat";

export interface AIServiceResult {
  result: string;
  citations?: RAGCitation[];
  metadata?: { command: string; durationMs: number };
}

export interface AIServiceOptions {
  stream?: boolean;
  onToken?: (token: string) => void;
  onComplete?: (result: AIServiceResult) => void;
}

type PromptFn = (input: string, ...args: string[]) => string;

const COMMAND_MAP: Record<string, PromptFn> = {
  continue: prompts.continueWriting,
  expand: prompts.expandWriting,
  summarize: prompts.summarizeText,
  polish: prompts.polishText,
  rewrite_tone: prompts.rewriteTone,
  fix_grammar: prompts.fixGrammar,
  extract_keywords: prompts.extractKeywords,
  auto_paragraph: prompts.autoParagraph,
  generate_title: prompts.generateTitle,
  add_description: prompts.addDescription,
  translate: prompts.translateText,
  brainstorm: prompts.brainstormIdeas,
  generate_outline: prompts.generateOutline,
};

export class AIService {
  async execute(
    command: string,
    input: string,
    context?: string,
    _options?: AIServiceOptions,
  ): Promise<AIServiceResult> {
    const t0 = performance.now();

    try {
      const promptFn = COMMAND_MAP[command];
      if (!promptFn) {
        return {
          result: "",
          metadata: { command, durationMs: performance.now() - t0 },
        };
      }

      const prompt = promptFn(input);
      const result = await chatService.sendMessage(prompt, [], context);

      return {
        result,
        metadata: { command, durationMs: performance.now() - t0 },
      };
    } catch (err) {
      console.error(`AIService.execute("${command}") failed:`, err);
      return {
        result: "",
        metadata: { command, durationMs: performance.now() - t0 },
      };
    }
  }

  async *executeStream(
    command: string,
    input: string,
    context?: string,
  ): AsyncGenerator<string> {
    const promptFn = COMMAND_MAP[command];
    if (!promptFn) return;

    const prompt = promptFn(input);

    try {
      for await (const chunk of chatService.streamMessage(prompt, [], context)) {
        yield chunk;
      }
    } catch (err) {
      console.error(`AIService.executeStream("${command}") failed:`, err);
    }
  }
}

export const aiService = new AIService();
