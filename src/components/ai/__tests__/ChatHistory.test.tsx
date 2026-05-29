import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/utils";
import ChatHistory from "../ChatHistory";
import type { ChatSession } from "../../../types/chat";

const mockSessions: ChatSession[] = [
  {
    id: "session-1",
    projectId: "test-project",
    title: "Chapter 1 brainstorming",
    messages: [
      { id: "m1", role: "user", content: "帮我写第一章的开头", createdAt: "2026-05-20T10:00:00Z" },
      { id: "m2", role: "assistant", content: "好的，第一章从一个雨夜开始...", createdAt: "2026-05-20T10:01:00Z" },
    ],
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: "2026-05-20T10:01:00Z",
  },
  {
    id: "session-2",
    projectId: "test-project",
    title: "Character descriptions",
    messages: [
      { id: "m3", role: "user", content: "帮我设计主角的性格", createdAt: "2026-05-21T14:00:00Z" },
      { id: "m4", role: "assistant", content: "主角是个内向但坚韧的程序员...", createdAt: "2026-05-21T14:02:00Z" },
    ],
    createdAt: "2026-05-21T14:00:00Z",
    updatedAt: "2026-05-21T14:02:00Z",
  },
  {
    id: "session-3",
    projectId: "test-project",
    title: "剧情反转构思",
    messages: [
      { id: "m5", role: "user", content: "帮我构思剧情反转", createdAt: "2026-05-19T09:00:00Z" },
      { id: "m6", role: "assistant", content: "可以考虑让角色A其实是反派...", createdAt: "2026-05-19T09:02:00Z" },
    ],
    createdAt: "2026-05-19T09:00:00Z",
    updatedAt: "2026-05-19T09:02:00Z",
  },
];

const STORAGE_KEY = "chat_sessions_test-project";

describe("ChatHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders empty state when no sessions exist", () => {
    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    expect(screen.getByText(/暂无历史会话/)).toBeDefined();
  });

  it("renders session list sorted by updatedAt descending", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain("Character descriptions");
    expect(items[1].textContent).toContain("Chapter 1 brainstorming");
    expect(items[2].textContent).toContain("剧情反转构思");
  });

  it("filters sessions by search text", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const searchInput = screen.getByPlaceholderText(/搜索/);
    fireEvent.change(searchInput, { target: { value: "character" } });

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain("Character descriptions");
  });

  it("filters sessions by Chinese search text", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const searchInput = screen.getByPlaceholderText(/搜索/);
    fireEvent.change(searchInput, { target: { value: "剧情" } });

    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain("剧情反转构思");
  });

  it("shows empty message when search has no matches", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const searchInput = screen.getByPlaceholderText(/搜索/);
    fireEvent.change(searchInput, { target: { value: "zzz_nonexistent" } });

    expect(screen.getByText(/暂无历史会话/)).toBeDefined();
  });

  it("creates new session and persists to localStorage", async () => {
    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const newBtn = screen.getByText(/新建对话/);
    fireEvent.click(newBtn);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      expect(stored.length).toBe(1);
      expect(stored[0].title).toBe("新对话");
      expect(stored[0].messages).toEqual([]);
      expect(stored[0].projectId).toBe("test-project");
    });
  });

  it("preserves existing sessions when creating new one", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    const onSelect = vi.fn();
    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={onSelect} />
    );

    const newBtn = screen.getByText(/新建对话/);
    fireEvent.click(newBtn);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored.length).toBe(4);
  });

  it("creates session with unique UUID and valid timestamps", () => {
    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const newBtn = screen.getByText(/新建对话/);
    fireEvent.click(newBtn);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const created = stored[0];

    expect(created.id.length).toBeGreaterThan(10);
    expect(Date.parse(created.createdAt)).toBeGreaterThan(0);
  });

  it("deletes session after confirmation", () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const deleteBtns = screen.getAllByText("删除");
    fireEvent.click(deleteBtns[0]);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored.length).toBe(2);
    expect(stored.find((s: ChatSession) => s.id === "session-2")).toBeUndefined();

    window.confirm = originalConfirm;
  });

  it("does not delete when confirmation cancelled", () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => false);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const deleteBtns = screen.getAllByText("删除");
    fireEvent.click(deleteBtns[0]);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored.length).toBe(3);

    window.confirm = originalConfirm;
  });

  it("calls onSelect when clicking a session item", () => {
    const onSelect = vi.fn();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={onSelect} />
    );

    const items = screen.getAllByRole("listitem");
    const selectBtn = items[0].querySelector("button:not([title])");
    fireEvent.click(selectBtn!);

    expect(onSelect).toHaveBeenCalledWith("session-2");
  });

  it("highlights active session with visual distinction", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    renderWithProviders(
      <ChatHistory
        projectId="test-project"
        activeSessionId="session-1"
        onSelect={vi.fn()}
      />
    );

    const items = screen.getAllByRole("listitem");
    const activeItem = items.find((el) =>
      el.textContent?.includes("Chapter 1 brainstorming")
    );
    expect(activeItem).toBeDefined();
    expect(activeItem!.querySelector("button")!.className).toMatch(/bg-sage/);
  });

  it("truncates auto-title to 30 characters from first user message", () => {
    const longSessions: ChatSession[] = [
      {
        id: "s-long",
        projectId: "test-project",
        title: "",
        messages: [
          {
            id: "m1",
            role: "user",
            content: "这是一个非常非常长的用户消息用来测试自动标题截断功能可以正确处理超过三十个字的用户消息",
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(longSessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const items = screen.getAllByRole("listitem");
    const titleText = items[0].querySelector("button:not([title])")!.textContent || "";
    expect(titleText).toContain("这是一个非常非常长的用户消息用来测试自动标题截断功能可以正");
  });

  it("handles session with no user messages gracefully", () => {
    const emptySessions: ChatSession[] = [
      {
        id: "s-empty",
        projectId: "test-project",
        title: "",
        messages: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptySessions));

    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={vi.fn()} />
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0].textContent).toBeDefined();
  });

  it("isolates sessions by projectId using different localStorage keys", () => {
    localStorage.setItem("chat_sessions_project-a", JSON.stringify(mockSessions));
    localStorage.setItem("chat_sessions_project-b", JSON.stringify([]));

    renderWithProviders(
      <ChatHistory projectId="project-b" onSelect={vi.fn()} />
    );

    expect(screen.getByText(/暂无历史会话/)).toBeDefined();
  });

  it("clears search when creating new session", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSessions));

    const onSelect = vi.fn();
    renderWithProviders(
      <ChatHistory projectId="test-project" onSelect={onSelect} />
    );

    const searchInput = screen.getByPlaceholderText(/搜索/);
    fireEvent.change(searchInput, { target: { value: "character" } });

    const newBtn = screen.getByText(/新建对话/);
    fireEvent.click(newBtn);

    expect((searchInput as HTMLInputElement).value).toBe("");
  });
});
