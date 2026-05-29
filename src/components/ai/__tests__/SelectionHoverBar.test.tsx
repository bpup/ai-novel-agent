import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SelectionHoverBar from "../SelectionHoverBar";
import type { Editor } from "@tiptap/react";
import { aiService } from "../orchestrator/AIService";

vi.mock("../orchestrator/AIService", () => ({
  aiService: {
    execute: vi.fn(),
  },
}));

vi.mock("../../editor/extensions/ghostText", () => ({
  ghostTextPluginKey: { key: "ghostText$", getState: () => null },
}));

function createMockEditor(overrides: Partial<Editor> = {}): Editor {
  const listeners: Record<string, Array<() => void>> = {};

  return {
    isEditable: true,
    isEmpty: false,
    isFocused: true,
    getText: () => "Hello world content",
    state: {
      selection: { from: 0, to: 10, empty: false },
      doc: {
        textBetween: () => "Hello worl",
      },
    },
    view: {
      coordsAtPos: () => ({ top: 200, left: 100, bottom: 220, right: 300 }),
      state: {
        selection: { from: 0, to: 10, empty: false },
        doc: { textBetween: () => "Hello worl" },
      },
    },
    commands: {
      setGhostText: vi.fn().mockReturnValue(true),
      insertContent: vi.fn().mockReturnValue(true),
    },
    chain: () => ({
      focus: () => ({ run: () => true }),
    }),
    on: (event: string, fn: () => void) => {
      (listeners[event] ??= []).push(fn);
      return { off: () => {} };
    },
    off: () => {},
    storage: {},
    extensionStorage: {},
    ...overrides,
  } as unknown as Editor;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("SelectionHoverBar", () => {
  it("does not render when editor is null", () => {
    const { container } = render(
      <MemoryRouter>
        <SelectionHoverBar editor={null} />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("does not render immediately (500ms delay)", () => {
    const editor = createMockEditor();
    const { container } = render(
      <MemoryRouter>
        <SelectionHoverBar editor={editor} />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders after 500ms when selection is long enough", () => {
    const editor = createMockEditor({
      state: {
        selection: { from: 0, to: 10, empty: false },
        doc: { textBetween: () => "Hello worl" },
      } as never,
      view: {
        coordsAtPos: () => ({ top: 200, left: 100, bottom: 220, right: 300 }),
        state: {
          selection: { from: 0, to: 10, empty: false },
          doc: { textBetween: () => "Hello worl" },
        },
      } as never,
    });

    render(
      <MemoryRouter>
        <SelectionHoverBar editor={editor} />
      </MemoryRouter>,
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByRole("toolbar")).toBeDefined();
  });

  it("does not render when selection is too short (<5 chars)", () => {
    const editor = createMockEditor({
      state: {
        selection: { from: 0, to: 3, empty: false },
        doc: { textBetween: () => "Hi" },
      } as never,
      view: {
        coordsAtPos: () => ({ top: 200, left: 100, bottom: 220, right: 300 }),
        state: {
          selection: { from: 0, to: 3, empty: false },
          doc: { textBetween: () => "Hi" },
        },
      } as never,
    });

    const { container } = render(
      <MemoryRouter>
        <SelectionHoverBar editor={editor} />
      </MemoryRouter>,
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(container.querySelector('[role="toolbar"]')).toBeNull();
  });

  it("shows 5 action buttons", () => {
    const editor = createMockEditor();

    render(
      <MemoryRouter>
        <SelectionHoverBar editor={editor} />
      </MemoryRouter>,
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
    expect(buttons[0].textContent).toContain("润色");
    expect(buttons[1].textContent).toContain("扩写");
    expect(buttons[2].textContent).toContain("缩写");
    expect(buttons[3].textContent).toContain("翻译");
    expect(buttons[4].textContent).toContain("续写");
  });

  it("calls AIService on button click", async () => {
    vi.mocked(aiService.execute).mockResolvedValue({
      result: "polished text",
      citations: [],
      metadata: { command: "polish", durationMs: 100 },
    });

    const setGhostText = vi.fn().mockReturnValue(true);
    const editor = createMockEditor({
      commands: { setGhostText } as unknown as Editor["commands"],
    });

    render(
      <MemoryRouter>
        <SelectionHoverBar editor={editor} />
      </MemoryRouter>,
    );

    act(() => {
      vi.advanceTimersByTime(600);
    });

    const firstButton = screen.getAllByRole("button")[0];
    fireEvent.click(firstButton);

    await vi.waitFor(() => {
      expect(aiService.execute).toHaveBeenCalledWith("polish", "Hello worl");
    });
  });
});
