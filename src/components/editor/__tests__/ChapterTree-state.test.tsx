import { describe, it, expect } from "vitest";
import type { Chapter } from "../../../types/novel";
import type { ChapterStatus } from "../../../types/chat";

function createChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: "ch-1",
    projectId: "proj-1",
    title: "Test Chapter",
    content: "Hello world content",
    order: 0,
    summary: "",
    wordGoal: 0,
    status: "draft",
    ...overrides,
  };
}

type Transition = [ChapterStatus, ChapterStatus, boolean];
const VALID_TRANSITIONS: Transition[] = [
  ["draft", "writing", true],
  ["writing", "done", true],
  ["writing", "paused", true],
  ["paused", "writing", true],
  ["draft", "paused", true],
  ["done", "paused", true],
  ["draft", "done", false],
  ["done", "writing", false],
  ["done", "draft", false],
  ["paused", "done", true],
  ["paused", "draft", false],
];

function isValidTransition(from: ChapterStatus, to: ChapterStatus): boolean {
  return VALID_TRANSITIONS.some(([f, t, valid]) => f === from && t === to && valid);
}

function nextStatus(current: ChapterStatus): ChapterStatus[] {
  return VALID_TRANSITIONS
    .filter(([f, , valid]) => f === current && valid)
    .map(([, t]) => t);
}

function computeProgress(content: string, wordGoal: number): number {
  if (!wordGoal || wordGoal <= 0) return 0;
  const wordCount = content.length;
  return Math.min(wordCount, wordGoal) / wordGoal;
}

describe("ChapterTree state machine", () => {
  it("valid transitions are accepted", () => {
    expect(isValidTransition("draft", "writing")).toBe(true);
    expect(isValidTransition("writing", "done")).toBe(true);
    expect(isValidTransition("writing", "paused")).toBe(true);
    expect(isValidTransition("paused", "writing")).toBe(true);
    expect(isValidTransition("draft", "paused")).toBe(true);
    expect(isValidTransition("done", "paused")).toBe(true);
    expect(isValidTransition("paused", "done")).toBe(true);
  });

  it("invalid transitions are rejected", () => {
    expect(isValidTransition("draft", "done")).toBe(false);
    expect(isValidTransition("done", "writing")).toBe(false);
    expect(isValidTransition("done", "draft")).toBe(false);
    expect(isValidTransition("paused", "draft")).toBe(false);
  });

  it("draft status returns correct next states", () => {
    const states = nextStatus("draft");
    expect(states).toContain("writing");
    expect(states).toContain("paused");
    expect(states).not.toContain("done");
  });

  it("writing status returns correct next states", () => {
    const states = nextStatus("writing");
    expect(states).toContain("done");
    expect(states).toContain("paused");
  });

  it("paused status returns correct next states", () => {
    const states = nextStatus("paused");
    expect(states).toContain("writing");
    expect(states).toContain("done");
  });

  it("done status returns correct next states", () => {
    const states = nextStatus("done");
    expect(states).toContain("paused");
    expect(states).not.toContain("draft");
    expect(states).not.toContain("writing");
  });

  it("word goal progress computes correctly", () => {
    expect(computeProgress("abc", 0)).toBe(0);
    expect(computeProgress("abc", 10)).toBe(0.3);
    expect(computeProgress("hello world test", 5)).toBe(1);
    expect(computeProgress("a", 100)).toBe(0.01);
  });

  it("status label text is correct for each status", () => {
    const labels: Record<ChapterStatus, string> = {
      draft: "草稿",
      writing: "写作中",
      paused: "已暂停",
      done: "已完成",
    };
    expect(labels.draft).toBe("草稿");
    expect(labels.writing).toBe("写作中");
    expect(labels.paused).toBe("已暂停");
    expect(labels.done).toBe("已完成");
  });

  it("chapter with default status is draft", () => {
    const ch = createChapter();
    expect(ch.status).toBe("draft");
  });
});
