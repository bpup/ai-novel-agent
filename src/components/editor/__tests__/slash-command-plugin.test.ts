import { describe, it, expect } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { Schema, type NodeSpec } from "@tiptap/pm/model";
import {
  slashCommandPluginKey,
  slashCommandPmPlugin,
  SLASH_COMMANDS,
} from "../extensions/slashCommand";

const testSchema = new Schema({
  nodes: {
    doc: { content: "paragraph+" } as NodeSpec,
    paragraph: {
      content: "text*",
      toDOM: () => ["p", 0],
      parseDOM: [{ tag: "p" }],
    } as NodeSpec,
    text: { group: "inline" } as NodeSpec,
  },
});

function createState(docText = ""): EditorState {
  return EditorState.create({
    doc: testSchema.nodeFromJSON({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: docText ? [{ type: "text", text: docText }] : [],
        },
      ],
    }),
    plugins: [slashCommandPmPlugin],
  });
}

function pluginKey(): string {
  return (slashCommandPluginKey as unknown as { key: string }).key;
}

describe("Slash Command Plugin", () => {
  it("plugin key is defined", () => {
    expect(pluginKey()).toBeDefined();
    expect(typeof pluginKey()).toBe("string");
  });

  it("SLASH_COMMANDS has 12 items", () => {
    expect(SLASH_COMMANDS).toHaveLength(12);
  });

  it("SLASH_COMMANDS are grouped into 4 categories", () => {
    const categories = new Set(SLASH_COMMANDS.map((c) => c.category));
    expect(categories.size).toBe(4);
    expect(categories.has("写作")).toBe(true);
    expect(categories.has("润色")).toBe(true);
    expect(categories.has("分析")).toBe(true);
    expect(categories.has("创作")).toBe(true);
  });

  it("each SLASH_COMMAND has label, command, and category", () => {
    for (const cmd of SLASH_COMMANDS) {
      expect(cmd.label).toBeTruthy();
      expect(cmd.command).toBeTruthy();
      expect(cmd.category).toBeTruthy();
    }
  });

  it("initial plugin state is closed with empty query", () => {
    const state = createState("");
    const menu = slashCommandPluginKey.getState(state);
    expect(menu).toEqual({ open: false, query: "" });
  });

  it("setMeta opens menu with query", () => {
    const state = createState("");
    const tr = state.tr.setMeta(slashCommandPluginKey, {
      open: true,
      query: "",
    });
    const next = state.apply(tr);
    const menu = slashCommandPluginKey.getState(next);
    expect(menu?.open).toBe(true);
    expect(menu?.query).toBe("");
  });

  it("setMeta closes menu", () => {
    let state = createState("");
    let tr = state.tr.setMeta(slashCommandPluginKey, {
      open: true,
      query: "pol",
    });
    state = state.apply(tr);

    tr = state.tr.setMeta(slashCommandPluginKey, { open: false, query: "" });
    state = state.apply(tr);
    const menu = slashCommandPluginKey.getState(state);
    expect(menu?.open).toBe(false);
  });
});
