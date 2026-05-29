import { describe, it, expect } from "vitest";
import type { Editor } from "@tiptap/react";

function makeMockEditor() {
  const chain: any = () => chain;
  chain.focus = () => chain;
  chain.run = () => {};
  return { chain: () => chain, isActive: () => false } as unknown as Editor;
}

describe("EditorToolbar buttons", () => {
  it("Bold button should call toggleBold", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).toggleBold = () => { called = true; return editor.chain(); };
    editor.chain().focus().toggleBold().run();
    expect(called).toBe(true);
  });

  it("Italic button should call toggleItalic", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).toggleItalic = () => { called = true; return editor.chain(); };
    editor.chain().focus().toggleItalic().run();
    expect(called).toBe(true);
  });

  it("Heading buttons should call toggleHeading with level", () => {
    for (const level of [1, 2, 3] as const) {
      let calledLevel = 0;
      const editor = makeMockEditor();
      (editor.chain() as any).toggleHeading = (opts: any) => { calledLevel = opts.level; return editor.chain(); };
      editor.chain().focus().toggleHeading({ level }).run();
      expect(calledLevel).toBe(level);
    }
  });

  it("OrderedList should call toggleOrderedList", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).toggleOrderedList = () => { called = true; return editor.chain(); };
    editor.chain().focus().toggleOrderedList().run();
    expect(called).toBe(true);
  });

  it("BulletList should call toggleBulletList", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).toggleBulletList = () => { called = true; return editor.chain(); };
    editor.chain().focus().toggleBulletList().run();
    expect(called).toBe(true);
  });

  it("Blockquote should call toggleBlockquote", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).toggleBlockquote = () => { called = true; return editor.chain(); };
    editor.chain().focus().toggleBlockquote().run();
    expect(called).toBe(true);
  });

  it("CodeBlock should call toggleCodeBlock", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).toggleCodeBlock = () => { called = true; return editor.chain(); };
    editor.chain().focus().toggleCodeBlock().run();
    expect(called).toBe(true);
  });

  it("HorizontalRule should call setHorizontalRule", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).setHorizontalRule = () => { called = true; return editor.chain(); };
    editor.chain().focus().setHorizontalRule().run();
    expect(called).toBe(true);
  });

  it("ClearFormatting should call unsetAllMarks + clearNodes", () => {
    let unset = false, clear = false;
    const editor = makeMockEditor();
    (editor.chain() as any).unsetAllMarks = () => { unset = true; return editor.chain(); };
    (editor.chain() as any).clearNodes = () => { clear = true; return editor.chain(); };
    editor.chain().focus().unsetAllMarks().clearNodes().run();
    expect(unset).toBe(true);
    expect(clear).toBe(true);
  });

  it("Undo should call undo", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).undo = () => { called = true; return editor.chain(); };
    editor.chain().focus().undo().run();
    expect(called).toBe(true);
  });

  it("Redo should call redo", () => {
    let called = false;
    const editor = makeMockEditor();
    (editor.chain() as any).redo = () => { called = true; return editor.chain(); };
    editor.chain().focus().redo().run();
    expect(called).toBe(true);
  });
});