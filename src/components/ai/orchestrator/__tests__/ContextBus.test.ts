import { describe, it, expect, beforeEach } from "vitest";
import { ContextBus } from "../ContextBus";
import type { Chapter } from "../../../../types/novel";

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: "ch-1",
    projectId: "proj-1",
    title: "Chapter One",
    content: "It was a dark and stormy night.",
    order: 1,
    summary: "",
    wordGoal: 5000,
    status: "draft",
    notes: "",
    ...overrides,
  };
}

describe("ContextBus", () => {
  let bus: ContextBus;

  beforeEach(() => {
    bus = new ContextBus();
  });

  describe("resolveMention", () => {
    it("returns selection target for @selection", () => {
      const result = bus.resolveMention("@selection");
      expect(result).toEqual({ kind: "selection", label: "@selection" });
    });

    it("returns project target for @project", () => {
      const result = bus.resolveMention("@project");
      expect(result).toEqual({ kind: "project", label: "@project" });
    });

    it("returns null for @unknown mention", () => {
      const result = bus.resolveMention("@unknown");
      expect(result).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(bus.resolveMention("")).toBeNull();
    });

    it("returns null for plain text without @", () => {
      expect(bus.resolveMention("hello world")).toBeNull();
    });
  });

  describe("resolveMention with chapter context", () => {
    it("returns chapter target when chapter is set and @chapter matches", () => {
      const ch = makeChapter({ title: "Prologue" });
      bus.setCurrentChapter(ch);

      const result = bus.resolveMention("@chapter");
      expect(result).toEqual({
        kind: "chapter",
        label: "@chapter Prologue",
        chapterId: "ch-1",
        chapterTitle: "Prologue",
      });
    });

    it("returns chapter target with matching title substring", () => {
      const ch = makeChapter({ id: "ch-5", title: "The Big Reveal" });
      bus.setCurrentChapter(ch);

      const result = bus.resolveMention("@chapter The Big");
      expect(result).toEqual({
        kind: "chapter",
        label: "@chapter The Big Reveal",
        chapterId: "ch-5",
        chapterTitle: "The Big Reveal",
      });
    });

    it("returns null when @chapter has no matching chapter loaded", () => {
      const result = bus.resolveMention("@chapter");
      expect(result).toBeNull();
    });

    it("handles @chapter with extra whitespace", () => {
      const ch = makeChapter({ title: "Test" });
      bus.setCurrentChapter(ch);

      const result = bus.resolveMention("@chapter   ");
      expect(result).toEqual({
        kind: "chapter",
        label: "@chapter Test",
        chapterId: "ch-1",
        chapterTitle: "Test",
      });
    });
  });

  describe("state management", () => {
    it("setCurrentChapter stores chapter", () => {
      const ch = makeChapter();
      bus.setCurrentChapter(ch);

      const editorCtx = bus.getEditorContext();
      expect(editorCtx.currentChapterId).toBe("ch-1");
      expect(editorCtx.currentChapterTitle).toBe("Chapter One");
    });

    it("setProjectContext stores project info", () => {
      bus.setProjectContext({ id: "proj-1", title: "My Novel", description: "A story" });

      const ctx = bus.buildContextPrompt({ includeProject: true });
      expect(ctx).toContain("My Novel");
      expect(ctx).toContain("A story");
    });

    it("setProjectContext replaces previous project context", () => {
      bus.setProjectContext({ id: "p1", title: "Old", description: "" });
      bus.setProjectContext({ id: "p2", title: "New", description: "Better" });

      const ctx = bus.buildContextPrompt({ includeProject: true });
      expect(ctx).toContain("New");
      expect(ctx).not.toContain("Old");
    });
  });

  describe("buildContextPrompt", () => {
    it("includes system instruction by default", () => {
      const prompt = bus.buildContextPrompt();
      expect(prompt).toContain("你是一位专业的写作助手");
    });

    it("includes project info when includeProject is true", () => {
      bus.setProjectContext({ id: "p1", title: "Epic Tale", description: "A grand adventure" });
      const prompt = bus.buildContextPrompt({ includeProject: true });

      expect(prompt).toContain("Epic Tale");
      expect(prompt).toContain("A grand adventure");
    });

    it("includes chapter info when includeChapter is true and chapter is set", () => {
      const ch = makeChapter({ title: "The Beginning", content: "Once upon a time..." });
      bus.setCurrentChapter(ch);
      const prompt = bus.buildContextPrompt({ includeChapter: true });

      expect(prompt).toContain("The Beginning");
      expect(prompt).toContain("Once upon a time...");
    });

    it("includes selection context when includeSelection is true and selection exists", () => {
      bus.setSelectionContext({
        selectedText: "selected passage",
        beforeText: "leading text",
        afterText: "trailing text",
      });
      const prompt = bus.buildContextPrompt({ includeSelection: true });

      expect(prompt).toContain("selected passage");
      expect(prompt).toContain("leading text");
    });

    it("omits selection section when no selection exists", () => {
      const prompt = bus.buildContextPrompt({ includeSelection: true });
      expect(prompt).not.toContain("当前选中文字");
    });

    it("includes all sections when all options enabled", () => {
      bus.setProjectContext({ id: "p1", title: "Novel", description: "Desc" });
      bus.setCurrentChapter(makeChapter({ title: "Ch1", content: "Content here" }));
      bus.setSelectionContext({
        selectedText: "sel",
        beforeText: "before",
        afterText: "after",
      });

      const prompt = bus.buildContextPrompt({
        includeProject: true,
        includeChapter: true,
        includeSelection: true,
      });

      expect(prompt).toContain("Novel");
      expect(prompt).toContain("Ch1");
      expect(prompt).toContain("sel");
      expect(prompt).toContain("你是一位专业的写作助手");
    });

    it("additional prompt is appended at the end", () => {
      const prompt = bus.buildContextPrompt({ additionalPrompt: "请用幽默的语气写作" });
      expect(prompt).toContain("请用幽默的语气写作");
    });

    it("default buildContextPrompt without options returns system instruction only", () => {
      const prompt = bus.buildContextPrompt();
      const lines = prompt.split("\n").filter(Boolean);
      expect(lines.length).toBeGreaterThanOrEqual(1);
      expect(lines.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getEditorContext", () => {
    it("returns nulls when nothing is set", () => {
      const ctx = bus.getEditorContext();
      expect(ctx.currentChapterId).toBeNull();
      expect(ctx.currentChapterTitle).toBeNull();
      expect(ctx.selectedText).toBe("");
      expect(ctx.beforeText).toBe("");
      expect(ctx.afterText).toBe("");
    });

    it("returns chapter info when chapter is set", () => {
      bus.setCurrentChapter(makeChapter({ title: "Intro" }));
      const ctx = bus.getEditorContext();
      expect(ctx.currentChapterId).toBe("ch-1");
      expect(ctx.currentChapterTitle).toBe("Intro");
    });

    it("returns selection info when set", () => {
      bus.setSelectionContext({
        selectedText: "hello",
        beforeText: "pre",
        afterText: "post",
      });
      const ctx = bus.getEditorContext();
      expect(ctx.selectedText).toBe("hello");
      expect(ctx.beforeText).toBe("pre");
      expect(ctx.afterText).toBe("post");
    });

    it("merges chapter and selection info", () => {
      bus.setCurrentChapter(makeChapter({ title: "Ch2" }));
      bus.setSelectionContext({
        selectedText: "world",
        beforeText: "",
        afterText: "",
      });

      const ctx = bus.getEditorContext();
      expect(ctx.currentChapterTitle).toBe("Ch2");
      expect(ctx.selectedText).toBe("world");
    });

    it("clears selection by setting nulls", () => {
      bus.setSelectionContext({
        selectedText: "temp",
        beforeText: "",
        afterText: "",
      });
      bus.setSelectionContext(null);

      const ctx = bus.getEditorContext();
      expect(ctx.selectedText).toBe("");
    });
  });

  describe("clear state", () => {
    it("clears all state when reset", () => {
      bus.setCurrentChapter(makeChapter());
      bus.setProjectContext({ id: "p1", title: "Test", description: "" });
      bus.setSelectionContext({ selectedText: "x", beforeText: "", afterText: "" });

      bus.clear();

      const ctx = bus.getEditorContext();
      expect(ctx.currentChapterId).toBeNull();
      expect(ctx.selectedText).toBe("");
    });

    it("clear preserves defaults in buildContextPrompt", () => {
      bus.clear();
      const prompt = bus.buildContextPrompt();
      expect(prompt).toContain("你是一位专业的写作助手");
    });
  });
});
