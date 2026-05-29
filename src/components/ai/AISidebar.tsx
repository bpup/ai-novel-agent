import { useState, useCallback, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { aiOrchestrator } from "../../services/ai/orchestrator";
import ChatMessages from "./ChatMessages";
import ChatInput, { type ChatMode } from "./ChatInput";
import ChatHistory from "./ChatHistory";
import { contextBus } from "./orchestrator/ContextBus";
import { useToast } from "../common/Toast";
import { loadConfig } from "../../services/llm/config";
import { personaService } from "../../services/style/persona";
import { getRegisteredSkills, setProjectSkill, getProjectSkillPath, clearProjectSkill } from "../../services/skill/loader";
import type { PersonaProfile } from "../../types/novel";
import type { ChatMessage } from "../../types/llm";
import type { ChatSession } from "../../types/chat";

interface AISidebarProps {
  editor: Editor | null;
  projectId: string;
}

type QuickAction = "continue" | "polish" | "expand" | null;

const ACTION_LABELS: Record<NonNullable<QuickAction>, string> = {
  continue: "续写",
  polish: "润色",
  expand: "扩写",
};

export default function AISidebar({ editor, projectId }: AISidebarProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    aiOrchestrator.getHistory(projectId),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [referenceCount, setReferenceCount] = useState(0);
  const [quickAction, setQuickAction] = useState<QuickAction>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [personas] = useState<PersonaProfile[]>(() => personaService.getAll());
  const [activePersonaId, setActivePersonaId] = useState<string>(() => {
    const projectPersona = personaService.getForProject(projectId);
    return projectPersona?.id ?? personaService.getAll()[0]?.id ?? "";
  });
  const [skills] = useState(() => getRegisteredSkills());
  const [activeSkillFilePath, setActiveSkillFilePath] = useState<string>(() => {
    return getProjectSkillPath(projectId) ?? "";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    contextBus.setProjectContext({
      id: projectId,
      title: "",
      description: "",
    });
    contextBus.setEditor(editor);
  }, [projectId, editor]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const getEditorContext = useCallback(() => {
    if (!editor) return { selectedText: "", beforeText: "", afterText: "" };
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    const selectedText = doc.textBetween(from, to, "\n");
    const beforeStart = Math.max(0, from - 500);
    const beforeText = doc.textBetween(beforeStart, from, "\n");
    const afterEnd = Math.min(doc.content.size, to + 200);
    const afterText = doc.textBetween(to, afterEnd, "\n");

    contextBus.setSelectionContext({
      selectedText,
      beforeText,
      afterText,
    });

    return { selectedText, beforeText, afterText };
  }, [editor]);

  const insertAtCursor = useCallback(
    (text: string) => {
      if (!editor) return;
      const { to } = editor.state.selection;
      editor.view.dispatch(editor.view.state.tr.insertText("\n\n" + text, to));
      editor.view.focus();
    },
    [editor],
  );

  const replaceSelection = useCallback(
    (text: string) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      editor.view.dispatch(editor.view.state.tr.insertText(text, from, to));
      editor.view.focus();
    },
    [editor],
  );

  const appendToEnd = useCallback(
    (text: string) => {
      if (!editor) return;
      const docSize = editor.state.doc.content.size;
      editor.view.dispatch(
        editor.view.state.tr.insertText("\n\n" + text, docSize),
      );
      editor.view.focus();
    },
    [editor],
  );

  const addAssistantMessage = useCallback(
    (content: string, userMessages: ChatMessage[]) => {
      const msg: ChatMessage = {
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      };
      return [...userMessages, msg];
    },
    [],
  );

  const handleSend = useCallback(
    async (content: string, mode: ChatMode) => {
      const config = loadConfig();
      if (!config.apiKey && config.provider !== "ollama") {
        toast.error("请先在设置中配置 API Key");
        return;
      }

      const userMsg: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      const handleError = (err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : "未知错误";
        toast.error(`AI 请求失败：${errorMsg}`);
        setMessages(
          addAssistantMessage("请求失败，请检查网络连接或 API 配置后重试。", newMessages),
        );
      };

      try {
        if (mode === "chat") {
          let fullResponse = "";
          setMessages(
            addAssistantMessage("", newMessages),
          );

          for await (const chunk of aiOrchestrator.streamChat(projectId, content)) {
            fullResponse += chunk;
            setMessages(addAssistantMessage(fullResponse, newMessages));
          }
        } else if (mode === "continue") {
          const response = await aiOrchestrator.continueWriting(projectId, content);
          setMessages(addAssistantMessage(response, newMessages));
        } else {
          const response = await aiOrchestrator.brainstorm(projectId, content);
          setMessages(addAssistantMessage(response, newMessages));
        }
      } catch (err) {
        handleError(err);
      } finally {
        setIsLoading(false);
        setReferenceCount(aiOrchestrator.getLastReferenceCount(projectId));
        scrollToBottom();
      }
    },
    [messages, projectId, scrollToBottom, addAssistantMessage],
  );

  const handleQuickAction = useCallback(
    async (action: NonNullable<QuickAction>) => {
      if (!editor || isLoading) return;

      setQuickAction(action);
      setIsLoading(true);
      setSuggestion(null);

      try {
        const { selectedText, beforeText, afterText } = getEditorContext();

        switch (action) {
          case "continue": {
            const contextText = selectedText || beforeText;
            const result = await aiOrchestrator.continueWriting(projectId, contextText);
            if (selectedText) {
              insertAtCursor(result);
            } else {
              replaceSelection(result);
            }
            break;
          }
          case "polish": {
            if (!selectedText) {
              setQuickAction(null);
              setIsLoading(false);
              return;
            }
            const context = beforeText.slice(-300) + afterText.slice(0, 300);
            const result = await aiOrchestrator.polishText(projectId, selectedText, context || undefined);
            setSuggestion(result);
            break;
          }
          case "expand": {
            if (!selectedText) {
              setQuickAction(null);
              setIsLoading(false);
              return;
            }
            const context = beforeText.slice(-300) + afterText.slice(0, 300);
            const result = await aiOrchestrator.expandText(projectId, selectedText, context || undefined);
            setSuggestion(result);
            break;
          }
        }
      } catch (err) {
        console.error(`Quick action ${action} failed:`, err);
        toast.error(`AI ${ACTION_LABELS[action]}失败，请重试`);
        setQuickAction(null);
      } finally {
        setIsLoading(false);
      }
    },
    [editor, isLoading, projectId, getEditorContext, insertAtCursor, replaceSelection],
  );

  const acceptSuggestion = useCallback(() => {
    if (!suggestion) return;
    replaceSelection(suggestion);
    setSuggestion(null);
    setQuickAction(null);
  }, [suggestion, replaceSelection]);

  const rejectSuggestion = useCallback(() => {
    setSuggestion(null);
    setQuickAction(null);
  }, []);

  const handleHistorySelect = useCallback(
    (sessionId: string) => {
      try {
        const raw = localStorage.getItem(`chat_sessions_${projectId}`);
        if (!raw) return;
        const sessions: ChatSession[] = JSON.parse(raw);
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          const msgs: ChatMessage[] = session.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.createdAt,
          }));
          setMessages(msgs);
        }
        } catch {
        }
      setShowHistory(false);
    },
    [projectId],
  );

  const handleClearHistory = useCallback(() => {
    aiOrchestrator.clearHistory(projectId);
    setMessages([]);
    setActiveSessionId(undefined);
  }, [projectId]);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute top-1/2 -translate-y-1/2 right-0 z-40 w-8 h-20 bg-ink-surface border border-ink-border rounded-l-lg flex flex-col items-center justify-center gap-1 shrink-0 hover:bg-ink-surface-hover transition-all duration-300 ease-[var(--ease-out-expo)] group"
        title={open ? "收起 AI 助手" : "打开 AI 助手"}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-ink-text-dim group-hover:text-amber transition-colors ${open ? "rotate-180" : ""}`}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="text-[9px] text-ink-text-subtle vertical-rl tracking-wider leading-none group-hover:text-amber transition-colors">
          AI
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:static"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          className="absolute top-0 right-0 z-40 h-full w-80 border-l border-ink-border bg-ink-surface flex flex-col shadow-ink-lg animate-fade-up"
          style={{ animationDuration: "250ms" }}
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-ink-border bg-ink-surface-raised shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber rounded-full animate-pulse" />
              <h3 className="text-sm font-semibold text-ink-text">AI 助手</h3>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <select value={activePersonaId} onChange={(e) => {
                const newId = e.target.value;
                setActivePersonaId(newId);
                personaService.setProjectPersona(projectId, newId);
              }}
                className="max-w-[100px] text-[10px] bg-ink-surface-raised border border-ink-border rounded px-1 py-0.5 text-ink-text-dim focus:outline-none">
                {personas.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={activeSkillFilePath} onChange={(e) => {
                const newPath = e.target.value;
                setActiveSkillFilePath(newPath);
                if (newPath) {
                  setProjectSkill(projectId, newPath);
                } else {
                  clearProjectSkill(projectId);
                }
              }}
                className="max-w-[100px] text-[10px] bg-ink-surface-raised border border-ink-border rounded px-1 py-0.5 text-ink-text-dim focus:outline-none">
                <option value="">无</option>
                {skills.map((s) => <option key={s.filePath} value={s.filePath}>{s.meta?.name ?? s.filePath.split("/").pop()}</option>)}
              </select>
            </div>
            <div className="flex gap-1">
              {showHistory ? null : (
                <button
                  onClick={handleClearHistory}
                  className="px-2 py-0.5 text-xs text-ink-text-dim hover:text-amber transition-ink"
                  title="清空对话"
                >
                  清空
                </button>
              )}
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="px-2 py-0.5 text-xs text-ink-text-dim hover:text-amber transition-ink"
                title={showHistory ? "返回对话" : "历史会话"}
              >
                {showHistory ? "返回" : "历史"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-2 py-0.5 text-xs text-ink-text-dim hover:text-amber transition-ink"
                title="关闭面板"
              >
                ✕
              </button>
            </div>
          </div>

          {showHistory ? (
            <ChatHistory
              projectId={projectId}
              activeSessionId={activeSessionId}
              onSelect={handleHistorySelect}
            />
          ) : (
            <>
              <div className="flex gap-1 px-3 py-2 border-b border-ink-border bg-ink-surface shrink-0">
                {(["continue", "polish", "expand"] as NonNullable<QuickAction>[]).map((action) => (
                  <button
                    key={action}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading || !editor}
                    title={
                      {
                        continue: "从光标位置续写",
                        polish: "润色选中文字",
                        expand: "扩写选中段落",
                      }[action]
                    }
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-ink disabled:opacity-30 disabled:cursor-not-allowed ${
                      quickAction === action && !suggestion
                        ? "bg-amber-subtle text-amber"
                        : "text-ink-text-dim hover:bg-ink-surface-hover hover:text-ink-text"
                    }`}
                  >
                    {isLoading && quickAction === action ? (
                      <span className="inline-block w-2.5 h-2.5 border border-amber border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    {ACTION_LABELS[action]}
                  </button>
                ))}
              </div>

              {suggestion && quickAction && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-subtle border-b border-amber/20">
                  <span className="text-xs text-ink-text-dim flex-1">
                    已生成{ACTION_LABELS[quickAction]}建议
                  </span>
                  <button
                    onClick={acceptSuggestion}
                    className="px-2 py-0.5 text-xs bg-sage text-ink-text rounded hover:bg-sage-hover transition-ink"
                  >
                    接受
                  </button>
                  <button
                    onClick={rejectSuggestion}
                    className="px-2 py-0.5 text-xs bg-ink-surface-raised text-ink-text-dim rounded hover:bg-ink-surface-hover transition-ink"
                  >
                    拒绝
                  </button>
                </div>
              )}

              {referenceCount > 0 && (
                <div className="px-3 py-1.5 bg-amber-subtle border-b border-amber/20">
                  <p className="text-xs text-amber">
                    <span className="inline-block w-1.5 h-1.5 bg-amber rounded-full mr-1 align-middle" />
                    引用了 {referenceCount} 个相关段落
                  </p>
                </div>
              )}

              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                editor={editor}
                onInsertAtCursor={insertAtCursor}
                onReplaceSelection={replaceSelection}
                onAppendToEnd={appendToEnd}
              />
              <div ref={messagesEndRef} />
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </>
          )}
        </div>
      )}
    </>
  );
}
