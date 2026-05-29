import { useState, useMemo, useCallback } from "react";
import type { ChatSession } from "../../types/chat";

interface ChatHistoryProps {
  projectId: string;
  activeSessionId?: string;
  onSelect: (sessionId: string) => void;
}

function getStorageKey(projectId: string): string {
  return `chat_sessions_${projectId}`;
}

function loadSessions(projectId: string): ChatSession[] {
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveSessions(projectId: string, sessions: ChatSession[]): void {
  localStorage.setItem(getStorageKey(projectId), JSON.stringify(sessions));
}

function extractTitle(session: ChatSession): string {
  if (session.title.trim()) return session.title;
  const firstUserMsg = session.messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "新对话";
  return firstUserMsg.content.slice(0, 30);
}

function createEmptySession(projectId: string): ChatSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    projectId,
    title: "新对话",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function ChatHistory({
  projectId,
  activeSessionId,
  onSelect,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    loadSessions(projectId),
  );
  const [search, setSearch] = useState("");

  const sortedSessions = useMemo(() => {
    return [...sessions].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sortedSessions;
    const query = search.toLowerCase();
    return sortedSessions.filter((s) =>
      extractTitle(s).toLowerCase().includes(query),
    );
  }, [sortedSessions, search]);

  const handleCreate = useCallback(() => {
    const newSession = createEmptySession(projectId);
    const updated = [newSession, ...sessions];
    setSessions(updated);
    saveSessions(projectId, updated);
    setSearch("");
    onSelect(newSession.id);
  }, [projectId, sessions, onSelect]);

  const handleDelete = useCallback(
    (sessionId: string) => {
      if (!window.confirm("确定要删除这个会话吗？")) return;
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      saveSessions(projectId, updated);
    },
    [projectId, sessions],
  );

  const handleSelect = useCallback(
    (sessionId: string) => {
      onSelect(sessionId);
    },
    [onSelect],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-700">
        <input
          type="text"
          placeholder="搜索历史会话..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-800 text-gray-200 text-sm rounded px-2 py-1.5
                     border border-gray-700 placeholder-gray-500
                     focus:outline-none focus:border-sage/60"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-gray-500">
            暂无历史会话
          </div>
        ) : (
          <ul className="py-1">
            {filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const title = extractTitle(session);

              return (
                <li key={session.id} role="listitem">
                  <button
                    type="button"
                    onClick={() => handleSelect(session.id)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors
                      flex items-center justify-between group
                      ${
                        isActive
                          ? "bg-sage/15 text-sage border-l-2 border-sage"
                          : "text-gray-300 hover:bg-gray-800 border-l-2 border-transparent"
                      }`}
                  >
                    <span className="truncate flex-1 mr-2">{title}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(session.id);
                      }}
                      className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100
                                 transition-opacity px-1 py-0.5 rounded"
                      title="删除会话"
                    >
                      删除
                    </button>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-700">
        <button
          type="button"
          onClick={handleCreate}
          className="w-full text-sm text-sage hover:text-sage/80 py-1.5 rounded
                     border border-sage/30 hover:border-sage/50 transition-colors"
        >
          + 新建对话
        </button>
      </div>
    </div>
  );
}
