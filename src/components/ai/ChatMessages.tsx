import { useState } from "react";
import type { Editor } from "@tiptap/react";
import type { ChatMessage } from "../../types/llm";
import { useToast } from "../common/Toast";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  editor: Editor | null;
  onInsertAtCursor: (text: string) => void;
  onReplaceSelection: (text: string) => void;
  onAppendToEnd?: (text: string) => void;
  refiningMessageId?: number | null;
  onRefine?: (messageIdx: number) => void;
}

export default function ChatMessages({
  messages,
  isLoading,
  editor,
  onInsertAtCursor,
  onReplaceSelection,
  onAppendToEnd,
  refiningMessageId,
  onRefine,
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
      {messages.map((msg, i) => {
        const isRefining = refiningMessageId === i;

        return (
          <div key={i}>
            <div
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  msg.role === "user"
                    ? "bg-amber text-ink-bg rounded-br-sm shadow-ink-sm"
                    : msg.metadata?.isError
                      ? "bg-error-bg text-error border border-error/20 rounded-bl-sm"
                      : "bg-ink-surface-raised text-ink-text rounded-bl-sm border border-ink-border"
                }`}
              >
                {msg.metadata?.isError ? (
                  <div>
                    <p className="text-xs font-medium mb-1">
                      {msg.metadata.errorMessage || "发生错误"}
                    </p>
                    {msg.metadata.isRetryable && (
                      <button
                        type="button"
                        onClick={() => onRefine?.(i)}
                        className="mt-1 px-2 py-0.5 text-[10px] bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink"
                      >
                        重试
                      </button>
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>

            {msg.metadata?.thinking && msg.metadata.thinking.length > 0 && (
              <details className="mt-1 ml-1">
                <summary className="text-[10px] text-ink-text-subtle cursor-pointer hover:text-ink-text-dim transition-ink">
                  查看 AI 思考过程
                </summary>
                <div className="mt-1 p-2 bg-ink-surface-hover border border-ink-border rounded text-[10px] text-ink-text-dim whitespace-pre-wrap">
                  {msg.metadata.thinking.join("\n")}
                </div>
              </details>
            )}

            {msg.role === "assistant" && msg.content && !msg.metadata?.isError && (
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
                  {onRefine && (
                    <button
                      onClick={() => onRefine(i)}
                      disabled={isRefining}
                      className={`px-1.5 py-0.5 text-[10px] rounded transition-ink ${
                        isRefining
                          ? "bg-amber-subtle text-amber"
                          : "text-ink-text-subtle hover:text-amber"
                      }`}
                      title="重新生成此回复"
                    >
                      {isRefining ? "优化中..." : "优化"}
                    </button>
                  )}
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
                      <button
                        onClick={() => {
                          editor.commands.setGhostText(msg.content);
                          toast.success("已设为 Ghost Text，按 Tab 接受");
                        }}
                        className="px-1.5 py-0.5 text-[10px] text-ink-text-subtle hover:text-amber rounded transition-ink"
                        title="设为 Ghost Text（Tab 接受，Esc 取消）"
                      >
                        预览
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
        );
      })}
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
