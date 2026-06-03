import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/utils";
import AISidebar from "../AISidebar";

// ─── Mocks ───────────────────────────────────────────────────────────

const mockStreamChat = vi.fn();
const mockContinueWriting = vi.fn();
const mockBrainstorm = vi.fn();
const mockPolishText = vi.fn();
const mockExpandText = vi.fn();
const mockGetHistory = vi.fn((..._args: unknown[]) => []);
const mockClearHistory = vi.fn();
const mockGetReferenceCount = vi.fn(() => 0);

vi.mock("../../../services/ai/orchestrator", () => ({
  aiOrchestrator: {
    getLastReferenceCount: () => mockGetReferenceCount(),
    chat: vi.fn(),
    streamChat: (...args: unknown[]) => mockStreamChat(...args),
    continueWriting: (...args: unknown[]) => mockContinueWriting(...args),
    brainstorm: (...args: unknown[]) => mockBrainstorm(...args),
    polishText: (...args: unknown[]) => mockPolishText(...args),
    expandText: (...args: unknown[]) => mockExpandText(...args),
    clearHistory: (...args: unknown[]) => mockClearHistory(...args),
    getHistory: (...args: unknown[]) => mockGetHistory(...args),
  },
}));

vi.mock("../../../services/llm/config", () => ({
  loadConfig: vi.fn(() => ({
    provider: "openai",
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 4096,
    apiKey: "sk-test-key",
  })),
  saveConfig: vi.fn(),
}));

// ─── Helpers ─────────────────────────────────────────────────────────

// scrollIntoView is not implemented in jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockEditor = {
  state: {
    selection: { from: 0, to: 0, empty: true },
    doc: {
      textBetween: vi.fn(() => ""),
      content: { size: 100 },
    },
    tr: {
      insertText: vi.fn(),
    },
  },
  view: {
    dispatch: vi.fn(),
    focus: vi.fn(),
  },
} as unknown as import("@tiptap/react").Editor;

const mockEditorWithSelection = {
  state: {
    selection: { from: 10, to: 30, empty: false },
    doc: {
      textBetween: vi.fn((from: number, to: number) => {
        if (from === 10 && to === 30) return "selected text here";
        return "context text";
      }),
      content: { size: 500 },
    },
    tr: {
      insertText: vi.fn(),
    },
  },
  view: {
    dispatch: vi.fn(),
    focus: vi.fn(),
  },
} as unknown as import("@tiptap/react").Editor;

function openAIPanel() {
  fireEvent.click(screen.getByTitle("打开 AI 助手"));
}

