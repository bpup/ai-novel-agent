import { describe, it, expect } from "vitest";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TextAlign from "@tiptap/extension-text-align";

describe("NovelEditor TipTap extensions", () => {
  it("Blockquote extension should export correctly", () => {
    const ext = Blockquote.configure({});
    expect(ext.name).toBe("blockquote");
  });

  it("CodeBlock extension should export correctly", () => {
    const ext = CodeBlock.configure({});
    expect(ext.name).toBe("codeBlock");
  });

  it("OrderedList extension should export correctly", () => {
    const ext = OrderedList.configure({});
    expect(ext.name).toBe("orderedList");
  });

  it("BulletList extension should export correctly", () => {
    const ext = BulletList.configure({});
    expect(ext.name).toBe("bulletList");
  });

  it("ListItem extension should export correctly", () => {
    const ext = ListItem.configure({});
    expect(ext.name).toBe("listItem");
  });

  it("HorizontalRule extension should export correctly", () => {
    const ext = HorizontalRule.configure({});
    expect(ext.name).toBe("horizontalRule");
  });

  it("TextAlign extension should export with type config", () => {
    const ext = TextAlign.configure({ types: ["heading", "paragraph"] });
    expect(ext.name).toBe("textAlign");
  });

  it("All extensions can be combined in an array", () => {
    const extensions = [
      Blockquote.configure({}),
      CodeBlock.configure({}),
      OrderedList.configure({}),
      BulletList.configure({}),
      ListItem.configure({}),
      HorizontalRule.configure({}),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ];
    expect(extensions).toHaveLength(7);
    extensions.forEach((ext) => {
      expect(ext.name).toBeDefined();
    });
  });
});