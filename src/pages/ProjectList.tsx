import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNovelContext } from "../contexts/NovelContext";
import { projectManager, chapterService } from "../services/project/manager";
import ProjectCard from "../components/project/ProjectCard";
import CreateProjectModal from "../components/project/CreateProjectModal";
import { useToast } from "../components/common/Toast";
import { setProjectSkill } from "../services/skill/loader";
import type { NovelProject } from "../types/novel";

export default function ProjectList() {
  const navigate = useNavigate();
  const { state, dispatch } = useNovelContext();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    dispatch({ type: "SET_LOADING", isLoading: true });
    loadProjects();
  }, [dispatch]);

  async function loadProjects() {
    try {
      const projects = await projectManager.getAllProjects();
      dispatch({ type: "SET_PROJECTS", projects });

      const counts: Record<string, number> = {};
      await Promise.all(
        projects.map(async (p: NovelProject) => {
          try {
            const chapters = await chapterService.getChapters(p.id);
            counts[p.id] = chapters.length;
          } catch {
            counts[p.id] = 0;
          }
        }),
      );
      setChapterCounts(counts);
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: String(err) });
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false });
    }
  }

  async function handleCreate(title: string, description: string, skillPath: string) {
    try {
      const project = await projectManager.createProject(title, description);
      dispatch({ type: "ADD_PROJECT", project });
      setChapterCounts((prev) => ({ ...prev, [project.id]: 0 }));
      if (skillPath) {
        setProjectSkill(project.id, skillPath);
      }
      toast.success(`项目 "${title}" 创建成功`);
    } catch (err) {
      toast.error("创建项目失败，请重试");
      console.error("Create project failed:", err);
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm("确定删除此项目？所有章节和关联数据将被永久删除。")) return;
    try {
      await projectManager.deleteProject(projectId);
      dispatch({ type: "DELETE_PROJECT", projectId });
      setChapterCounts((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      toast.success("项目已删除");
    } catch (err) {
      toast.error("删除失败，请重试");
      console.error("Delete project failed:", err);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink-text font-(family-name:--font-display)">我的项目</h1>
          <p className="text-sm text-ink-text-dim mt-1">管理你的小说创作项目</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-amber text-ink-bg text-sm font-medium rounded-lg hover:bg-amber-hover transition-ink"
        >
          + 新建项目
        </button>
      </div>

      {state.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          <p className="text-ink-text-dim">加载中...</p>
        </div>
      ) : state.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-6xl mb-4 opacity-20">✦</div>
          <p className="text-ink-text-dim mb-4">还没有任何项目</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-amber text-ink-bg text-sm font-medium rounded-lg hover:bg-amber-hover transition-ink"
          >
            创建你的第一个项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.projects.map((project: NovelProject) => (
            <ProjectCard
              key={project.id}
              project={project}
              chapterCount={chapterCounts[project.id] ?? 0}
              onSelect={(id) => navigate(`/project/${id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
