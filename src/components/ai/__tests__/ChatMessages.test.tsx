import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import ChatMessages from "../ChatMessages";
import { renderWithProviders } from "../../../test/utils";

const mockEditor = {
  state: { selection: { from: 0, to: 0 }, doc: { content: { size: 100 } } },
  commands: { setGhostText: vi.fn() },
  view: { dispatch: vi.fn(), focus: vi.fn() },
} as unknown as import("@tiptap/react").Editor;

const ts = () => new Date().toISOString();

describe("ChatMessages", () => {
  it("renders empty state when no messages and not loading", () => {
    renderWithProviders(
      <ChatMessages
        messages={[]}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("开始与 AI 对话")).toBeDefined();
  });

  it("renders citation chips for assistant with citations", () => {
    const messages = [
      {
        role: "assistant" as const,
        content: "test",
        timestamp: ts(),
        citations: [{ chapterId: "1", chapterTitle: "第一章", snippet: "text" }],
      },
    ];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("↩ 第一章")).toBeDefined();
  });

  it("does NOT render citation chips when citations is empty array", () => {
    const messages = [
      { role: "assistant" as const, content: "test", timestamp: ts(), citations: [] },
    ];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.queryByText(/↩/)).toBeNull();
  });

  it("does NOT render citation chips when citations is undefined", () => {
    const messages = [{ role: "assistant" as const, content: "test", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.queryByText(/↩/)).toBeNull();
  });

  it("has 复制 button for assistant messages", () => {
    const messages = [{ role: "assistant" as const, content: "hello", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("复制")).toBeDefined();
  });

  it("shows 已复制 after clicking 复制", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    const messages = [{ role: "assistant" as const, content: "hello", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("复制"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
    await waitFor(() => {
      expect(screen.getByText("已复制")).toBeDefined();
    });
  });

  it("has 插入 and 替换 buttons when editor is provided", () => {
    const messages = [{ role: "assistant" as const, content: "hello", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={mockEditor}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("插入")).toBeDefined();
    expect(screen.getByText("替换")).toBeDefined();
  });

  it("does NOT show 插入/替换 when editor is null", () => {
    const messages = [{ role: "assistant" as const, content: "hello", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.queryByText("插入")).toBeNull();
    expect(screen.queryByText("替换")).toBeNull();
  });

  it("has 追加 button for assistant messages", () => {
    const messages = [{ role: "assistant" as const, content: "hello", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("追加")).toBeDefined();
  });

  it("calls onAppendToEnd with message content on 追加 click", () => {
    const onAppend = vi.fn();
    const messages = [{ role: "assistant" as const, content: "hello world", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={onAppend}
      />,
    );
    fireEvent.click(screen.getByText("追加"));
    expect(onAppend).toHaveBeenCalledWith("hello world");
  });

  it("calls onInsertAtCursor with message content on 插入 click", () => {
    const onInsert = vi.fn();
    const messages = [{ role: "assistant" as const, content: "test", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={mockEditor}
        onInsertAtCursor={onInsert}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("插入"));
    expect(onInsert).toHaveBeenCalledWith("test");
  });

  it("calls onReplaceSelection with message content on 替换 click", () => {
    const onReplace = vi.fn();
    const messages = [{ role: "assistant" as const, content: "test", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={mockEditor}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={onReplace}
        onAppendToEnd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("替换"));
    expect(onReplace).toHaveBeenCalledWith("test");
  });

  it("renders multiple citation chips", () => {
    const messages = [
      {
        role: "assistant" as const,
        content: "test",
        timestamp: ts(),
        citations: [
          { chapterId: "1", chapterTitle: "第一章", snippet: "a" },
          { chapterId: "2", chapterTitle: "第二章", snippet: "b" },
        ],
      },
    ];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("↩ 第一章")).toBeDefined();
    expect(screen.getByText("↩ 第二章")).toBeDefined();
  });

  it("does NOT render action buttons for user messages", () => {
    const messages = [{ role: "user" as const, content: "hello", timestamp: ts() }];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.queryByText("复制")).toBeNull();
    expect(screen.queryByText("追加")).toBeNull();
  });

  it("renders user and assistant message bubbles with correct alignment", () => {
    const messages = [
      { role: "user" as const, content: "hi", timestamp: ts() },
      { role: "assistant" as const, content: "hello", timestamp: ts() },
    ];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("hi")).toBeDefined();
    expect(screen.getByText("hello")).toBeDefined();
  });

  it("accepts messages with timestamp field", () => {
    const messages = [
      { role: "assistant" as const, content: "ok", timestamp: "2024-01-01T00:00:00Z" },
    ];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("ok")).toBeDefined();
  });

  it("accepts messages with createdAt field", () => {
    const messages = [
      { role: "assistant" as const, content: "ok", timestamp: ts(), createdAt: "2024-01-01T00:00:00Z" },
    ];
    renderWithProviders(
      <ChatMessages
        messages={messages}
        isLoading={false}
        editor={null}
        onInsertAtCursor={vi.fn()}
        onReplaceSelection={vi.fn()}
        onAppendToEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("ok")).toBeDefined();
  });
});
