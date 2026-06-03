import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNovelContext } from "../contexts/NovelContext";
import { chapterService, projectManager } from "../services/project/manager";
import { useToast } from "../components/common/Toast";
import NovelEditor from "../components/editor/NovelEditor";
import EditorToolbar from "../components/editor/EditorToolbar";
import ChapterTree from "../components/editor/ChapterTree";
import OutlineView from "../components/editor/OutlineView";
import ChapterNotes from "../components/editor/ChapterNotes";
import ProjectOutline from "../components/editor/ProjectOutline";
import SearchDialog from "../components/editor/SearchDialog";
import ExportDialog from "../components/editor/ExportDialog";
import ShortcutHelpDialog from "../components/editor/ShortcutHelpDialog";
import AISidebar from "../components/ai/AISidebar";
import AIErrorBoundary from "../components/ai/AIErrorBoundary";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { contextBus } from "../components/ai/orchestrator/ContextBus";
import CharacterModal from "../components/character/CharacterModal";
import WorldSettingModal from "../components/world/WorldSettingModal";
import { characterService } from "../services/character/service";
import { worldSettingService } from "../services/world/service";
import { ragEngine } from "../services/rag/engine";
import { chapterVersionService } from "../services/version/service";
import VersionHistoryDialog from "../components/editor/VersionHistoryDialog";
import type { Character, WorldSetting, Chapter } from "../types/novel";
import type { ChapterStatus } from "../types/chat";
import type { Editor } from "@tiptap/react";

type ProjectState = {
  chapters: Chapter[];
  selectedChapterId: string | null;
  isLoading: boolean;
};

type ProjectAction =
  | { type: "LOAD_CHAPTERS"; chapters: Chapter[] }
  | { type: "ADD_CHAPTER"; chapter: Chapter }
  | { type: "DELETE_CHAPTER"; chapterId: string }
  | { type: "UPDATE_CHAPTER"; chapterId: string; updates: Partial<Chapter> }
  | { type: "REORDER_CHAPTERS"; chapters: Chapter[] }
  | { type: "SET_SELECTED"; chapterId: string | null }
  | { type: "SET_LOADING"; isLoading: boolean };

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case "LOAD_CHAPTERS":
      return {
        ...state,
        chapters: action.chapters,
        selectedChapterId:
          state.selectedChapterId ??
          (action.chapters.length > 0 ? action.chapters[0].id : null),
        isLoading: false,
      };
    case "ADD_CHAPTER":
      return { ...state, chapters: [...state.chapters, action.chapter] };
    case "DELETE_CHAPTER":
      return { ...state, chapters: state.chapters.filter((c) => c.id !== action.chapterId) };
    case "UPDATE_CHAPTER":
      return {
        ...state,
        chapters: state.chapters.map((c) =>
          c.id === action.chapterId ? { ...c, ...action.updates } : c,
        ),
      };
    case "REORDER_CHAPTERS":
      return { ...state, chapters: action.chapters };
    case "SET_SELECTED":
      return { ...state, selectedChapterId: action.chapterId };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    default:
      return state;
  }
}

type SidebarTab = "chapters" | "outline" | "notes" | "project-outline" | "characters" | "world";

