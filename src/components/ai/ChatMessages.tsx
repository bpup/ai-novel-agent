import { useState } from "react";
import type { Editor } from "@tiptap/react";
import type { RAGCitation } from "../../types/chat";
import { useToast } from "../common/Toast";

type MessageItem = {
  role: string;
  content: string;
  citations?: RAGCitation[];
  timestamp?: string;
  createdAt?: string;
};

interface ChatMessagesProps {
  messages: MessageItem[];
  isLoading: boolean;
  editor: Editor | null;
  onInsertAtCursor: (text: string) => void;
  onReplaceSelection: (text: string) => void;
  onAppendToEnd?: (text: string) => void;
}

export default function ChatMessages({
  messages,
  isLoading,
  editor,
  onInsertAtCursor,
  onReplaceSelection,
  onAppendToEnd,
}: ChatMessagesProps) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const toast = useToast();

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
        <span className="text-2xl opacity-40">✦</span>
        <p className="text-sm text-ink-text-dim text-center">开始与 AI 对话</p>
        <p className="text-xs text-ink-text-subtle text-center leading-relaxed">
          选中编辑器文字后使用上方的<strong className="text-amber">润色</strong>或
          <strong className="text-amber">扩写</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg, i) => (
        <div key={i}>
          <div
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                msg.role === "user"
                  ? "bg-amber text-ink-bg rounded-br-sm shadow-ink-sm"
                  : "bg-ink-surface-raised text-ink-text rounded-bl-sm border border-ink-border"
              }`}
            >
              {msg.content}
            </div>
          </div>

          {msg.role === "assistant" && msg.content && (
            <>
              {msg.citations && msg.citations.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 ml-1">
                  {msg.citations.map((cite, ci) => (
                    <span
                      key={ci}
                      className="px-1.5 py-0.5 text-[10px] bg-sage/20 text-sage rounded"
                      title={cite.snippet}
                    >
                      ↩ {cite.chapterTitle}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-start mt-1 ml-1 gap-1 flex-wrap">
                <button
                  onClick={() => handleCopy(msg.content, i)}
                  className="px-1.5 py-0.5 text-[10px] text-ink-text-subtle hover:text-amber rounded transition-ink"
                  title="复制"
                >
                  {copiedIdx === i ? "已复制" : "复制"}
                </button>
                {editor && (
                  <>
                    <button
                      onClick={() => {
                        onInsertAtCursor(msg.content);
                        toast.success("已插入到光标位置");
                      }}
                      className="px-1.5 py-0.5 text-[10px] text-ink-text-subtle hover:text-amber rounded transition-ink"
                      title="在光标位置插入"
                    >
                      插入
                    </button>
                    <button
                      onClick={() => {
                        onReplaceSelection(msg.content);
                        toast.success("已替换选中内容");
                      }}
                      className="px-1.5 py-0.5 text-[10px] text-ink-text-subtle hover:text-amber rounded transition-ink"
                      title="替换选中文字"
                    >
                      替换
                    </button>
                  </>
                )}
                {onAppendToEnd && (
                  <button
                    type="button"
                    onClick={() => {
                      onAppendToEnd(msg.content);
                      toast.success("已追加到文末");
                    }}
                    className="px-1.5 py-0.5 text-[10px] text-ink-text-subtle hover:text-amber rounded transition-ink"
                    title="追加到文末"
                  >
                    追加
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-ink-surface-raised border border-ink-border rounded-xl rounded-bl-sm px-3 py-2">
            <span className="inline-flex gap-1">
              <span
                className="w-2 h-2 bg-amber rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 bg-amber rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 bg-amber rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
