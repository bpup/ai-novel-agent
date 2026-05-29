import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../test/utils";
import AISidebar from "../AISidebar";

const mockEditor = {
  state: {
    selection: { from: 10, to: 20, empty: false },
    doc: {
      textBetween: () => "selected text",
      content: { size: 100 },
    },
    tr: {
      insertText: vi.fn(() => ({
        insertText: vi.fn(),
      })),
    },
  },
  view: {
    dispatch: vi.fn(),
    focus: vi.fn(),
  },
} as unknown as import("@tiptap/react").Editor;

describe("AISidebar", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders AI sidebar toggle button", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    const toggleBtn = screen.getByTitle("打开 AI 助手");
    expect(toggleBtn).toBeDefined();
  });

  it("opens panel when toggle button is clicked", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    const toggleBtn = screen.getByTitle("打开 AI 助手");
    fireEvent.click(toggleBtn);

    expect(screen.getByText("AI 助手")).toBeDefined();
    expect(screen.getByPlaceholderText(/输入消息/)).toBeDefined();
  });

  it("closes panel when close button is clicked", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    const toggleBtn = screen.getByTitle("打开 AI 助手");
    fireEvent.click(toggleBtn);

    const closeBtn = screen.getByTitle("关闭面板");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("AI 助手")).toBeNull();
  });

  it("renders quick action buttons (续写, 润色, 扩写)", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    fireEvent.click(screen.getByTitle("打开 AI 助手"));

    expect(screen.getByTitle("从光标位置续写")).toBeDefined();
    expect(screen.getByTitle("润色选中文字")).toBeDefined();
    expect(screen.getByTitle("扩写选中段落")).toBeDefined();
  });

  it("renders accept and reject buttons when suggestion is set", () => {
    renderWithProviders(
      <AISidebar editor={mockEditor} projectId="test-project" />,
    );

    fireEvent.click(screen.getByTitle("打开 AI 助手"));

    expect(screen.queryByText("接受")).toBeNull();
    expect(screen.queryByText("拒绝")).toBeNull();
  });

  it("renders ChatInput within the open panel", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    fireEvent.click(screen.getByTitle("打开 AI 助手"));

    const input = screen.getByPlaceholderText(/输入消息/);
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).disabled).toBe(false);
  });

  it("disables ChatInput when isLoading and editor null", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    fireEvent.click(screen.getByTitle("打开 AI 助手"));

    const input = screen.getByPlaceholderText(/输入消息/);
    expect(input).toBeDefined();
  });

  it("renders history button in panel header", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    fireEvent.click(screen.getByTitle("打开 AI 助手"));

    expect(screen.getByText("历史")).toBeDefined();
  });

  it("shows ChatHistory panel when history button is clicked", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    fireEvent.click(screen.getByTitle("打开 AI 助手"));
    fireEvent.click(screen.getByText("历史"));

    expect(screen.getByText("暂无历史会话")).toBeDefined();
    expect(screen.getByText("+ 新建对话")).toBeDefined();
  });

  it("returns to chat view when back button is clicked from history", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    fireEvent.click(screen.getByTitle("打开 AI 助手"));
    fireEvent.click(screen.getByText("历史"));

    expect(screen.getByText("暂无历史会话")).toBeDefined();

    fireEvent.click(screen.getByText("返回"));

    expect(screen.getByPlaceholderText(/输入消息/)).toBeDefined();
  });

  it("preserves quick action buttons when history view is toggled", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    fireEvent.click(screen.getByTitle("打开 AI 助手"));

    expect(screen.getByTitle("从光标位置续写")).toBeDefined();
    expect(screen.getByTitle("润色选中文字")).toBeDefined();
    expect(screen.getByTitle("扩写选中段落")).toBeDefined();
  });
});