export default function Project() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useNovelContext();
  const toast = useToast();
  const [projectState, projectDispatch] = useReducer(projectReducer, {
    chapters: [],
    selectedChapterId: null,
    isLoading: true,
  });
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("chapters");
  const [showSearch, setShowSearch] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldSettings, setWorldSettings] = useState<WorldSetting[]>([]);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [editingWorldSetting, setEditingWorldSetting] = useState<WorldSetting | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [aiSidebarKey, setAiSidebarKey] = useState(0);
  const newChapterTitleRef = useRef<HTMLInputElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const lastVersionSaveRef = useRef<number>(0);

  const project = state.projects.find((p) => p.id === projectId);

  const selectedChapter = projectState.chapters.find(
    (c) => c.id === projectState.selectedChapterId,
  );

  useEffect(() => {
    if (projectId) {
      dispatch({ type: "SET_CURRENT_PROJECT", projectId });
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    if (!projectId) return;
    loadChapters();
  }, [projectId]);

  useEffect(() => {
    if (!projectState.isLoading && projectId && state.projects.length > 0 && !project) {
      toast.error("项目不存在或已被删除");
      navigate("/", { replace: true });
    }
  }, [projectState.isLoading, projectId, project, state.projects.length, navigate, toast]);

  useEffect(() => {
    if (projectId) {
      contextBus.setProjectContext({
        id: projectId,
        title: project?.title ?? "",
        description: project?.description ?? "",
      });
    }
  }, [projectId, project?.title, project?.description]);

  useEffect(() => {
    if (selectedChapter) {
      contextBus.setCurrentChapter(selectedChapter);
    }
  }, [selectedChapter]);

  useEffect(() => {
    if (!projectId) return;
    characterService.getCharacters(projectId).then(setCharacters).catch(() => {});
    worldSettingService.getWorldSettings(projectId).then(setWorldSettings).catch(() => {});
  }, [projectId, projectState.chapters]);

  async function loadChapters() {
    if (!projectId) return;
    try {
      const list = await chapterService.getChapters(projectId);
      projectDispatch({ type: "LOAD_CHAPTERS", chapters: list });
    } catch (err) {
      console.error("Failed to load chapters:", err);
      toast.error("加载章节失败，请刷新重试");
    }
  }

  async function handleAddChapter() {
    if (!projectId) return;
    const title = newChapterTitleRef.current?.value?.trim() || "新章节";
    try {
      const chapter = await chapterService.addChapter(projectId, title);
      projectDispatch({ type: "ADD_CHAPTER", chapter });
      projectDispatch({ type: "SET_SELECTED", chapterId: chapter.id });
      if (newChapterTitleRef.current) {
        newChapterTitleRef.current.value = "";
      }
    } catch (err) {
      console.error("Failed to add chapter:", err);
      toast.error("创建章节失败，请重试");
    }
  }

  async function handleDeleteChapter(chapterId: string) {
    try {
      await chapterService.deleteChapter(chapterId);
      projectDispatch({ type: "DELETE_CHAPTER", chapterId });
      if (projectState.selectedChapterId === chapterId) {
        const remaining = projectState.chapters.filter((c) => c.id !== chapterId);
        projectDispatch({
          type: "SET_SELECTED",
          chapterId: remaining.length > 0 ? remaining[0].id : null,
        });
      }
    } catch (err) {
      console.error("Failed to delete chapter:", err);
      toast.error("删除章节失败，请重试");
    }
  }

  async function handleReorderChapters(reordered: Chapter[]) {
    if (!projectId) return;
    projectDispatch({ type: "REORDER_CHAPTERS", chapters: reordered });
    try {
      await chapterService.reorderChapters(
        projectId,
        reordered.map((c) => c.id),
      );
    } catch (err) {
      console.error("Failed to reorder chapters:", err);
      toast.error("排序保存失败");
      loadChapters();
    }
  }

  async function handleStatusChange(chapterId: string, status: ChapterStatus) {
    try {
      await chapterService.updateChapter(chapterId, { status });
      projectDispatch({ type: "UPDATE_CHAPTER", chapterId, updates: { status } });
    } catch (err) {
      console.error("Failed to update chapter status:", err);
      toast.error("状态更新失败");
    }
  }

  async function handleSummaryChange(chapterId: string, summary: string) {
    try {
      await chapterService.updateChapter(chapterId, { summary });
      projectDispatch({ type: "UPDATE_CHAPTER", chapterId, updates: { summary } });
    } catch (err) {
      console.error("Failed to update summary:", err);
      toast.error("摘要更新失败");
    }
  }

  async function handleNotesChange(notes: string) {
    if (!projectState.selectedChapterId) return;
    try {
      await chapterService.updateChapter(projectState.selectedChapterId, { notes });
      projectDispatch({
        type: "UPDATE_CHAPTER",
        chapterId: projectState.selectedChapterId,
        updates: { notes },
      });
    } catch (err) {
      console.error("Failed to update notes:", err);
      toast.error("笔记保存失败");
    }
  }

  async function handleSaveCharacter(data: { name: string; description: string; traits: string[] }) {
    if (!projectId) return;
    try {
      if (editingCharacter) {
        await characterService.updateCharacter(editingCharacter.id, data);
        ragEngine.indexCharacter(projectId, data.name, data.description, editingCharacter.id).catch(() => {});
      } else {
        const created = await characterService.createCharacter(projectId, data);
        ragEngine.indexCharacter(projectId, created.name, created.description, created.id).catch(() => {});
      }
      setEditingCharacter(null);
      const updated = await characterService.getCharacters(projectId);
      setCharacters(updated);
      toast.success(editingCharacter ? "角色已更新" : "角色已创建");
    } catch {
      toast.error("保存失败");
    }
  }

  async function handleDeleteCharacter(charId: string) {
    try {
      await characterService.deleteCharacter(charId);
      ragEngine.removeCharacter(charId).catch(() => {});
      setCharacters((prev) => prev.filter((c) => c.id !== charId));
      toast.success("角色已删除");
    } catch {
      toast.error("删除失败");
    }
  }

  async function handleSaveWorldSetting(data: { name: string; description: string; category: string }) {
    if (!projectId) return;
    try {
      if (editingWorldSetting) {
        await worldSettingService.updateWorldSetting(editingWorldSetting.id, data);
        ragEngine.indexWorldSetting(projectId, data.name, data.description, data.category, editingWorldSetting.id).catch(() => {});
      } else {
        const created = await worldSettingService.createWorldSetting(projectId, data);
        ragEngine.indexWorldSetting(projectId, created.name, created.description, created.category, created.id).catch(() => {});
      }
      setEditingWorldSetting(null);
      const updated = await worldSettingService.getWorldSettings(projectId);
      setWorldSettings(updated);
      toast.success(editingWorldSetting ? "设定已更新" : "设定已创建");
    } catch {
      toast.error("保存失败");
    }
  }

  async function handleDeleteWorldSetting(wsId: string) {
    try {
      await worldSettingService.deleteWorldSetting(wsId);
      ragEngine.removeWorldSetting(wsId).catch(() => {});
      setWorldSettings((prev) => prev.filter((w) => w.id !== wsId));
      toast.success("设定已删除");
    } catch {
      toast.error("删除失败");
    }
  }

  function handleContentChange(content: string) {
    if (!projectState.selectedChapterId) return;
    projectDispatch({
      type: "UPDATE_CHAPTER",
      chapterId: projectState.selectedChapterId,
      updates: { content },
    });
  }

  function handleAutoSave(content: string) {
    if (!projectState.selectedChapterId) return;
    const chapter = projectState.chapters.find(
      (c) => c.id === projectState.selectedChapterId,
    );
    if (!chapter) return;
    chapterService.updateChapter(projectState.selectedChapterId, { content }).then(() => {
      const now = Date.now();
      if (now - lastVersionSaveRef.current > 300000) {
        lastVersionSaveRef.current = now;
        chapterVersionService.saveVersion(chapter.id, chapter.title, content).catch(() => {});
      }
    }).catch((err) => {
      console.error("Auto-save failed:", err);
    });
  }

  function handleEditorReady(editor: import("@tiptap/react").Editor | null) {
    editorInstanceRef.current = editor;
    if (editor) {
      contextBus.setEditor(editor);
    }
  }

  function handleOutlineJump(headingText: string) {
    const editor = editorInstanceRef.current;
    if (!editor || !headingText) return;

    const doc = editor.state.doc;
    let found = false;
    doc.descendants((node, pos) => {
      if (found) return false;
      if (node.type.name === "heading" && node.textContent.trim() === headingText.trim()) {
        editor.commands.setTextSelection(pos);
        editor.commands.scrollIntoView();
        found = true;
        return false;
      }
      return true;
    });
    if (!found) return;
  }

  function handleSearchJumpToChapter(chapterId: string) {
    projectDispatch({ type: "SET_SELECTED", chapterId });
    const editor = editorInstanceRef.current;
    if (editor) {
      setTimeout(() => editor.commands.scrollIntoView(), 100);
    }
  }

  function handleSaveTitle() {
    if (!projectId || !project || !titleDraft.trim()) return;
    projectManager.updateProject(projectId, { title: titleDraft.trim() }).then(() => {
      dispatch({
        type: "UPDATE_PROJECT",
        project: { ...project, title: titleDraft.trim() },
      });
    }).catch(() => {});
    setEditingTitle(false);
  }

  function handleSaveDescription() {
    if (!projectId || !project) return;
    projectManager.updateProject(projectId, { description: descDraft.trim() }).then(() => {
      dispatch({
        type: "UPDATE_PROJECT",
        project: { ...project, description: descDraft.trim() },
      });
    }).catch(() => {});
    setEditingDescription(false);
  }

  async function handleVersionRestore(_title: string, content: string) {
    if (!projectState.selectedChapterId) return;
    // Only restore content, keep current title
    try {
      await chapterService.updateChapter(projectState.selectedChapterId, { content });
      projectDispatch({
        type: "UPDATE_CHAPTER",
        chapterId: projectState.selectedChapterId,
        updates: { content },
      });
      toast.success("版本已恢复");
    } catch (err) {
      console.error("Failed to restore version:", err);
      toast.error("版本恢复失败");
    }
  }

  const handleOutlineReorder = useCallback(
    (_headings: Array<{ level: number; text: string }>) => {},
    [],
  );

  if (projectState.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-ink-text-dim">加载中...</p>
      </div>
    );
  }

  const tabs: { key: SidebarTab; label: string }[] = [
    { key: "chapters", label: "章节" },
    { key: "outline", label: "大纲" },
    { key: "notes", label: "笔记" },
    { key: "project-outline", label: "全局大纲" },
    { key: "characters", label: "角色" },
    { key: "world", label: "世界观" },
  ];

  return (
    <div className="flex h-full">
      <div className="w-52 border-r border-ink-border bg-ink-surface flex flex-col shrink-0">
        <div className="p-2 border-b border-ink-border space-y-1">
          {editingTitle ? (
            <input
              ref={(el) => el?.focus()}
              defaultValue={project?.title ?? ""}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
              className="w-full px-1.5 py-0.5 text-xs bg-ink-surface-raised border border-amber/40 rounded text-ink-text font-(family-name:--font-ui) focus:outline-none"
            />
          ) : (
            <button type="button"
              onClick={() => { setTitleDraft(project?.title ?? ""); setEditingTitle(true); }}
              className="w-full text-left text-xs font-semibold text-ink-text-dim truncate font-(family-name:--font-ui) cursor-pointer hover:text-ink-text transition-ink"
              title="点击编辑项目标题"
            >
              {project?.title ?? "未命名项目"}
            </button>
          )}
          {editingDescription ? (
            <input
              ref={(el) => el?.focus()}
              defaultValue={project?.description ?? ""}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={handleSaveDescription}
              onKeyDown={(e) => e.key === "Enter" && handleSaveDescription()}
              className="w-full px-1.5 py-0.5 text-[10px] bg-ink-surface-raised border border-amber/40 rounded text-ink-text-dim font-(family-name:--font-ui) focus:outline-none"
            />
          ) : project?.description ? (
            <button type="button"
              onClick={() => { setDescDraft(project.description ?? ""); setEditingDescription(true); }}
              className="w-full text-left text-[10px] text-ink-text-subtle truncate cursor-pointer hover:text-ink-text-dim transition-ink"
              title="点击编辑项目描述"
            >
              {project.description}
            </button>
          ) : null}
          <div className="flex gap-1">
            <input
              ref={newChapterTitleRef}
              type="text"
              placeholder="章节标题"
              className="flex-1 px-2 py-1 text-xs bg-ink-surface-raised border border-ink-border rounded text-ink-text placeholder:text-ink-text-subtle focus:outline-none focus:ring-1 focus:ring-amber/30 focus:border-amber"
              onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
            />
          </div>
          <div className="flex rounded bg-ink-surface-raised p-0.5">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSidebarTab(key)}
                className={`flex-1 py-1 text-xs rounded transition-ink ${
                  sidebarTab === key ? "bg-ink-bg text-amber" : "text-ink-text-dim"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {sidebarTab === "outline" ? (
            <OutlineView
              html={selectedChapter?.content ?? ""}
              onJump={handleOutlineJump}
              onReorder={handleOutlineReorder}
            />
          ) : sidebarTab === "notes" ? (
            selectedChapter ? (
              <ChapterNotes chapter={selectedChapter} onNotesChange={handleNotesChange} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-ink-text-subtle">请先选择一个章节</p>
              </div>
            )
          ) : sidebarTab === "project-outline" ? (
            <ProjectOutline
              chapters={projectState.chapters}
              onReorder={handleReorderChapters}
              onNavigateToChapter={(id) => projectDispatch({ type: "SET_SELECTED", chapterId: id })}
              onSelectChapter={(id) => projectDispatch({ type: "SET_SELECTED", chapterId: id })}
            />
          ) : sidebarTab === "characters" ? (
            <>
              <div className="p-2 border-b border-ink-border">
                <button onClick={() => { setEditingCharacter(null); setShowCharacterModal(true); }}
                  className="w-full py-1.5 text-xs bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink">+ 新建角色</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {characters.length === 0 ? (
                  <p className="text-xs text-ink-text-subtle text-center py-4">暂无角色</p>
                ) : characters.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded hover:bg-ink-surface-hover">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-text truncate">{c.name}</p>
                      {c.traits.length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {c.traits.map((t) => <span key={t} className="text-[10px] px-1 py-0.5 bg-amber-subtle text-amber rounded-full">{t}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => { setEditingCharacter(c); setShowCharacterModal(true); }}
                        className="text-[10px] text-ink-text-dim hover:text-ink-text px-1.5 py-0.5 rounded hover:bg-ink-surface-hover">编辑</button>
                      <button onClick={() => handleDeleteCharacter(c.id)}
                        className="text-[10px] text-red-400/60 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-ink-surface-hover">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : sidebarTab === "world" ? (
            <>
              <div className="p-2 border-b border-ink-border">
                <button onClick={() => { setEditingWorldSetting(null); setShowWorldModal(true); }}
                  className="w-full py-1.5 text-xs bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink">+ 新建设定</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {worldSettings.length === 0 ? (
                  <p className="text-xs text-ink-text-subtle text-center py-4">暂无设定</p>
                ) : worldSettings.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-2 rounded hover:bg-ink-surface-hover">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-text truncate">{w.name}</p>
                      <p className="text-[10px] text-ink-text-subtle truncate">{w.category || w.description}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => { setEditingWorldSetting(w); setShowWorldModal(true); }}
                        className="text-[10px] text-ink-text-dim hover:text-ink-text px-1.5 py-0.5 rounded hover:bg-ink-surface-hover">编辑</button>
                      <button onClick={() => handleDeleteWorldSetting(w.id)}
                        className="text-[10px] text-red-400/60 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-ink-surface-hover">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <ChapterTree
              chapters={projectState.chapters}
              selectedChapterId={projectState.selectedChapterId}
              onSelect={(id) => projectDispatch({ type: "SET_SELECTED", chapterId: id })}
              onAdd={handleAddChapter}
              onDelete={handleDeleteChapter}
              onReorder={handleReorderChapters}
              onStatusChange={handleStatusChange}
              onSummaryChange={handleSummaryChange}
            />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <EditorToolbar
          editor={editorInstanceRef.current}
          onSearchClick={() => setShowSearch(true)}
          onExportClick={() => setShowExport(true)}
          onShortcutHelpClick={() => setShowShortcutHelp(true)}
          onVersionHistoryClick={() => setShowVersionHistory(true)}
        />
        {showSearch && projectId && (
          <SearchDialog
            projectId={projectId}
            onJumpToChapter={handleSearchJumpToChapter}
            onClose={() => setShowSearch(false)}
          />
        )}
        <div className="flex-1 overflow-hidden">
          {selectedChapter ? (
            <ErrorBoundary>
              <NovelEditor
                content={selectedChapter.content}
                chapterTitle={selectedChapter.title}
                onContentChange={handleContentChange}
                onAutoSave={handleAutoSave}
                onEditorReady={handleEditorReady}
                wordGoal={selectedChapter.wordGoal}
              />
            </ErrorBoundary>
          ) : (
            <div className="flex items-center justify-center h-full bg-ink-bg">
              <div className="text-center">
                <p className="text-ink-text-dim mb-4">选择或创建一个章节开始写作</p>
                <button
                  onClick={handleAddChapter}
                  className="px-4 py-2 text-sm bg-amber text-ink-bg rounded hover:bg-amber-hover transition-ink"
                >
                  创建第一个章节
                </button>
              </div>
            </div>
          )}
        </div>

        {projectId && (
          <AIErrorBoundary key={aiSidebarKey} onRetry={() => setAiSidebarKey((k) => k + 1)}>
            <AISidebar
              editor={editorInstanceRef.current}
              projectId={projectId}
            />
          </AIErrorBoundary>
        )}
        <CharacterModal isOpen={showCharacterModal} onClose={() => { setShowCharacterModal(false); setEditingCharacter(null); }}
          onSave={handleSaveCharacter} character={editingCharacter} />
        <WorldSettingModal isOpen={showWorldModal} onClose={() => { setShowWorldModal(false); setEditingWorldSetting(null); }}
          onSave={handleSaveWorldSetting} worldSetting={editingWorldSetting} />
        {showExport && projectState.chapters.length > 0 && (
          <ExportDialog
            projectTitle={project?.title ?? "未命名项目"}
            chapters={projectState.chapters}
            selectedChapterId={projectState.selectedChapterId}
            onClose={() => setShowExport(false)}
          />
        )}
        {showShortcutHelp && (
          <ShortcutHelpDialog onClose={() => setShowShortcutHelp(false)} />
        )}
        {showVersionHistory && selectedChapter && (
          <VersionHistoryDialog
            chapterId={selectedChapter.id}
            currentTitle={selectedChapter.title}
            currentContent={selectedChapter.content}
            onRestore={handleVersionRestore}
            onClose={() => setShowVersionHistory(false)}
          />
        )}
      </div>
    </div>
  );
}
