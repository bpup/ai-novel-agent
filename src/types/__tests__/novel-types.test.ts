import { describe, it, expect } from "vitest";
import type { Chapter } from "../novel";
import type {
  ChapterStatus,
  ChatRole,
  ChatMessage,
  ChatSession,
  InsertPosition,
  MentionKind,
  MentionTarget,
  RAGCitation,
} from "../chat";

function makeChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: "ch-1",
    projectId: "proj-1",
    title: "Chapter One",
    content: "It was a dark and stormy night.",
    order: 1,
    ...overrides,
  };
}

function makeChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "msg-1",
    role: "user" as ChatRole,
    content: "Hello",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Chapter type", () => {
  it("has required fields with defaults", () => {
    const ch = makeChapter();
    expect(ch.id).toBe("ch-1");
    expect(ch.projectId).toBe("proj-1");
    expect(ch.title).toBe("Chapter One");
    expect(ch.content).toBe("It was a dark and stormy night.");
    expect(ch.order).toBe(1);
  });

  it("supports optional new fields", () => {
    const ch = makeChapter({
      summary: "A dark beginning",
      wordGoal: 5000,
      status: "draft" as ChapterStatus,
      notes: "Need more detail",
    });
    expect(ch.summary).toBe("A dark beginning");
    expect(ch.wordGoal).toBe(5000);
    expect(ch.status).toBe("draft");
    expect(ch.notes).toBe("Need more detail");
    expect(ch.content).toBe("It was a dark and stormy night.");
  });

  it("accepts all valid ChapterStatus values", () => {
    const valid: ChapterStatus[] = ["draft", "writing", "done", "paused"];
    valid.forEach((s) => {
      const ch = makeChapter({ status: s });
      expect(ch.status).toBe(s);
    });
  });

  it("allows omitting all new optional fields (backward compat)", () => {
    const ch = makeChapter();
    expect(ch.summary).toBeUndefined();
    expect(ch.wordGoal).toBeUndefined();
    expect(ch.status).toBeUndefined();
    expect(ch.notes).toBeUndefined();
  });
});

describe("ChatMessage type", () => {
  it("has required fields", () => {
    const msg = makeChatMessage();
    expect(msg.id).toBe("msg-1");
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("Hello");
    expect(msg.createdAt).toBeTruthy();
  });

  it("supports optional citations and mentions", () => {
    const citation: RAGCitation = {
      chapterId: "ch-1",
      chapterTitle: "Chapter One",
      snippet: "dark and stormy",
      score: 0.85,
    };
    const mention: MentionTarget = {
      kind: "chapter" as MentionKind,
      label: "@chapter Chapter One",
      chapterId: "ch-1",
      chapterTitle: "Chapter One",
    };
    const msg = makeChatMessage({
      role: "assistant" as ChatRole,
      citations: [citation],
      mentions: [mention],
    });
    expect(msg.citations).toHaveLength(1);
    expect(msg.citations![0].chapterId).toBe("ch-1");
    expect(msg.mentions).toHaveLength(1);
    expect(msg.mentions![0].kind).toBe("chapter");
  });
});

describe("ChatSession type", () => {
  it("holds messages with correct shape", () => {
    const session: ChatSession = {
      id: "sess-1",
      projectId: "proj-1",
      title: "New Chat",
      messages: [makeChatMessage()],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(session.messages).toHaveLength(1);
    expect(session.messages[0].role).toBe("user");
  });
});

describe("MentionTarget type", () => {
  it("supports @selection", () => {
    const mt: MentionTarget = { kind: "selection", label: "@selection" };
    expect(mt.kind).toBe("selection");
    expect(mt.label).toBe("@selection");
    expect(mt.chapterId).toBeUndefined();
  });

  it("supports @chapter with chapterId", () => {
    const mt: MentionTarget = {
      kind: "chapter",
      label: "@chapter Chapter One",
      chapterId: "ch-1",
      chapterTitle: "Chapter One",
    };
    expect(mt.kind).toBe("chapter");
    expect(mt.chapterId).toBe("ch-1");
  });

  it("supports @project", () => {
    const mt: MentionTarget = { kind: "project", label: "@project" };
    expect(mt.kind).toBe("project");
  });
});

describe("RAGCitation type", () => {
  it("has required and optional fields", () => {
    const rc: RAGCitation = {
      chapterId: "ch-2",
      chapterTitle: "Chapter Two",
      snippet: "Meanwhile, the hero entered.",
    };
    expect(rc.score).toBeUndefined();

    const withScore: RAGCitation = { ...rc, score: 0.92 };
    expect(withScore.score).toBe(0.92);
  });
});

describe("InsertPosition enum", () => {
  it("accepts all four positions", () => {
    const positions: InsertPosition[] = ["cursor", "replace", "before", "after"];
    expect(positions).toHaveLength(4);
  });
});
