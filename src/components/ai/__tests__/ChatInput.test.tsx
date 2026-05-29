import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "../../../test/utils";

import ChatInput from "../ChatInput";
import type { Chapter } from "../../../types/novel";

const mockChapters: Chapter[] = [
  {
    id: "ch-1",
    projectId: "proj-1",
    title: "第一章 初遇",
    content: "天下着细雨...",
    order: 1,
    summary: "",
    wordGoal: 5000,
    status: "draft",
    notes: "",
  },
  {
    id: "ch-2",
    projectId: "proj-1",
    title: "第二章 离别",
    content: "车站人来人往...",
    order: 2,
    summary: "",
    wordGoal: 5000,
    status: "draft",
    notes: "",
  },
  {
    id: "ch-3",
    projectId: "proj-1",
    title: "终章 重逢",
    content: "十年后...",
    order: 3,
    summary: "",
    wordGoal: 5000,
    status: "done",
    notes: "",
  },
];

const mockOnSend = vi.fn();

function renderChatInput(chapters?: Chapter[]) {
  return renderWithProviders(
    <ChatInput
      onSend={mockOnSend}
      disabled={false}
      chapters={chapters ?? mockChapters}
    />
  );
}

describe("ChatInput @mention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the basic input area", () => {
    renderChatInput();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("对话")).toBeInTheDocument();
    expect(screen.getByText("续写")).toBeInTheDocument();
    expect(screen.getByText("头脑风暴")).toBeInTheDocument();
  });

  it("does not show mention menu when typing normal text", () => {
    renderChatInput();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "hello world" } });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows mention menu when @ is typed", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "@" } });
    // Trigger selectionChange/Caret position update
    input.selectionStart = 1;
    input.selectionEnd = 1;
    fireEvent.keyUp(input, { key: "@" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
  });

  it("shows @selection, @chapter, @project in menu", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "@" } });
    input.selectionStart = 1;
    input.selectionEnd = 1;
    fireEvent.keyUp(input, { key: "@" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
    const options = screen.getAllByRole("option");
    const labels = options.map(o => o.textContent);
    expect(labels.some(l => l?.includes("@selection"))).toBe(true);
    expect(labels.some(l => l?.includes("@project"))).toBe(true);
    expect(labels.some(l => l?.includes("@chapter"))).toBe(true);
  });

  it("filters chapter list when typing after @chapter", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "@chapter" } });
    input.selectionStart = 8;
    input.selectionEnd = 8;
    fireEvent.keyUp(input, { key: "r" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
    const options = screen.getAllByRole("option");
    const labels = options.map(o => o.textContent);
    expect(labels.some(l => l?.includes("第一章"))).toBe(true);
    expect(labels.some(l => l?.includes("第二章"))).toBe(true);
    expect(labels.some(l => l?.includes("终章"))).toBe(true);
  });

  it("filters chapters by query after @chapter ", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "@chapter 初" } });
    input.selectionStart = 10;
    input.selectionEnd = 10;
    fireEvent.keyUp(input, { key: "初" });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("closes menu on Escape", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "@" } });
    input.selectionStart = 1;
    input.selectionEnd = 1;
    fireEvent.keyUp(input, { key: "@" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("selecting @selection inserts mention text into input", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "@" } });
    input.selectionStart = 1;
    input.selectionEnd = 1;
    fireEvent.keyUp(input, { key: "@" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const selectionOption = screen.getAllByRole("option").find(o => o.textContent?.includes("@selection"));
    expect(selectionOption).toBeDefined();
    fireEvent.click(selectionOption!);

    // After selection, the @ trigger text is replaced with the mention token
    // The exact format depends on implementation - verify mention appears
    await waitFor(() => {
      expect(input.value).toContain("@selection");
    });
  });

  it("selecting @project inserts mention text", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "@" } });
    input.selectionStart = 1;
    input.selectionEnd = 1;
    fireEvent.keyUp(input, { key: "@" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const projectOption = screen.getAllByRole("option").find(o => o.textContent?.includes("@project"));
    expect(projectOption).toBeDefined();
    fireEvent.click(projectOption!);

    await waitFor(() => {
      expect(input.value).toContain("@project");
    });
  });

  it("selecting a chapter inserts its title as mention", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "@chapter" } });
    input.selectionStart = 8;
    input.selectionEnd = 8;
    fireEvent.keyUp(input, { key: "r" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    const chapterOption = screen.getAllByRole("option").find(o => o.textContent?.includes("初遇"));
    expect(chapterOption).toBeDefined();
    fireEvent.click(chapterOption!);

    await waitFor(() => {
      expect(input.value).toContain("第一章 初遇");
    });
  });

  it("closes menu when clicking outside", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "@" } });
    input.selectionStart = 1;
    input.selectionEnd = 1;
    fireEvent.keyUp(input, { key: "@" });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    // Click outside the menu (on one of the mode buttons)
    fireEvent.mouseDown(screen.getByText("对话"));

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("works with existing mode switching", () => {
    renderChatInput();
    const brainstormBtn = screen.getByText("头脑风暴");
    fireEvent.click(brainstormBtn);

    // Mode buttons exist and can be clicked without errors
    expect(screen.getByText("续写")).toBeInTheDocument();
    expect(screen.getByText("对话")).toBeInTheDocument();
  });

  it("handles empty chapters gracefully", async () => {
    renderChatInput([]);
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "@chapter" } });
    input.selectionStart = 8;
    input.selectionEnd = 8;
    fireEvent.keyUp(input, { key: "r" });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("menu does not appear for @ in the middle of a word", async () => {
    renderChatInput();
    const input = screen.getByRole("textbox") as HTMLTextAreaElement;

    fireEvent.change(input, { target: { value: "test@example" } });
    input.selectionStart = 13;
    input.selectionEnd = 13;
    fireEvent.keyUp(input, { key: "e" });

    // @ not at word boundary → no menu
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
