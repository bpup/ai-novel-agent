import { useState, useEffect, useRef } from "react";
import { searchChapters, type SearchResult } from "../../services/search";

interface SearchDialogProps {
  projectId: string;
  onJumpToChapter: (chapterId: string, highlightText: string) => void;
  onClose: () => void;
}

export default function SearchDialog({
  projectId,
  onJumpToChapter,
  onClose,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchChapters(projectId, trimmed);
        setResults(res);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, projectId]);

  function highlightMatch(text: string, q: string) {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-amber/20 text-amber rounded-sm px-0.5">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-ink-bg/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-ink-surface border border-ink-border rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 p-3 border-b border-ink-border">
          <span className="text-ink-text-dim text-sm shrink-0">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索章节内容..."
            className="flex-1 bg-transparent text-ink-text text-sm placeholder:text-ink-text-subtle focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          />
          <span className="text-xs text-ink-text-subtle shrink-0">Esc</span>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {isSearching && (
            <p className="p-4 text-xs text-ink-text-dim text-center">
              搜索中...
            </p>
          )}
          {!isSearching && query.trim() && results.length === 0 && (
            <p className="p-4 text-xs text-ink-text-dim text-center">
              未找到匹配结果
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.chapterId}-${r.position}-${i}`}
              onClick={() => {
                onJumpToChapter(r.chapterId, query);
                onClose();
              }}
              className="w-full text-left px-4 py-3 hover:bg-ink-surface-hover border-b border-ink-border last:border-b-0 transition-ink"
            >
              <p className="text-xs text-amber mb-1 font-medium">
                {r.chapterTitle}
              </p>
              <p className="text-xs text-ink-text-dim leading-relaxed line-clamp-2">
                {highlightMatch(r.excerpt, query)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
