import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InlineCommand from "../InlineCommand";
import type { Editor } from "@tiptap/react";
import { slashCommandPluginKey, type SlashMenuState } from "../../editor/extensions/slashCommand";
import { aiService } from "../orchestrator/AIService";

vi.mock("../orchestrator/AIService", () => ({
  aiService: {
    execute: vi.fn(),
  },
}));

vi.mock("../../editor/extensions/ghostText", () => ({
  ghostTextPluginKey: {
    key: "ghostText$",
    getState: () => null,
  },
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function createMockEditor(overrides: Partial<Editor> = {}): Editor {
  const listeners: Record<string, Array<() => void>> = {};

  const editor = {
    isEditable: true,
    isEmpty: false,
    isFocused: true,
    getText: () => "test content",
    state: {
      selection: { from: 0, to: 0, empty: true },
      doc: { textBetween: () => "test" },
    },
    view: {
      coordsAtPos: () => ({ top: 200, left: 100, bottom: 220, right: 300 }),
      state: {
        selection: { from: 0, to: 0, empty: true },
        doc: { textBetween: () => "test" },
      },
    },
    commands: {
      setGhostText: vi.fn().mockReturnValue(true),
      closeSlashMenu: vi.fn().mockReturnValue(true),
      openSlashMenu: vi.fn().mockReturnValue(true),
    },
    chain: () => ({
      focus: () => ({ run: () => true }),
    }),
    on: (event: string, fn: () => void) => {
      (listeners[event] ??= []).push(fn);
      return { off: () => {} };
    },
    off: () => {},
    storage: { slashCommand: { open: false, query: "" } },
    extensionStorage: {},
    ...overrides,
  } as unknown as Editor;

  return editor;
}

function mockSlashState(_editor: Editor, state: SlashMenuState) {
  vi.spyOn(slashCommandPluginKey, "getState").mockReturnValue(state);
}

describe("InlineCommand", () => {
  it("renders nothing when menu is closed", () => {
    const editor = createMockEditor();
    mockSlashState(editor, { open: false, query: "" });

    const { container } = render(
      <MemoryRouter>
        <InlineCommand editor={editor} />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders 12 commands when menu is open with no query", () => {
    const editor = createMockEditor();
    mockSlashState(editor, { open: true, query: "" });

    render(
      <MemoryRouter>
        <InlineCommand editor={editor} />
      </MemoryRouter>,
    );

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(12);
  });

  it("filters commands by query", () => {
    const editor = createMockEditor();
    mockSlashState(editor, { open: true, query: "润" });

    render(
      <MemoryRouter>
        <InlineCommand editor={editor} />
      </MemoryRouter>,
    );

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    expect(options.length).toBeLessThan(12);
    // Query "润" matches category "润色" — all 3 commands in that category appear
    const labels = options.map((o) => o.textContent);
    expect(labels).toContain("润色");
    expect(labels).toContain("改写语气");
    expect(labels).toContain("检查错别字");
  });

  it("shows category headers", () => {
    const editor = createMockEditor();
    mockSlashState(editor, { open: true, query: "" });

    render(
      <MemoryRouter>
        <InlineCommand editor={editor} />
      </MemoryRouter>,
    );

    expect(screen.getByText("写作")).toBeDefined();
    expect(screen.getAllByText("润色").length).toBeGreaterThan(0);
    expect(screen.getByText("分析")).toBeDefined();
    expect(screen.getByText("创作")).toBeDefined();
  });

  it("calls closeSlashMenu on Escape", () => {
    const closeSlashMenu = vi.fn().mockReturnValue(true);
    const editor = createMockEditor({ commands: { closeSlashMenu } as unknown as Editor["commands"] });
    mockSlashState(editor, { open: true, query: "" });

    render(
      <MemoryRouter>
        <InlineCommand editor={editor} />
      </MemoryRouter>,
    );

    const menu = screen.getByRole("listbox");
    const inner = menu.querySelector(".py-1")!;
    fireEvent.keyDown(inner, { key: "Escape" });
    expect(closeSlashMenu).toHaveBeenCalled();
  });

  it("calls AIService on Enter with selected command", async () => {
    vi.mocked(aiService.execute).mockResolvedValue({
      result: "AI response",
      citations: [],
      metadata: { command: "polish", durationMs: 100 },
    });

    const setGhostText = vi.fn().mockReturnValue(true);
    const closeSlashMenu = vi.fn().mockReturnValue(true);

    const editor = createMockEditor({
      commands: { setGhostText, closeSlashMenu } as unknown as Editor["commands"],
    });
    mockSlashState(editor, { open: true, query: "" });

    render(
      <MemoryRouter>
        <InlineCommand editor={editor} />
      </MemoryRouter>,
    );

    const menu = screen.getByRole("listbox");
    const inner = menu.querySelector(".py-1")!;
    fireEvent.keyDown(inner, { key: "Enter" });

    await vi.waitFor(() => {
      expect(aiService.execute).toHaveBeenCalled();
    });
  });

  it("click triggers execute", async () => {
    vi.mocked(aiService.execute).mockResolvedValue({
      result: "clicked",
      citations: [],
      metadata: { command: "continue", durationMs: 100 },
    });

    const setGhostText = vi.fn().mockReturnValue(true);
    const closeSlashMenu = vi.fn().mockReturnValue(true);

    const editor = createMockEditor({
      commands: { setGhostText, closeSlashMenu } as unknown as Editor["commands"],
    });
    mockSlashState(editor, { open: true, query: "" });

    render(
      <MemoryRouter>
        <InlineCommand editor={editor} />
      </MemoryRouter>,
    );

    const options = screen.getAllByRole("option");
    fireEvent.click(options[0]);

    await vi.waitFor(() => {
      expect(aiService.execute).toHaveBeenCalled();
    });
  });
});
