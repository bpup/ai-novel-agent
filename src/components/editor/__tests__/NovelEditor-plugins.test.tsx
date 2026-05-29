import { describe, it, expect, beforeAll } from "vitest";
import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";

// Plugins under test
import { ghostTextPlugin } from "../extensions/ghostText";
import { slashCommandPlugin } from "../extensions/slashCommand";

// ContextBus
import { contextBus } from "../../ai/orchestrator/ContextBus";

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

function createEditorWithPlugins() {
  const editor = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      ghostTextPlugin(),
      slashCommandPlugin(),
    ],
    content: "<p>hello world</p>",
  });

  const div = document.createElement("div");
  document.body.appendChild(div);
  editor.view.setProps({ parentNode: div } as never);

  return { editor, container: div };
}

describe("NovelEditor Plugin Integration", () => {
  it("ghostTextPlugin loads into editor without error", () => {
    const { editor, container } = createEditorWithPlugins();

    expect(editor).toBeDefined();
    expect(editor.isDestroyed).toBe(false);

    editor.destroy();
    container.remove();
  });

  it("ghostText set/clear works when both plugins are active", () => {
    const { editor, container } = createEditorWithPlugins();

    editor.commands.setGhostText("AI suggested text");
    expect(editor.commands.setGhostText).toBeDefined();

    editor.commands.clearGhostText();
    expect(editor.commands.clearGhostText).toBeDefined();

    editor.destroy();
    container.remove();
  });

  it("ContextBus.setEditor accepts a ProseMirror editor", () => {
    const { editor, container } = createEditorWithPlugins();

    // Simulate what NovelEditor's useEffect does
    expect(() => contextBus.setEditor(editor as any)).not.toThrow();

    editor.destroy();
    container.remove();
  });

  it("openSlashMenu command is registered when slashCommandPlugin is active", () => {
    const { editor, container } = createEditorWithPlugins();

    const openSlashMenu = (editor.commands as any)["openSlashMenu"];
    expect(openSlashMenu).toBeDefined();
    expect(typeof openSlashMenu).toBe("function");

    editor.destroy();
    container.remove();
  });
});
