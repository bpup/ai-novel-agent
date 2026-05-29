import { chapterService } from "../project/manager";

/** Strip HTML tags and decode common entities to plain text. */
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  /** Context excerpt around the match (includes surrounding text). */
  excerpt: string;
  /** Character position in the plain text (for future jump-to). */
  position: number;
}

/**
 * Search all chapters in a project for the given query.
 * Returns a list of results with excerpt context.
 */
export async function searchChapters(
  projectId: string,
  query: string,
): Promise<SearchResult[]> {
  const chapters = await chapterService.getChapters(projectId);
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const chapter of chapters) {
    const plainText = stripHtml(chapter.content);
    if (!plainText) continue;

    const lowerText = plainText.toLowerCase();
    let pos = 0;

    while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
      // ~40 chars of context before and after the match
      const contextStart = Math.max(0, pos - 40);
      const contextEnd = Math.min(plainText.length, pos + query.length + 40);
      let excerpt = plainText.slice(contextStart, contextEnd);

      if (contextStart > 0) excerpt = "\u2026" + excerpt;
      if (contextEnd < plainText.length) excerpt = excerpt + "\u2026";

      results.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        excerpt,
        position: pos,
      });

      pos += query.length;
    }
  }

  return results;
}
