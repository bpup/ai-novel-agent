export type ChapterStatus = "draft" | "writing" | "done" | "paused";

export type InsertPosition = "cursor" | "replace" | "before" | "after";

export type MentionKind = "selection" | "chapter" | "project";

export interface MentionTarget {
  kind: MentionKind;
  label: string;
  chapterId?: string;
  chapterTitle?: string;
}

export interface RAGCitation {
  chapterId: string;
  chapterTitle: string;
  snippet: string;
  score?: number;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  citations?: RAGCitation[];
  mentions?: MentionTarget[];
  insertPosition?: InsertPosition;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  projectId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
