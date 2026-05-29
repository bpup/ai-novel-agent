import { useState, useRef, useEffect, useCallback } from "react";
import type { Chapter } from "../../types/novel";
import type { MentionKind } from "../../types/chat";

export type ChatMode = "chat" | "continue" | "brainstorm";

interface MentionOption {
  kind: MentionKind;
  label: string;
  chapterId?: string;
  chapterTitle?: string;
  displayText: string;
}

interface ChatInputProps {
  onSend: (message: string, mode: ChatMode) => void;
  disabled: boolean;
  chapters?: Chapter[];
}

function buildMentionOptions(
  chapters: Chapter[],
  filterText: string
): MentionOption[] {
  const options: MentionOption[] = [];

  const showSelection = !filterText || "@selection".startsWith(filterText);
  const showProject = !filterText || "@project".startsWith(filterText);
  const showChapter =
    !filterText ||
    "@chapter".startsWith(filterText) ||
    filterText.startsWith("@chapter");

  if (showSelection) {
    options.push({
      kind: "selection",
      label: "@selection",
      displayText: "@selection  选中文字",
    });
  }
  if (showProject) {
    options.push({
      kind: "project",
      label: "@project",
      displayText: "@project  整个项目",
    });
  }
  if (showChapter) {
    const query = filterText.startsWith("@chapter ") && filterText.length > 9
      ? filterText.slice(9).toLowerCase()
      : filterText.startsWith("@chapter") && filterText.length > 8
        ? filterText.slice(9).toLowerCase().trim()
        : "";
    const filtered = chapters.filter((ch) =>
      ch.title.toLowerCase().includes(query)
    );
    for (const ch of filtered) {
      options.push({
        kind: "chapter",
        label: `@chapter ${ch.title}`,
        chapterId: ch.id,
        chapterTitle: ch.title,
        displayText: `@chapter  ${ch.title}`,
      });
    }
  }

  return options;
}

export default function ChatInput({
  onSend,
  disabled,
  chapters = [],
}: ChatInputProps) {
  const [mode, setMode] = useState<ChatMode>("chat");
  const [value, setValue] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionOptions, setMentionOptions] = useState<MentionOption[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const placeholders: Record<ChatMode, string> = {
    chat: "输入消息，与 AI 对话...（输入 @ 提及章节或选区）",
    continue: "AI 将从下文续写...",
    brainstorm: "输入主题，获取创意灵感...",
  };

  const detectMention = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);

    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    if (lastAtPos === -1) {
      setShowMentions(false);
      return;
    }

    const textAfterAt = textBeforeCursor.slice(lastAtPos);
    const hasSpaceAfterAt = /\s/.test(textAfterAt.slice(1));

    const beforeAt = textBeforeCursor[lastAtPos - 1] ?? "";
    const isWordBoundary = beforeAt === "" || /\s/.test(beforeAt);

    if (!isWordBoundary || hasSpaceAfterAt) {
      setShowMentions(false);
      return;
    }

    setActiveIndex(0);

    const options = buildMentionOptions(chapters, textAfterAt);
    setMentionOptions(options);
    setShowMentions(options.length > 0);
  }, [value, chapters]);

  useEffect(() => {
    detectMention();
  }, [value, detectMention]);

  const insertMention = useCallback(
    (option: MentionOption) => {
      const textarea = inputRef.current;
      if (!textarea || !showMentions) return;

      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = value.slice(0, cursorPos);
      const lastAtPos = textBeforeCursor.lastIndexOf("@");

      const newValue =
        value.slice(0, lastAtPos) +
        option.label +
        " " +
        value.slice(cursorPos);

      setValue(newValue);
      setShowMentions(false);

      setTimeout(() => {
        const newCursorPos = lastAtPos + option.label.length + 1;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, showMentions]
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showMentions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < mentionOptions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (mentionOptions[activeIndex]) {
          insertMention(mentionOptions[activeIndex]);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleKeyUp(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
      return;
    }
    detectMention();
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, mode);
    setValue("");
    setShowMentions(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMentions(false);
      }
    }
    if (showMentions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMentions]);

  return (
    <div className="border-t border-ink-border p-3 bg-ink-surface-raised shrink-0 relative">
      <div className="flex gap-1 mb-2">
        {(["chat", "continue", "brainstorm"] as ChatMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={disabled}
            className={`px-3 py-1 text-xs rounded-full transition-ink ${
              mode === m
                ? "bg-amber text-ink-bg"
                : "bg-ink-surface-hover text-ink-text-dim hover:text-ink-text"
            }`}
          >
            {m === "chat" ? "对话" : m === "continue" ? "续写" : "头脑风暴"}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder={placeholders[mode]}
          disabled={disabled}
          rows={2}
          className="flex-1 resize-none rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-2 focus:ring-amber/20 focus:border-amber disabled:opacity-30"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="shrink-0 px-4 py-2 bg-amber text-ink-bg text-sm rounded-lg hover:bg-amber-hover disabled:opacity-30 disabled:cursor-not-allowed transition-ink"
        >
          发送
        </button>
      </div>

      {showMentions && mentionOptions.length > 0 && (
        <div
          ref={menuRef}
          role="listbox"
          className="absolute left-4 right-4 bottom-full mb-1 max-h-48 overflow-y-auto bg-ink-surface border border-ink-border rounded-lg shadow-lg z-50"
        >
          {mentionOptions.map((opt, i) => {
            const kindLabel =
              opt.kind === "selection"
                ? "选区"
                : opt.kind === "project"
                  ? "项目"
                  : "章节";
            const kindColors: Record<MentionKind, string> = {
              selection: "bg-blue-900/30 text-blue-200 ring-blue-500/30",
              chapter: "bg-amber-900/30 text-amber-200 ring-amber-500/30",
              project: "bg-purple-900/30 text-purple-200 ring-purple-500/30",
            };

            return (
              <div
                key={`${opt.kind}-${opt.label}`}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => insertMention(opt)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                  i === activeIndex
                    ? "bg-ink-surface-hover"
                    : "hover:bg-ink-surface-hover"
                }`}
              >
                <span
                  className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ring-1 ring-inset ${kindColors[opt.kind]}`}
                >
                  {kindLabel}
                </span>
                <span className="text-ink-text">{opt.displayText}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
