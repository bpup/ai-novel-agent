import type { Editor, JSONContent } from "@tiptap/react";

export function createMockEditor(overrides: Partial<Editor> = {}): Editor {
  const defaultContent: JSONContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Hello world" }],
      },
    ],
  };

  return {
    isEditable: true,
    isEmpty: false,
    isFocused: false,

    getText: () => "Hello world",
    getHTML: () => "<p>Hello world</p>",
    getJSON: () => defaultContent,

    state: {
      selection: {
        from: 0,
        to: 5,
        empty: false,
      },
      doc: {
        textBetween: () => "Hello",
        nodeSize: 10,
      },
    },
    view: {
      posAtCoords: () => null,
      coordsAtPos: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
      state: {
        selection: {
          from: 0,
          to: 5,
          empty: false,
        },
        doc: {
          textBetween: () => "Hello",
          nodeSize: 10,
        },
      },
    } as unknown as Editor["view"],

    commands: {
      insertContent: () => true,
      setContent: () => true,
      setTextSelection: () => true,
      focus: () => true,
      blur: () => true,
    } as unknown as Editor["commands"],

    chain: () => ({
      focus: () => ({ insertContent: () => ({ run: () => true }) }),
      setTextSelection: () => ({ run: () => true }),
      insertContent: () => ({ run: () => true }),
      command: () => ({ run: () => true }),
    }),
    can: () => ({
      chain: () => ({
        focus: () => ({ run: () => true }),
      }),
    }),

    on: () => ({ off: () => {} }),
    off: () => {},

    storage: {},
    extensionStorage: {},

    ...overrides,
  } as unknown as Editor;
}
