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
}
