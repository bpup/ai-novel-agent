import { useState, useMemo } from "react";

interface HeadingItem {
  level: number;
  text: string;
}

interface OutlineViewProps {
  html: string;
  onJump: (headingText: string) => void;
  onReorder?: (headings: HeadingItem[]) => void;
}

export default function OutlineView({ html, onJump, onReorder }: OutlineViewProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const headings = useMemo(() => {
    const items: HeadingItem[] = [];
    const regex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (text) {
        items.push({
          level: parseInt(match[1]),
          text,
        });
      }
    }
    return items;
  }, [html]);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(fromIndex) && fromIndex !== toIndex && onReorder) {
      const updated = [...headings];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onReorder(updated);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  if (headings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-ink-text-subtle">使用标题即可自动生成大纲</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-ink-border">
        <h3 className="text-xs font-semibold text-ink-text-dim uppercase tracking-wider font-(family-name:--font-ui)">
          大纲
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        <ul className="space-y-0.5">
          {headings.map((heading, i) => (
            <li
              key={`${i}-${heading.level}-${heading.text.slice(0, 10)}`}
              draggable
              role="listitem"
              onDragStart={handleDragStart(i)}
              onDragOver={handleDragOver(i)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(i)}
              onDragEnd={handleDragEnd}
              onClick={() => onJump(heading.text)}
              className={`px-3 py-1.5 cursor-pointer transition-ink text-sm border-l-2 ${
                dropIndex === i
                  ? "border-blue-500 bg-blue-50"
                  : dragIndex === i
                    ? "border-amber bg-amber-subtle opacity-60"
                    : "border-transparent hover:bg-ink-surface-hover"
              }`}
              style={{
                paddingLeft: `${12 + (heading.level - 1) * 20}px`,
              }}
            >
              <span className="block truncate text-ink-text-dim hover:text-amber transition-ink">
                {heading.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
