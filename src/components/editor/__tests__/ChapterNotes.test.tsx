import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChapterNotes from "../ChapterNotes";
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

describe("ChapterNotes", () => {
  it("renders sidebar panel with header '笔记'", () => {
    render(
      <ChapterNotes chapter={createChapter()} onNotesChange={vi.fn()} />,
    );
    expect(screen.getByText("笔记")).toBeInTheDocument();
  });

  it("renders a textarea for editing notes", () => {
    render(
      <ChapterNotes chapter={createChapter({ notes: "Some notes" })} onNotesChange={vi.fn()} />,
    );
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Some notes");
  });

  it("shows placeholder text when notes is empty", () => {
    render(
      <ChapterNotes chapter={createChapter({ notes: "" })} onNotesChange={vi.fn()} />,
    );
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("placeholder", "记录灵感、伏笔、情节构思...");
  });

  it("calls onNotesChange on blur when text changed", () => {
    const onNotesChange = vi.fn();
    render(
      <ChapterNotes chapter={createChapter({ notes: "Original" })} onNotesChange={onNotesChange} />,
    );
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Updated notes" } });
    fireEvent.blur(textarea);
    expect(onNotesChange).toHaveBeenCalledWith("Updated notes");
  });

  it("does not call onNotesChange on blur when text unchanged", () => {
    const onNotesChange = vi.fn();
    render(
      <ChapterNotes chapter={createChapter({ notes: "Same notes" })} onNotesChange={onNotesChange} />,
    );
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Same notes" } });
    fireEvent.blur(textarea);
    expect(onNotesChange).not.toHaveBeenCalled();
  });

  it("renders 'AI 提取伏笔' button", () => {
    render(
      <ChapterNotes chapter={createChapter()} onNotesChange={vi.fn()} />,
    );
    expect(screen.getByText("AI 提取伏笔")).toBeInTheDocument();
  });

  it("calls aiService.execute with extract_keywords when 'AI 提取伏笔' clicked", async () => {
    vi.mocked(aiService.execute).mockResolvedValue({
      result: "伏笔: 主角的梦境",
      citations: [],
      metadata: { command: "extract_keywords", durationMs: 100 },
    });
    const chapter = createChapter({ content: "A".repeat(2000) });
    const onNotesChange = vi.fn();
    render(
      <ChapterNotes chapter={chapter} onNotesChange={onNotesChange} />,
    );
    fireEvent.click(screen.getByText("AI 提取伏笔"));
    expect(aiService.execute).toHaveBeenCalledWith("extract_keywords", "A".repeat(1000));
    await vi.waitFor(() => {
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("伏笔: 主角的梦境");
    });
  });

  it("renders 'AI 继续' button", () => {
    render(
      <ChapterNotes chapter={createChapter()} onNotesChange={vi.fn()} />,
    );
    expect(screen.getByText("AI 继续")).toBeInTheDocument();
  });

  it("calls aiService.execute with continue when 'AI 继续' clicked and appends result", async () => {
    vi.mocked(aiService.execute).mockResolvedValue({
      result: " continued notes",
      citations: [],
      metadata: { command: "continue", durationMs: 100 },
    });
    const chapter = createChapter({ notes: "Existing notes", content: "Full chapter content" });
    const onNotesChange = vi.fn();
    render(
      <ChapterNotes chapter={chapter} onNotesChange={onNotesChange} />,
    );
    fireEvent.click(screen.getByText("AI 继续"));
    expect(aiService.execute).toHaveBeenCalledWith("continue", "Full chapter content");
    await vi.waitFor(() => {
      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("Existing notes continued notes");
    });
  });

  it("applies sidebar panel styling", () => {
    const { container } = render(
      <ChapterNotes chapter={createChapter()} onNotesChange={vi.fn()} />,
    );
    const panel = container.firstElementChild;
    expect(panel).toHaveClass("flex", "flex-col", "h-full");
  });
});
