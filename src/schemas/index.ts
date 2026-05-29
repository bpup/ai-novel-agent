import { z } from "zod";

export const NovelProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ChapterSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string().min(1),
  content: z.string(),
  order: z.number().int().min(0),
});

export const CharacterSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  traits: z.array(z.string()),
});

export const WorldSettingSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string(),
  category: z.string(),
});

export const LLMConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "ollama"]),
  apiKey: z.string().optional(),
  modelName: z.string().min(1),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().positive(),
});

export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
});

export const RAGDocumentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.string()),
  embedding: z.array(z.number()).optional(),
});

export const SearchResultSchema = z.object({
  document: RAGDocumentSchema,
  score: z.number(),
});
