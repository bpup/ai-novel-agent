import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Heading from "@tiptap/extension-heading";
import { ghostTextPlugin } from "./extensions/ghostText";
import { slashCommandPlugin } from "./extensions/slashCommand";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { contextBus } from "../ai/orchestrator/ContextBus";
import SelectionHoverBar from "../ai/SelectionHoverBar";

interface NovelEditorProps {
  content: string;
  chapterTitle: string;
  onContentChange: (content: string) => void;
  onAutoSave: (content: string) => void;
  onEditorReady?: (editor: import("@tiptap/react").Editor | null) => void;
  wordGoal?: number;
}

export default function NovelEditor({
  content,
  chapterTitle,
  onContentChange,
  onAutoSave,
  onEditorReady,
  wordGoal,
}: NovelEditorProps) {
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const isExternalUpdate = useRef(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const onContentChangeRef = useRef(onContentChange);
  const onAutoSaveRef = useRef(onAutoSave);
  onContentChangeRef.current = onContentChange;
  onAutoSaveRef.current = onAutoSave;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Placeholder.configure({
        placeholder: "开始书写你的故事...",
      }),
      CharacterCount.configure({}),
      ghostTextPlugin(),
      slashCommandPlugin(),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChangeRef.current(html);

      if (!isExternalUpdate.current) {
        clearTimeout(autoSaveTimer.current);
        setSaveStatus("unsaved");
        autoSaveTimer.current = setTimeout(() => {
          setSaveStatus("saving");
          Promise.resolve(onAutoSaveRef.current(html))
            .then(() => {
              setSaveStatus("saved");
            })
            .catch(() => {
              setSaveStatus("unsaved");
            });
        }, 2000);
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-8 py-6",
      },
    },
  });

  // Update editor content when chapter switches (external change)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      isExternalUpdate.current = true;
      editor.commands.setContent(content);
      isExternalUpdate.current = false;
    }
  }, [content, editor, chapterTitle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (editor) {
          const html = editor.getHTML();
          setSaveStatus("saving");
          Promise.resolve(onAutoSaveRef.current(html))
            .then(() => setSaveStatus("saved"))
            .catch(() => setSaveStatus("unsaved"));
        }
      }
    },
    [editor],
  );

  useEffect(() => {
    return () => {
      clearTimeout(autoSaveTimer.current);
    };
  }, []);

  useEffect(() => {
    onEditorReady?.(editor ?? null);
  }, [editor, onEditorReady]);

  // Initialize ContextBus with editor reference
  useEffect(() => {
    if (editor) {
      contextBus.setEditor(editor);
    }
  }, [editor]);

  // ── T2: Unsaved changes guard ──
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (saveStatus === "unsaved") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // ── T5: Session timer ──
  const sessionStart = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const characterCount = editor?.storage.characterCount?.characters() ?? 0;

  const statusLabel = saveStatus === "saving" ? "保存中..."
    : saveStatus === "unsaved" ? "未保存"
    : "已保存";

  // ── T4: Word goal progress ──
  const goalProgress = wordGoal && wordGoal > 0
    ? Math.min(Math.round((characterCount / wordGoal) * 100), 100)
    : null;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h${m % 60}m` : `${m}m`;
  };

  return (
    <div className="flex flex-col h-full" onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-ink-border bg-ink-surface-raised shrink-0 gap-3">
        <h2 className="text-sm font-medium text-ink-text truncate min-w-0">
          {chapterTitle || "未命名章节"}
        </h2>
        {goalProgress !== null && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 h-1.5 rounded-full bg-progress-bar-bg overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  goalProgress >= 90 ? "bg-progress-bar-fill-warn" : "bg-progress-bar-fill"
                }`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <span className={`text-[10px] font-medium ${
              goalProgress >= 100 ? "text-progress-bar-fill" : "text-ink-text-dim"
            }`}>
              {characterCount}/{wordGoal}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-ink-text-dim shrink-0">
          <span className="hidden sm:inline">{formatTime(elapsed)}</span>
          <span
            className={
              saveStatus === "unsaved"
                ? "text-warning"
                : saveStatus === "saving"
                  ? "text-amber"
                  : "text-ink-text-dim"
            }
          >
            {statusLabel}
          </span>
          <span>{characterCount} 字</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-ink-surface">
        <EditorContent editor={editor} className="h-full" />
        <SelectionHoverBar editor={editor} />
      </div>
    </div>
  );
}
