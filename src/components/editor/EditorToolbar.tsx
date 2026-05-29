import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
  onSearchClick?: () => void;
}

interface ToolDef {
  label: string;
  title: string;
  action: (e: Editor) => void;
  isActive: (e: Editor) => boolean;
}

const textGroup: ToolDef[] = [
  { label: "B", title: "加粗", action: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive("bold") },
  { label: "I", title: "斜体", action: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive("italic") },
];

const headingGroup: ToolDef[] = [
  { label: "H1", title: "一级标题", action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive("heading", { level: 1 }) },
  { label: "H2", title: "二级标题", action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive("heading", { level: 2 }) },
  { label: "H3", title: "三级标题", action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive("heading", { level: 3 }) },
];

const listGroup: ToolDef[] = [
  { label: "OL", title: "有序列表", action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive("orderedList") },
  { label: "UL", title: "无序列表", action: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive("bulletList") },
];

const blockGroup: ToolDef[] = [
  { label: `"`, title: "引用", action: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive("blockquote") },
  { label: "<>", title: "代码块", action: (e) => e.chain().focus().toggleCodeBlock().run(), isActive: (e) => e.isActive("codeBlock") },
];

const alignGroup: ToolDef = {
  label: "≡", title: "对齐方式", action: (e) => {
    const order: Array<"left" | "center" | "right"> = ["left", "center", "right"];
    const current = order.find((a) => e.isActive({ textAlign: a })) ?? "right";
    const next = order[(order.indexOf(current) + 1) % order.length];
    e.chain().focus().setTextAlign(next).run();
  }, isActive: (e) => e.isActive({ textAlign: "left" }) || e.isActive({ textAlign: "center" }) || e.isActive({ textAlign: "right" }),
};

const utilGroup: ToolDef[] = [
  { label: "—", title: "分割线", action: (e) => e.chain().focus().setHorizontalRule().run(), isActive: () => false },
  { label: "⌫", title: "清除格式", action: (e) => e.chain().focus().clearNodes().unsetAllMarks().run(), isActive: () => false },
  { label: "↩", title: "撤销", action: (e) => e.chain().focus().undo().run(), isActive: () => false },
  { label: "↪", title: "重做", action: (e) => e.chain().focus().redo().run(), isActive: () => false },
];

const groups = [textGroup, headingGroup, listGroup, blockGroup, utilGroup];

function ToolButton({ tool, editor }: { tool: ToolDef; editor: Editor }) {
  return (
    <button
      type="button"
      title={tool.title}
      onClick={() => tool.action(editor)}
      className={`px-2 py-1 text-xs rounded transition-ink font-(family-name:--font-ui) ${
        tool.isActive(editor)
          ? "bg-amber-subtle text-amber"
          : "text-ink-text-dim hover:bg-ink-surface-hover hover:text-ink-text"
      }`}
    >
      {tool.label}
    </button>
  );
}

export default function EditorToolbar({ editor, onSearchClick }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-ink-border bg-ink-surface shrink-0">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <div className="w-px h-4 mx-1 bg-ink-border" />}
          {group.map((tool) => (
            <ToolButton key={tool.title} tool={tool} editor={editor} />
          ))}
        </div>
      ))}

      {/* Alignment button (separate for visibility) */}
      <div className="w-px h-4 mx-1 bg-ink-border" />
      <ToolButton tool={alignGroup} editor={editor} />

      {/* Spacer + search */}
      <div className="flex-1" />
      {onSearchClick && (
        <button
          type="button"
          title="搜索"
          onClick={onSearchClick}
          className="px-2 py-1 text-xs rounded transition-ink text-ink-text-dim hover:bg-ink-surface-hover hover:text-ink-text"
        >
          🔍
        </button>
      )}
    </div>
  );
}