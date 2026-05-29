import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const ghostTextPluginKey = new PluginKey<string | null>("ghostText");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ghostText: {
      setGhostText: (text: string) => ReturnType;
      clearGhostText: () => ReturnType;
    };
  }
}

export function ghostTextPlugin() {
  return Extension.create({
    name: "ghostText",

    addCommands() {
      return {
        setGhostText:
          (text: string) =>
          ({ state, dispatch }) => {
            if (dispatch) {
              dispatch(state.tr.setMeta(ghostTextPluginKey, text));
            }
            return true;
          },
        clearGhostText:
          () =>
          ({ state, dispatch }) => {
            if (dispatch) {
              dispatch(state.tr.setMeta(ghostTextPluginKey, null));
            }
            return true;
          },
      };
    },

    addProseMirrorPlugins() {
      return [
        new Plugin<string | null>({
          key: ghostTextPluginKey,

          state: {
            init(): string | null {
              return null;
            },
            apply(tr, value): string | null {
              const meta = tr.getMeta(ghostTextPluginKey);
              if (meta !== undefined) return meta;

              if (tr.selectionSet && value !== null) {
                return null;
              }

              return value;
            },
          },

          props: {
            handleKeyDown(view, event) {
              const ghostText = ghostTextPluginKey.getState(view.state);
              if (!ghostText) return false;

              if (event.key === "Tab") {
                event.preventDefault();

                const { from } = view.state.selection;
                const tr = view.state.tr.insertText(ghostText, from);
                tr.setMeta(ghostTextPluginKey, null);
                view.dispatch(tr);
                return true;
              }

              if (event.key === "Escape") {
                event.preventDefault();

                view.dispatch(
                  view.state.tr.setMeta(ghostTextPluginKey, null),
                );
                return true;
              }

              return false;
            },

            decorations(state) {
              const ghostText = ghostTextPluginKey.getState(state);
              if (!ghostText) return DecorationSet.empty;

              const { from } = state.selection;
              const decoration = Decoration.widget(
                from,
                () => {
                  const span = document.createElement("span");
                  span.className = "ghost-text-widget";
                  span.textContent = ghostText;
                  span.setAttribute("data-ghost-text", "true");
                  return span;
                },
                { side: 1 },
              );

              return DecorationSet.create(state.doc, [decoration]);
            },
          },
        }),
      ];
    },
  });
}

export { ghostTextPlugin as default };
