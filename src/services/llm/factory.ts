import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOllama } from "@langchain/ollama";
import type { LLMConfig } from "../../types/llm";

export function createLLM(config: LLMConfig) {
  switch (config.provider) {
    case "openai":
      return new ChatOpenAI({
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        apiKey: config.apiKey || undefined,
        configuration: config.baseUrl
          ? { baseURL: config.baseUrl }
          : undefined,
      });

    case "anthropic":
      return new ChatAnthropic({
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        apiKey: config.apiKey || undefined,
        anthropicApiUrl: config.baseUrl,
      });

    case "ollama":
      return new ChatOllama({
        model: config.modelName,
        temperature: config.temperature,
        maxRetries: 2,
        baseUrl: config.baseUrl || "http://localhost:11434",
      });

    case "deepseek":
      return new ChatOpenAI({
        modelName: config.modelName || "deepseek-chat",
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        apiKey: config.apiKey || undefined,
        configuration: {
          baseURL: config.baseUrl || "https://api.deepseek.com/v1",
        },
      });

    case "custom":
      return new ChatOpenAI({
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        apiKey: config.apiKey || undefined,
        configuration: {
          baseURL: config.baseUrl || "https://api.openai.com/v1",
        },
      });

    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}
