import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

export interface SlashMenuState {
  open: boolean;
  query: string;
}

export interface SlashCommandItem {
  label: string;
  command: string;
  category: string;
}

export const slashCommandPluginKey = new PluginKey<SlashMenuState>("slashCommand");

export const SLASH_COMMANDS: SlashCommandItem[] = [
  { label: "续写", command: "continue", category: "写作" },
  { label: "扩写", command: "expand", category: "写作" },
  { label: "缩写", command: "summarize", category: "写作" },
  { label: "润色", command: "polish", category: "润色" },
  { label: "改写语气", command: "rewrite_tone", category: "润色" },
  { label: "检查错别字", command: "fix_grammar", category: "润色" },
  { label: "提取关键词", command: "extract_keywords", category: "分析" },
  { label: "自动分段", command: "auto_paragraph", category: "分析" },
  { label: "头脑风暴", command: "brainstorm", category: "分析" },
  { label: "生成标题", command: "generate_title", category: "创作" },
  { label: "添加描写", command: "add_description", category: "创作" },
  { label: "翻译", command: "translate", category: "创作" },
];

function isAtParagraphStart(state: { selection: { $from: { parentOffset: number } } }): boolean {
  const { $from } = state.selection as { $from: { parentOffset: number } };
  return $from.parentOffset === 0;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    slashCommand: {
      openSlashMenu: () => ReturnType;
      closeSlashMenu: () => ReturnType;
      updateSlashQuery: (query: string) => ReturnType;
    };
  }
}

export const slashCommandPmPlugin = new Plugin<SlashMenuState>({
  key: slashCommandPluginKey,

  state: {
    init(): SlashMenuState {
      return { open: false, query: "" };
    },
    apply(tr, value): SlashMenuState {
      const meta = tr.getMeta(slashCommandPluginKey);
      if (meta !== undefined) return meta as SlashMenuState;

      if (tr.selectionSet && value.open) {
        return { open: false, query: "" };
      }

      return value;
    },
  },

  props: {
            handleTextInput(_view: EditorView, _from: number, _to: number, text: string) {
      const state = _view.state;

      if (text === "/" && isAtParagraphStart(state)) {
        _view.dispatch(
          state.tr.setMeta(slashCommandPluginKey, {
            open: true,
            query: "",
          }),
        );
        return true;
      }

      return false;
    },

    handleKeyDown(view: EditorView, event: KeyboardEvent) {
      const state = slashCommandPluginKey.getState(view.state);
      if (!state || !state.open) return false;

      if (event.key === "Escape") {
        event.preventDefault();
        view.dispatch(
          view.state.tr.setMeta(slashCommandPluginKey, {
            open: false,
            query: "",
          }),
        );
        return true;
      }

      if (event.key === "Backspace") {
        if (state.query.length > 0) {
          const newQuery = state.query.slice(0, -1);
          view.dispatch(
            view.state.tr.setMeta(slashCommandPluginKey, {
              open: true,
              query: newQuery,
            }),
          );
        } else {
          view.dispatch(
            view.state.tr.setMeta(slashCommandPluginKey, {
              open: false,
              query: "",
            }),
          );
        }
        event.preventDefault();
        return true;
      }

      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
        const newQuery = state.query + event.key;
        view.dispatch(
          view.state.tr.setMeta(slashCommandPluginKey, {
            open: true,
            query: newQuery,
          }),
        );
        event.preventDefault();
        return true;
      }

      return false;
    },
  },
});

export function slashCommandPlugin() {
  return Extension.create({
    name: "slashCommand",

    addCommands() {
      return {
        openSlashMenu:
          () =>
          ({ state, dispatch }) => {
            if (dispatch) {
              dispatch(
                state.tr.setMeta(slashCommandPluginKey, {
                  open: true,
                  query: "",
                }),
              );
            }
            return true;
          },
        closeSlashMenu:
          () =>
          ({ state, dispatch }) => {
            if (dispatch) {
              dispatch(
                state.tr.setMeta(slashCommandPluginKey, {
                  open: false,
                  query: "",
                }),
              );
            }
            return true;
          },
        updateSlashQuery:
          (query: string) =>
          ({ state, dispatch }) => {
            const current = slashCommandPluginKey.getState(state);
            if (current?.open && dispatch) {
              dispatch(
                state.tr.setMeta(slashCommandPluginKey, {
                  open: true,
                  query,
                }),
              );
            }
            return true;
          },
      };
    },

    addProseMirrorPlugins() {
      return [slashCommandPmPlugin];
    },
  });
}

export { slashCommandPlugin as default };
