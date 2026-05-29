import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { aiService } from "./orchestrator/AIService";

interface SelectionHoverBarProps {
  editor: Editor | null;
}

const MIN_SELECTION_LENGTH = 5;
const SHOW_DELAY_MS = 500;

const ACTIONS: { label: string; command: string }[] = [
  { label: "润色", command: "polish" },
  { label: "扩写", command: "expand" },
  { label: "缩写", command: "summarize" },
  { label: "翻译", command: "translate" },
  { label: "续写", command: "continue" },
];

export default function SelectionHoverBar({ editor }: SelectionHoverBarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const hideBar = () => {
    clearTimers();
    setVisible(false);
  };

  const shouldShow = (ed: Editor): boolean => {
    if (!ed.isFocused) return false;
    const { from, to, empty } = ed.state.selection;
    if (empty) return false;
    const selectedText = ed.state.doc.textBetween(from, to);
    return [...selectedText].length >= MIN_SELECTION_LENGTH;
  };

  useEffect(() => {
    if (!editor) return;

    const checkSelection = () => {
      clearTimers();

      if (!shouldShow(editor)) {
        hideBar();
        return;
      }

      timerRef.current = setTimeout(() => {
        setVisible(true);
        updatePosition();

        const track = () => {
          updatePosition();
          frameRef.current = requestAnimationFrame(track);
        };
        frameRef.current = requestAnimationFrame(track);
      }, SHOW_DELAY_MS);
    };

    const updatePosition = () => {
      const coords = editor.view.coordsAtPos(
        editor.state.selection.from,
      );
      setPosition({
        x: coords.left,
        y: coords.top - 44,
      });
    };

    checkSelection();

    editor.on("selectionUpdate", checkSelection);
    editor.on("blur", () => hideBar());

    return () => {
      editor.off("selectionUpdate", checkSelection);
      editor.off("blur", () => hideBar());
      clearTimers();
    };
  }, [editor]);

  const handleAction = async (command: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    const result = await aiService.execute(command, selectedText);
    if (result.result) {
      editor.commands.setGhostText(result.result);
    }
    hideBar();
  };

  if (!visible) return null;

  return createPortal(
    <div
      className="fixed z-[9998] flex items-center gap-0.5 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl px-1.5 py-1.5 transition-opacity duration-150 animate-slide-down"
      style={{ left: position.x, top: position.y }}
      role="toolbar"
      aria-label="选中文字操作"
    >
      {ACTIONS.map((action) => (
        <button
          key={action.command}
          title={action.label}
          onClick={() => {
            void handleAction(action.command);
          }}
          className="px-2.5 py-1 text-sm text-gray-300 hover:text-sage-300 hover:bg-gray-700 rounded transition-colors duration-75 whitespace-nowrap"
        >
          {action.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
