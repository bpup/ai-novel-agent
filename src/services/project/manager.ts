import { getRows, runQuery } from "../db/database";
import { ragEngine } from "../rag/engine";
import type { NovelProject, NovelProjectWithDetails, Chapter, Character, WorldSetting } from "../../types/novel";
import type { ChapterStatus } from "../../types/chat";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class ProjectManager {
  async createProject(title: string, description = ""): Promise<NovelProject> {
    const id = generateId();
    const now = new Date().toISOString();

    await runQuery(
      "INSERT INTO projects (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [id, title, description, now, now],
    );

    return { id, title, description, createdAt: now, updatedAt: now };
  }

  async getAllProjects(): Promise<NovelProject[]> {
    return getRows<NovelProject>(
      "SELECT id, title, description, created_at as createdAt, updated_at as updatedAt FROM projects ORDER BY updated_at DESC",
    );
  }

  async getProject(projectId: string): Promise<NovelProjectWithDetails | null> {
    const projects = await getRows<NovelProject & { created_at: string; updated_at: string }>(
      "SELECT id, title, description, created_at, updated_at FROM projects WHERE id = ?",
      [projectId],
    );

    if (projects.length === 0) return null;

    const p = projects[0];
    const chapters = await getRows<Chapter>(
      "SELECT id, project_id as projectId, title, content, chapter_order as chapterOrder FROM chapters WHERE project_id = ? ORDER BY chapter_order ASC",
      [projectId],
    );
    const characters = await getRows<Character>(
      "SELECT id, project_id as projectId, name, description, traits FROM characters WHERE project_id = ?",
      [projectId],
    );
    const worldSettings = await getRows<WorldSetting>(
      "SELECT id, project_id as projectId, name, description, category FROM world_settings WHERE project_id = ?",
      [projectId],
    );

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      chapters,
      characters,
      worldSettings,
    };
  }

  async updateProject(
    projectId: string,
    data: Partial<Pick<NovelProject, "title" | "description">>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: string[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    fields.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(projectId);

    await runQuery(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  async deleteProject(projectId: string): Promise<void> {
    await runQuery("DELETE FROM chat_history WHERE project_id = ?", [projectId]);
    await runQuery("DELETE FROM world_settings WHERE project_id = ?", [projectId]);
    await runQuery("DELETE FROM characters WHERE project_id = ?", [projectId]);
    await runQuery("DELETE FROM chapters WHERE project_id = ?", [projectId]);
    await runQuery("DELETE FROM projects WHERE id = ?", [projectId]);

    await ragEngine.removeProject(projectId);
  }
}

export class ChapterService {
  private readonly defaults = {
    summary: "",
    wordGoal: 5000,
    status: "draft" as ChapterStatus,
    notes: "",
  };

  async addChapter(projectId: string, title: string, content = ""): Promise<Chapter> {
    const id = generateId();
    const chapters = await getRows<{ maxOrder: number }>(
      "SELECT COALESCE(MAX(chapter_order), -1) as maxOrder FROM chapters WHERE project_id = ?",
      [projectId],
    );
    const order = (chapters[0]?.maxOrder ?? -1) + 1;

    await runQuery(
      "INSERT INTO chapters (id, project_id, title, content, chapter_order) VALUES (?, ?, ?, ?, ?)",
      [id, projectId, title, content, order],
    );
    await runQuery("UPDATE projects SET updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      projectId,
    ]);

    if (content.trim()) {
      await ragEngine.indexContent(projectId, content, {
        type: "chapter",
        title,
        chapterId: id,
      });
    }

    return { id, projectId, title, content, order, ...this.defaults };
  }

  async updateChapter(
    chapterId: string,
    data: Partial<Pick<Chapter, "title" | "content" | "summary" | "wordGoal" | "status" | "notes">>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: string[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      values.push(data.title);
    }
    if (data.content !== undefined) {
      fields.push("content = ?");
      values.push(data.content);
    }
    if (data.summary !== undefined) {
      fields.push("summary = ?");
      values.push(data.summary);
    }
    if (data.wordGoal !== undefined) {
      fields.push("word_goal = ?");
      values.push(String(data.wordGoal));
    }
    if (data.status !== undefined) {
      fields.push("status = ?");
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push("notes = ?");
      values.push(data.notes);
    }

    if (fields.length === 0) return;
    values.push(chapterId);
    await runQuery(`UPDATE chapters SET ${fields.join(", ")} WHERE id = ?`, values);

    if (data.content !== undefined) {
      const rows = await getRows<{ project_id: string; title: string }>(
        "SELECT project_id, title FROM chapters WHERE id = ?",
        [chapterId],
      );
      if (rows.length > 0 && data.content.trim()) {
        await ragEngine.indexContent(rows[0].project_id, data.content, {
          type: "chapter",
          title: rows[0].title,
          chapterId,
        });
      }
    }
  }

  async deleteChapter(chapterId: string): Promise<void> {
    await runQuery("DELETE FROM chapters WHERE id = ?", [chapterId]);
  }

  async getChapters(projectId: string): Promise<Chapter[]> {
    const rows = await getRows<Chapter>(
      "SELECT id, project_id as projectId, title, content, chapter_order as chapterOrder FROM chapters WHERE project_id = ? ORDER BY chapter_order ASC",
      [projectId],
    );
    return rows.map((row) => ({
      ...this.defaults,
      ...row,
    }));
  }

  async reorderChapters(projectId: string, chapterIds: string[]): Promise<void> {
    for (let i = 0; i < chapterIds.length; i++) {
      await runQuery("UPDATE chapters SET chapter_order = ? WHERE id = ? AND project_id = ?", [
        i,
        chapterIds[i],
        projectId,
      ]);
    }
  }
}

export const projectManager = new ProjectManager();
export const chapterService = new ChapterService();
