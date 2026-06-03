import type { ChatMessage } from "../../types/llm";

export interface ChatSession {
  id: string;
  projectId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "ai_novel_sessions";

function loadAll(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage full — silently degrade
  }
}

export const sessionStore = {
  getForProject(projectId: string): ChatSession[] {
    return loadAll()
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  get(sessionId: string): ChatSession | undefined {
    return loadAll().find((s) => s.id === sessionId);
  },

  save(session: ChatSession): void {
    const sessions = loadAll().filter((s) => s.id !== session.id);
    sessions.push({ ...session, updatedAt: Date.now() });
    saveAll(sessions);
  },

  delete(sessionId: string): void {
    const sessions = loadAll().filter((s) => s.id !== sessionId);
    saveAll(sessions);
  },

  deleteForProject(projectId: string): void {
    const sessions = loadAll().filter((s) => s.projectId !== projectId);
    saveAll(sessions);
  },

  generateTitle(content: string): string {
    return content.slice(0, 50).replace(/\n/g, " ") + (content.length > 50 ? "..." : "");
  },
};

export function saveSession(
  projectId: string,
  sessionId: string | undefined,
  messages: ChatMessage[],
): void {
  const id = sessionId || (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  sessionStore.save({
    id,
    projectId,
    title: sessionStore.generateTitle(messages[0]?.content ?? ""),
    messages,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}
