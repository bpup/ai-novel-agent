import { getRows, runQuery } from "../db/database";

export interface ChapterVersion {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  wordCount: number;
  description: string;
  savedAt: string;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function wordCount(html: string): number {
  return stripHtml(html).length;
}

export class ChapterVersionService {
  async saveVersion(
    chapterId: string,
    title: string,
    content: string,
    description = "",
  ): Promise<ChapterVersion> {
    const id = generateId();
    const savedAt = new Date().toISOString();
    const count = wordCount(content);

    await runQuery(
      `INSERT INTO chapter_versions (id, chapter_id, title, content, word_count, description, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, chapterId, title, content, count, description, savedAt],
    );

    return { id, chapterId, title, content, wordCount: count, description, savedAt };
  }

  async getVersions(chapterId: string): Promise<ChapterVersion[]> {
    return getRows<ChapterVersion>(
      `SELECT id, chapter_id as chapterId, title, content, word_count as wordCount,
              description, saved_at as savedAt
       FROM chapter_versions
       WHERE chapter_id = ?
       ORDER BY saved_at DESC`,
      [chapterId],
    );
  }

  async getVersion(versionId: string): Promise<ChapterVersion | null> {
    const rows = await getRows<ChapterVersion>(
      `SELECT id, chapter_id as chapterId, title, content, word_count as wordCount,
              description, saved_at as savedAt
       FROM chapter_versions
       WHERE id = ?`,
      [versionId],
    );
    return rows[0] ?? null;
  }

  async restoreVersion(chapterId: string, versionId: string): Promise<ChapterVersion> {
    const version = await this.getVersion(versionId);
    if (!version) throw new Error("Version not found");

    await runQuery("UPDATE chapters SET content = ?, title = ? WHERE id = ?", [
      version.content,
      version.title,
      chapterId,
    ]);

    return version;
  }

  async deleteVersion(versionId: string): Promise<void> {
    await runQuery("DELETE FROM chapter_versions WHERE id = ?", [versionId]);
  }

  async deleteAllVersions(chapterId: string): Promise<void> {
    await runQuery("DELETE FROM chapter_versions WHERE chapter_id = ?", [chapterId]);
  }
}

export const chapterVersionService = new ChapterVersionService();
