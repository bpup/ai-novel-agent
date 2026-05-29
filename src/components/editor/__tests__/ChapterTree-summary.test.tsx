import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChapterTree from "../ChapterTree";
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

describe("ChapterTree summary", () => {
  it("shows summary toggle on each chapter row", () => {
    const chapters = [createChapter()];
    render(
      <ChapterTree
        chapters={chapters}
        selectedChapterId={null}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/摘要/)).toBeInTheDocument();
  });

  it("displays summary text when expanded", () => {
    const chapters = [createChapter({ summary: "A brief test summary" })];
    render(
      <ChapterTree
        chapters={chapters}
        selectedChapterId={null}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/摘要/));
    expect(screen.getByText("A brief test summary")).toBeInTheDocument();
  });

  it("renders AI generate button when summary area is expanded", () => {
    const chapters = [createChapter()];
    render(
      <ChapterTree
        chapters={chapters}
        selectedChapterId={null}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/摘要/));
    expect(screen.getByText("AI 生成摘要")).toBeInTheDocument();
  });

  it("calls aiService.execute with summarize and content slice when AI button clicked", async () => {
    vi.mocked(aiService.execute).mockResolvedValue({
      result: "AI generated summary",
      citations: [],
      metadata: { command: "summarize", durationMs: 100 },
    });
    const chapters = [createChapter({ content: "x".repeat(600), summary: "" })];
    render(
      <ChapterTree
        chapters={chapters}
        selectedChapterId={null}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/摘要/));
    fireEvent.click(screen.getByText("AI 生成摘要"));
    expect(aiService.execute).toHaveBeenCalledWith("summarize", "x".repeat(500));
  });

  it("provides a textarea for editing summary", () => {
    const chapters = [createChapter({ summary: "Original summary" })];
    render(
      <ChapterTree
        chapters={chapters}
        selectedChapterId={null}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/摘要/));
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Original summary");
    fireEvent.change(textarea, { target: { value: "Edited summary" } });
    expect(textarea).toHaveValue("Edited summary");
  });

  it("calls onSummaryChange on blur when text changed", () => {
    const onSummaryChange = vi.fn();
    const chapters = [createChapter({ summary: "Original" })];
    render(
      <ChapterTree
        chapters={chapters}
        selectedChapterId={null}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
        onSummaryChange={onSummaryChange}
      />,
    );
    fireEvent.click(screen.getByText(/摘要/));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "New summary" } });
    fireEvent.blur(textarea);
    expect(onSummaryChange).toHaveBeenCalledWith("ch-1", "New summary");
  });

  it("does not call onSummaryChange when text unchanged on blur", () => {
    const onSummaryChange = vi.fn();
    const chapters = [createChapter({ summary: "Same summary" })];
    render(
      <ChapterTree
        chapters={chapters}
        selectedChapterId={null}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
        onSummaryChange={onSummaryChange}
      />,
    );
    fireEvent.click(screen.getByText(/摘要/));
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Same summary" } });
    fireEvent.blur(textarea);
    expect(onSummaryChange).not.toHaveBeenCalled();
  });

  it("toggles summary area collapse/expand on click", () => {
    const chapters = [createChapter({ summary: "Collapsible summary" })];
    render(
      <ChapterTree
        chapters={chapters}
        selectedChapterId={null}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const toggle = screen.getByText(/▶.*摘要/);
    fireEvent.click(toggle);
    expect(screen.getByText("Collapsible summary")).toBeVisible();
    fireEvent.click(toggle);
    expect(screen.queryByText("Collapsible summary")).not.toBeInTheDocument();
  });
});
