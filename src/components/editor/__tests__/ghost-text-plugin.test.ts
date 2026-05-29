import { describe, it, expect, beforeAll } from "vitest";
import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { ghostTextPlugin, ghostTextPluginKey } from "../extensions/ghostText";

beforeAll(() => {
  // jsdom does not implement scrollIntoView
  Element.prototype.scrollIntoView = () => {};
});

function createTestEditor(content = "<p>hello world</p>") {
  const editor = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      ghostTextPlugin(),
    ],
    content,
  });

  // ProseMirror needs a DOM mount to create decorations
  const div = document.createElement("div");
  document.body.appendChild(div);
  editor.view.setProps({ parentNode: div } as never);

  return { editor, container: div };
}

describe("Ghost Text Plugin", () => {
  it("plugin key is defined", () => {
    expect(ghostTextPluginKey).toBeDefined();
    expect((ghostTextPluginKey as any).key).toBe("ghostText$");
  });

  it("allows editor creation with ghostText extension", () => {
    const { editor, container } = createTestEditor();

    expect(editor).toBeDefined();
    expect(editor.isDestroyed).toBe(false);

    editor.destroy();
    container.remove();
  });

  it("setGhostText stores ghost text in plugin state", () => {
    const { editor, container } = createTestEditor();

    editor.commands.setGhostText("suggested text");

    const state = ghostTextPluginKey.getState(editor.state);
    expect(state).toBe("suggested text");

    editor.destroy();
    container.remove();
  });

  it("clearGhostText removes ghost text from plugin state", () => {
    const { editor, container } = createTestEditor();

    editor.commands.setGhostText("suggested text");
    expect(ghostTextPluginKey.getState(editor.state)).toBe("suggested text");

    editor.commands.clearGhostText();
    expect(ghostTextPluginKey.getState(editor.state)).toBeNull();

    editor.destroy();
    container.remove();
  });

  it("removes ghost text when cursor moves", () => {
    const { editor, container } = createTestEditor(
      "<p>hello world</p>",
    );

    editor.commands.setTextSelection(5);
    editor.commands.setGhostText("suggested text");
    expect(ghostTextPluginKey.getState(editor.state)).toBe("suggested text");

    // Move cursor to a different position
    editor.commands.setTextSelection(2);
    expect(ghostTextPluginKey.getState(editor.state)).toBeNull();

    editor.destroy();
    container.remove();
  });

  it("Tab key accepts ghost text and inserts into document", () => {
    const { editor, container } = createTestEditor(
      "<p>hello world</p>",
    );

    // Place cursor at position 5 (after "hello")
    editor.commands.setTextSelection(5);
    editor.commands.setGhostText(" there");

    expect(ghostTextPluginKey.getState(editor.state)).toBe(" there");

    // Simulate Tab keypress
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      code: "Tab",
      keyCode: 9,
      bubbles: true,
      cancelable: true,
    });

    editor.view.dom.dispatchEvent(tabEvent);

    // Ghost text should be cleared and inserted
    expect(ghostTextPluginKey.getState(editor.state)).toBeNull();
    expect(editor.state.doc.textContent).toContain(" there");

    editor.destroy();
    container.remove();
  });

  it("Escape key cancels ghost text without inserting", () => {
    const { editor, container } = createTestEditor(
      "<p>hello world</p>",
    );

    editor.commands.setTextSelection(5);
    editor.commands.setGhostText(" there");
    expect(ghostTextPluginKey.getState(editor.state)).toBe(" there");

    // Simulate Escape keypress
    const escEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      code: "Escape",
      keyCode: 27,
      bubbles: true,
      cancelable: true,
    });

    editor.view.dom.dispatchEvent(escEvent);

    // Ghost text should be cleared, but content unchanged
    expect(ghostTextPluginKey.getState(editor.state)).toBeNull();
    expect(editor.state.doc.textContent).toBe("hello world");

    editor.destroy();
    container.remove();
  });

  it("Tab without ghost text delegates to default behavior", () => {
    const { editor, container } = createTestEditor(
      "<p>hello world</p>",
    );

    // No ghost text set — Tab should not be consumed
    editor.commands.setTextSelection(5);

    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      code: "Tab",
      keyCode: 9,
      bubbles: true,
      cancelable: true,
    });

    const prevented = !editor.view.dom.dispatchEvent(tabEvent);

    // Tab should NOT be prevented (browser handles it)
    expect(prevented).toBe(false);

    editor.destroy();
    container.remove();
  });
});
