import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectOutline from "../ProjectOutline";
import type { Chapter } from "../../../types/novel";
import { aiService } from "../../ai/orchestrator/AIService";

vi.mock("../../ai/orchestrator/AIService", () => ({
  aiService: {
    execute: vi.fn(),
  },
}));

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

describe("ProjectOutline", () => {
  it("renders chapters in order with hierarchical indentation", () => {
    const chapters = [
      createChapter({ id: "ch-1", title: "Chapter 1", order: 0 }),
      createChapter({ id: "ch-2", title: "Chapter 2", order: 1 }),
      createChapter({ id: "ch-3", title: "Chapter 3", order: 2 }),
    ];
    render(
      <ProjectOutline
        chapters={chapters}
        onReorder={vi.fn()}
        onNavigateToChapter={vi.fn()}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Chapter 1");
    expect(items[1]).toHaveTextContent("Chapter 2");
    expect(items[2]).toHaveTextContent("Chapter 3");
  });

  it("sorts chapters by order when order differs from array position", () => {
    const chapters = [
      createChapter({ id: "ch-3", title: "Chapter Three", order: 2 }),
      createChapter({ id: "ch-1", title: "Chapter One", order: 0 }),
      createChapter({ id: "ch-2", title: "Chapter Two", order: 1 }),
    ];
    render(
      <ProjectOutline
        chapters={chapters}
        onReorder={vi.fn()}
        onNavigateToChapter={vi.fn()}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Chapter One");
    expect(items[1]).toHaveTextContent("Chapter Two");
    expect(items[2]).toHaveTextContent("Chapter Three");
  });

  it("drag-and-drop reorder triggers onReorder callback with correct new order", () => {
    const onReorder = vi.fn();
    const chapters = [
      createChapter({ id: "ch-1", title: "Chapter 1", order: 0 }),
      createChapter({ id: "ch-2", title: "Chapter 2", order: 1 }),
      createChapter({ id: "ch-3", title: "Chapter 3", order: 2 }),
    ];
    render(
      <ProjectOutline
        chapters={chapters}
        onReorder={onReorder}
        onNavigateToChapter={vi.fn()}
      />,
    );

    const items = screen.getAllByRole("listitem");
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      getData: vi.fn(() => "0"),
      setData: vi.fn(),
    };

    fireEvent.dragStart(items[0], { dataTransfer });
    fireEvent.dragOver(items[2], { dataTransfer });
    fireEvent.drop(items[2], { dataTransfer });

    expect(onReorder).toHaveBeenCalledTimes(1);
    const reordered = onReorder.mock.calls[0][0];
    expect(reordered).toHaveLength(3);
    expect(reordered[0].id).toBe("ch-2");
    expect(reordered[1].id).toBe("ch-3");
    expect(reordered[2].id).toBe("ch-1");
  });

  it("AI button triggers aiService.execute with generate_outline and all titles", async () => {
    vi.mocked(aiService.execute).mockResolvedValue({
      result: "Generated outline",
      citations: [],
      metadata: { command: "generate_outline", durationMs: 100 },
    });
    const chapters = [
      createChapter({ id: "ch-1", title: "Chapter 1", order: 0 }),
      createChapter({ id: "ch-2", title: "Chapter 2", order: 1 }),
    ];
    render(
      <ProjectOutline
        chapters={chapters}
        onReorder={vi.fn()}
        onNavigateToChapter={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("AI 生成大纲"));

    expect(aiService.execute).toHaveBeenCalledWith(
      "generate_outline",
      "Chapter 1\nChapter 2",
    );
  });

  it("click on chapter title calls onNavigateToChapter with chapter id", () => {
    const onNavigateToChapter = vi.fn();
    const chapters = [
      createChapter({ id: "ch-1", title: "Chapter 1", order: 0 }),
    ];
    render(
      <ProjectOutline
        chapters={chapters}
        onReorder={vi.fn()}
        onNavigateToChapter={onNavigateToChapter}
      />,
    );

    fireEvent.click(screen.getByText("Chapter 1"));

    expect(onNavigateToChapter).toHaveBeenCalledWith("ch-1");
  });
});
