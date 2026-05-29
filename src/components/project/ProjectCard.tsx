import type { NovelProject } from "../../types/novel";

interface ProjectCardProps {
  project: NovelProject;
  chapterCount: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ProjectCard({
  project,
  chapterCount,
  onSelect,
  onDelete,
}: ProjectCardProps) {
  return (
    <div
      onClick={() => onSelect(project.id)}
      className="group bg-ink-surface border border-ink-border rounded-xl p-5 cursor-pointer hover:bg-ink-surface-raised hover:shadow-ink-md hover:border-ink-border-focus transition-ink"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-ink-text text-lg truncate pr-2">
          {project.title || "未命名项目"}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id);
          }}
          className="shrink-0 px-2 py-0.5 text-xs text-ink-text-subtle hover:text-error opacity-0 group-hover:opacity-100 transition-ink"
        >
          删除
        </button>
      </div>
      {project.description && (
        <p className="text-sm text-ink-text-dim line-clamp-2 mb-3">
          {project.description}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-ink-text-subtle">
        <span>{chapterCount} 章</span>
        <span>
          {new Date(project.updatedAt).toLocaleDateString("zh-CN")}
        </span>
      </div>
    </div>
  );
}
