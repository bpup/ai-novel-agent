import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import {
  slashCommandPluginKey,
  SLASH_COMMANDS,
  type SlashMenuState,
  type SlashCommandItem,
} from "../editor/extensions/slashCommand";
import { aiService } from "./orchestrator/AIService";

interface InlineCommandProps {
  editor: Editor | null;
}

export default function InlineCommand({ editor }: InlineCommandProps) {
  const [menuState, setMenuState] = useState<SlashMenuState>({
    open: false,
    query: "",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!editor) return;

    const handler = () => {
      const state = slashCommandPluginKey.getState(editor.state);
      if (state) {
        setMenuState(state);
        if (state.open) {
          const coords = editor.view.coordsAtPos(
            editor.state.selection.from,
          );
          setPosition({ x: coords.left, y: coords.bottom + 4 });
        }
      }
    };

    handler();

    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);

    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  const filteredCommands = useMemo(() => {
    if (!menuState.query) return SLASH_COMMANDS;
    const q = menuState.query.toLowerCase();
    return SLASH_COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q),
    );
  }, [menuState.query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [menuState.query]);

  const executeCommand = async (item: SlashCommandItem) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = from !== to
      ? editor.state.doc.textBetween(from, to)
      : "";
    const context = editor.getText();

    const result = await aiService.execute(item.command, selectedText || context);

    if (result.result) {
      editor.commands.setGhostText(result.result);
    }

    editor.commands.closeSlashMenu();
  };

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredCommands.length - 1),
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          void executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case "Escape":
        editor?.commands.closeSlashMenu();
        break;
    }
  };

  if (!menuState.open || filteredCommands.length === 0) return null;

  const groupedCommands = filteredCommands.reduce<
    Record<string, SlashCommandItem[]>
  >((acc, cmd) => {
    (acc[cmd.category] ??= []).push(cmd);
    return acc;
  }, {});

  return createPortal(
    <div
      className="fixed z-[9999] w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-scale-in"
      style={{ left: position.x, top: position.y }}
      role="listbox"
      aria-label="Slash commands"
    >
      <div className="py-1" onKeyDown={handleKeyDown}>
        {Object.entries(groupedCommands).map(([category, commands]) => (
          <div key={category}>
            <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider select-none">
              {category}
            </div>
            {commands.map((cmd) => {
              const globalIndex = filteredCommands.indexOf(cmd);
              const isSelected = globalIndex === selectedIndex;
              return (
                <button
                  key={cmd.command}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors duration-75 ${
                    isSelected
                      ? "bg-sage/20 text-sage-300"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                  onClick={() => {
                    void executeCommand(cmd);
                  }}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                >
                  <span className="font-medium">{cmd.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="px-3 py-1.5 border-t border-gray-700 text-xs text-gray-600">
        <kbd className="px-1 text-gray-500">↑↓</kbd> 导航 ·{" "}
        <kbd className="px-1 text-gray-500">Enter</kbd> 选择 ·{" "}
        <kbd className="px-1 text-gray-500">Esc</kbd> 取消
      </div>
    </div>,
    document.body,
  );
}
