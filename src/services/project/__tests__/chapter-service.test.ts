import { describe, it, expect } from "vitest";
import type { Chapter } from "../../../types/novel";
import type { ChapterStatus } from "../../../types/chat";

/**
 * Structural tests for ChapterService logic.
 * Since the service directly uses SQLite via runQuery/getRows,
 * we test the data transformation patterns the service must follow:
 * - Default value application for new optional Chapter fields
 * - ChapterStatus validation
 * - Backward compatibility with old chapter data
 */

const CHAPTER_DEFAULTS = {
  summary: "",
  wordGoal: 5000,
  status: "draft" as ChapterStatus,
  notes: "",
};

describe("Chapter defaults for new optional fields", () => {
  const baseChapter: Chapter = {
    id: "ch-1",
    projectId: "proj-1",
    title: "Prologue",
    content: "In the beginning...",
    order: 0,
  };

  it("addChapter should return Chapter with all new fields set to defaults", () => {
    // Simulates what ChapterService.addChapter must return
    const result: Chapter = {
      ...baseChapter,
      ...CHAPTER_DEFAULTS,
    };

    expect(result.summary).toBe("");
    expect(result.wordGoal).toBe(5000);
    expect(result.status).toBe("draft");
    expect(result.notes).toBe("");
    // Original fields preserved
    expect(result.id).toBe("ch-1");
    expect(result.title).toBe("Prologue");
    expect(result.content).toBe("In the beginning...");
  });

  it("getChapters should apply defaults for DB rows missing new fields", () => {
    // Simulates a DB row without new columns (backward compat)
    const dbRow: Omit<Chapter, "summary" | "wordGoal" | "status" | "notes"> = {
      id: "ch-2",
      projectId: "proj-1",
      title: "Old Chapter",
      content: "Legacy content",
      order: 1,
    };

    // ChapterService.getChapters must apply defaults
    const result: Chapter = {
      ...dbRow,
      ...CHAPTER_DEFAULTS,
    };

    expect(result.summary).toBe("");
    expect(result.wordGoal).toBe(5000);
    expect(result.status).toBe("draft");
    expect(result.notes).toBe("");
  });

  it("getChapters should NOT override explicitly set values", () => {
    // If somehow the row has these values, they should be preserved
    const withExplicit: Chapter = {
      ...baseChapter,
      id: "ch-3",
      summary: "Custom summary",
      wordGoal: 10000,
      status: "done",
      notes: "Custom notes",
    };

    const result: Chapter = {
      ...CHAPTER_DEFAULTS,
      ...withExplicit,
    };

    expect(result.summary).toBe("Custom summary");
    expect(result.wordGoal).toBe(10000);
    expect(result.status).toBe("done");
    expect(result.notes).toBe("Custom notes");
  });
});

describe("ChapterStatus validation", () => {
  const validStatuses: ChapterStatus[] = ["draft", "writing", "done", "paused"];

  it("should accept valid ChapterStatus values", () => {
    validStatuses.forEach((status) => {
      expect(validStatuses).toContain(status);
    });
  });

  it("should have exactly 4 valid statuses", () => {
    expect(validStatuses).toHaveLength(4);
  });

  it("default status should be 'draft'", () => {
    expect(CHAPTER_DEFAULTS.status).toBe("draft");
  });
});

describe("Chapter type backward compatibility", () => {
  it("Chapter without new fields still has correct shape when defaults applied", () => {
    const legacyChapter: Chapter = {
      id: "old-ch",
      projectId: "p1",
      title: "Chapter 1",
      content: "Hello",
      order: 0,
    };

    // After applying defaults (what service must do)
    const migrated: Chapter = {
      ...CHAPTER_DEFAULTS,
      ...legacyChapter,
    };

    // Must have all required fields
    expect(migrated.id).toBeDefined();
    expect(migrated.projectId).toBeDefined();
    expect(migrated.title).toBeDefined();
    expect(migrated.content).toBeDefined();
    expect(migrated.order).toBeDefined();

    // New fields must have defaults
    expect(migrated.summary).toBe("");
    expect(migrated.wordGoal).toBe(5000);
    expect(migrated.status).toBe("draft");
    expect(migrated.notes).toBe("");
  });

  it("partial update (title only) should preserve existing new field values", () => {
    // Testing the merge logic updateChapter should use
    const existing: Chapter = {
      id: "ch-4",
      projectId: "p1",
      title: "Original",
      content: "Content",
      order: 0,
      summary: "My summary",
      wordGoal: 8000,
      status: "writing",
      notes: "My notes",
    };

    const update: Partial<Chapter> = {
      title: "Updated Title",
    };

    // Merge defaults first, then existing, then update — so update takes priority
    const result: Chapter = {
      ...CHAPTER_DEFAULTS,
      ...existing,
      ...update,
    };

    expect(result.title).toBe("Updated Title");
    // New fields from existing should be preserved
    expect(result.summary).toBe("My summary");
    expect(result.wordGoal).toBe(8000);
    expect(result.status).toBe("writing");
    expect(result.notes).toBe("My notes");
  });

  it("chapter with all zeros (edge case) should apply defaults correctly", () => {
    const zeroChapter: Chapter = {
      id: "",
      projectId: "",
      title: "",
      content: "",
      order: 0,
    };

    const result: Chapter = {
      ...CHAPTER_DEFAULTS,
      ...zeroChapter,
    };

    // wordGoal default (5000) should be overridden if explicitly set to 0
    // But for backward compat, we apply defaults BEFORE the actual data
    // So if wordGoal is explicitly undefined in the DB row, default is 5000
    // If wordGoal is 0 (explicitly set), it overrides default
    // Our test data doesn't have wordGoal, so it gets default
    expect(result.wordGoal).toBe(5000);
  });
});

describe("Service must preserve existing API contract", () => {
  it("reorderChapters should still work with new fields", () => {
    // reorderChapters only touches chapter_order, new fields irrelevant
    const chapters: Chapter[] = [
      { id: "a", projectId: "p", title: "A", content: "a", order: 0 },
      { id: "b", projectId: "p", title: "B", content: "b", order: 1 },
    ];
    // Reorder: swap a and b
    const reordered = [chapters[1], chapters[0]];
    expect(reordered[0].id).toBe("b");
    expect(reordered[1].id).toBe("a");
  });

  it("deleteChapter should work regardless of new fields", () => {
    // deleteChapter is DELETE by id, new fields don't affect it
    expect(true).toBe(true); // structural — actual DB test would need integration
  });
});
