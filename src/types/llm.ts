export type LLMProvider = "openai" | "anthropic" | "ollama" | "deepseek" | "custom";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  modelName: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
  citations?: { chapterId: string; chapterTitle: string; snippet: string }[];
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  thinking?: string[];
  isError?: boolean;
  isRetryable?: boolean;
  errorMessage?: string;
}

export type StreamEvent =
  | { type: "thinking"; text: string }
  | { type: "token"; text: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; result: string }
  | { type: "done"; fullText: string }
  | { type: "error"; message: string; retryable: boolean };