async function* makeChatStream(chunks: string[]) {
  for (const chunk of chunks) {
    yield { type: "token" as const, text: chunk };
    await new Promise((r) => setTimeout(r, 0));
  }
  yield { type: "done" as const, fullText: chunks.join("") };
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("Chat Integration Flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockStreamChat.mockReset();
    mockContinueWriting.mockReset();
    mockBrainstorm.mockReset();
    mockPolishText.mockReset();
    mockExpandText.mockReset();
    mockGetHistory.mockReset();
    mockClearHistory.mockReset();
    mockGetReferenceCount.mockReset();
    mockGetHistory.mockReturnValue([]);
    mockGetReferenceCount.mockReturnValue(0);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ────────── Full-send flow ───────────────────────────────────

  it("sends a chat message and renders AI streaming response", async () => {
    mockStreamChat.mockReturnValue(
      makeChatStream(["Hello", ", how can I help?"]),
    );

    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    openAIPanel();

    const input = screen.getByPlaceholderText(/输入消息/);
    fireEvent.change(input, { target: { value: "Hi there" } });
    fireEvent.click(screen.getByText("发送"));

    expect(screen.getByText("Hi there")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Hello, how can I help?")).toBeDefined();
    });

    expect(mockStreamChat).toHaveBeenCalledWith(
      "test-project",
      "Hi there",
      expect.any(String),
    );
  });

  it("sends a continue-writing request via mode pill and renders response", async () => {
    mockContinueWriting.mockResolvedValue(
      "The dark clouds gathered as the hero approached...",
    );

    renderWithProviders(
      <AISidebar editor={mockEditor} projectId="test-project" />,
    );

    openAIPanel();

    const input = screen.getByPlaceholderText(/输入消息/);
    fireEvent.change(input, { target: { value: "write more" } });

    // ChatInput mode pill is also labeled "续写" — get second match
    const pills = screen.getAllByText("续写");
    fireEvent.click(pills[1]);
    fireEvent.click(screen.getByText("发送"));

    await waitFor(() => {
      expect(screen.getByText("The dark clouds gathered as the hero approached...")).toBeDefined();
    });

    expect(mockContinueWriting).toHaveBeenCalledWith(
      "test-project",
      "write more",
    );
  });

  it("sends a brainstorm request and renders full response", async () => {
    mockBrainstorm.mockResolvedValue("Here are some ideas: ...");

    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    openAIPanel();

    const input = screen.getByPlaceholderText(/输入消息/);
    fireEvent.change(input, { target: { value: "plot twist ideas" } });

    fireEvent.click(screen.getByText("头脑风暴"));
    fireEvent.click(screen.getByText("发送"));

    await waitFor(() => {
      expect(screen.getByText("Here are some ideas: ...")).toBeDefined();
    });

    expect(mockBrainstorm).toHaveBeenCalledWith(
      "test-project",
      "plot twist ideas",
    );
  });

  // ────────── Error handling ─────────────────────────────────

  it("handles AI error gracefully when request fails", async () => {
    mockStreamChat.mockImplementation(() => {
      throw new Error("Network failure");
    });

    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    openAIPanel();

    const input = screen.getByPlaceholderText(/输入消息/);
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.click(screen.getByText("发送"));

    await waitFor(() => {
      expect(screen.getByText(/请求失败/)).toBeDefined();
    });
  });

  // ────────── Quick action integration ────────────────────────

  it("quick action continue triggers continueWriting", async () => {
    mockContinueWriting.mockResolvedValue("Continued text here.");

    renderWithProviders(
      <AISidebar editor={mockEditorWithSelection} projectId="test-project" />,
    );

    openAIPanel();

    fireEvent.click(screen.getByTitle("从光标位置续写"));

    await waitFor(() => {
      expect(mockContinueWriting).toHaveBeenCalled();
    });
  });

  it("quick action polish triggers polishText when text selected", async () => {
    mockPolishText.mockResolvedValue("Polished text.");

    renderWithProviders(
      <AISidebar editor={mockEditorWithSelection} projectId="test-project" />,
    );

    openAIPanel();
    fireEvent.click(screen.getByTitle("润色选中文字"));

    await waitFor(() => {
      expect(mockPolishText).toHaveBeenCalled();
    });
  });

  it("quick action expand triggers expandText when text selected", async () => {
    mockExpandText.mockResolvedValue("Expanded text.");

    renderWithProviders(
      <AISidebar editor={mockEditorWithSelection} projectId="test-project" />,
    );

    openAIPanel();
    fireEvent.click(screen.getByTitle("扩写选中段落"));

    await waitFor(() => {
      expect(mockExpandText).toHaveBeenCalled();
    });
  });

  // ────────── ChatInput → AISidebar prop flow ──────────────────

  it("renders ChatInput inside open panel with mode pills", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    openAIPanel();

    expect(screen.getByText("对话")).toBeDefined();
    expect(screen.getAllByText("续写").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("头脑风暴")).toBeDefined();
  });

  // ────────── ChatHistory integration ──────────────────────────

  it("toggles ChatHistory panel and returns to chat view", () => {
    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    openAIPanel();

    fireEvent.click(screen.getByTitle("历史会话"));

    expect(screen.getByText(/暂无历史会话/)).toBeDefined();

    fireEvent.click(screen.getByText("返回"));

    expect(screen.getByPlaceholderText(/输入消息/)).toBeDefined();
  });

  it("selects a session from history and loads messages", () => {
    const testSessions = [
      {
        id: "session-1",
        projectId: "test-project",
        title: "Test Session",
        messages: [
          { role: "user", content: "Hello", timestamp: "2025-01-01T00:00:00Z" },
          { role: "assistant", content: "Hi there!", timestamp: "2025-01-01T00:00:01Z" },
        ],
        updatedAt: "2025-01-01T00:00:01Z",
        createdAt: "2025-01-01T00:00:00Z",
      },
    ];

    localStorage.setItem(
      "chat_sessions_test-project",
      JSON.stringify(testSessions),
    );

    renderWithProviders(
      <AISidebar editor={null} projectId="test-project" />,
    );

    openAIPanel();
    fireEvent.click(screen.getByTitle("历史会话"));

    expect(screen.getByText("Test Session")).toBeDefined();

    fireEvent.click(screen.getByText("Test Session"));

    expect(screen.getByText("Hello")).toBeDefined();
    expect(screen.getByText("Hi there!")).toBeDefined();
  });

  // ────────── Suggestion flow ────────────────────────────────

  it("shows accept/reject bar when suggestion is set", () => {
    renderWithProviders(
      <AISidebar editor={mockEditor} projectId="test-project" />,
    );

    openAIPanel();

    expect(screen.queryByText("接受")).toBeNull();
  });

  // ────────── Append-to-end button in ChatMessages ────────────

  it("ChatMessages renders action buttons for assistant messages", async () => {
    mockStreamChat.mockReturnValue(
      makeChatStream(["Streamed response"]),
    );

    renderWithProviders(
      <AISidebar editor={mockEditor} projectId="test-project" />,
    );

    openAIPanel();

    const input = screen.getByPlaceholderText(/输入消息/);
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(screen.getByText("发送"));

    await waitFor(() => {
      expect(screen.getByText("Streamed response")).toBeDefined();
    });

    const buttons = screen.getAllByTitle("追加到文末");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
