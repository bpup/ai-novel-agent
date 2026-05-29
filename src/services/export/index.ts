/** Strip HTML tags and decode common entities to plain text. */
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple HTML→Markdown converter covering the HTML that Tiptap produces:
 * headings, bold, italic, paragraphs, hr, lists.
 */
function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let md = html;

  // Headings
  md = md.replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n");

  // Bold / italic
  md = md.replace(/<(strong|b)>(.*?)<\/(strong|b)>/gi, "**$2**");
  md = md.replace(/<(em|i)>(.*?)<\/(em|i)>/gi, "*$2*");

  // Horizontal rule
  md = md.replace(/<hr\s*\/?>/gi, "---\n\n");

  // Paragraphs
  md = md.replace(/<p>(.*?)<\/p>/gi, "$1\n\n");

  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, "\n");

  // Unordered lists
  md = md.replace(/<ul>(.*?)<\/ul>/gis, (_: string, content: string) =>
    content.replace(/<li>(.*?)<\/li>/gi, "- $1\n") + "\n",
  );

  // Ordered lists
  md = md.replace(/<ol>(.*?)<\/ol>/gis, (_: string, content: string) => {
    let count = 1;
    return (
      content.replace(/<li>(.*?)<\/li>/gi, (_m: string, item: string) =>
        `${count++}. ${item}\n`,
      ) + "\n"
    );
  });

  // Strip remaining HTML tags (span, div, etc.)
  md = md.replace(/<[^>]*>/g, "");

  // Decode entities
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');

  // Clean up whitespace
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md;
}

export type ExportFormat = "markdown" | "txt" | "html";

interface ChapterExport {
  title: string;
  content: string;
}

/** Trigger a file download in the browser. */
function downloadFile(
  content: string,
  name: string,
  ext: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export a single chapter to the given format and trigger download. */
export function exportChapter(
  chapter: ChapterExport,
  format: ExportFormat,
  filename?: string,
): void {
  let content: string;
  let ext: string;
  let mime: string;

  switch (format) {
    case "markdown":
      content = `# ${chapter.title}\n\n${htmlToMarkdown(chapter.content)}`;
      ext = "md";
      mime = "text/markdown";
      break;
    case "txt":
      content = `${chapter.title}\n\n${stripHtml(chapter.content)}`;
      ext = "txt";
      mime = "text/plain";
      break;
    case "html":
      content =
        `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>${chapter.title}</title></head>\n` +
        `<body>\n<h1>${chapter.title}</h1>\n${chapter.content}\n</body>\n</html>`;
      ext = "html";
      mime = "text/html";
      break;
  }

  downloadFile(content, filename || chapter.title, ext, mime);
}

/** Export all chapters in a project as a single file. */
export function exportProject(
  title: string,
  chapters: ChapterExport[],
  format: ExportFormat,
): void {
  let content: string;
  let ext: string;
  let mime: string;

  const toc = chapters.map((c, i) => `${i + 1}. ${c.title}`).join("\n");

  switch (format) {
    case "markdown":
      content = `# ${title}\n\n## 目录\n\n${toc}\n\n---\n\n`;
      content += chapters
        .map((c) => `## ${c.title}\n\n${htmlToMarkdown(c.content)}`)
        .join("\n\n---\n\n");
      ext = "md";
      mime = "text/markdown";
      break;
    case "txt":
      content = `${title}\n\n目录\n${toc}\n\n---\n\n`;
      content += chapters
        .map((c) => `${c.title}\n\n${stripHtml(c.content)}`)
        .join("\n\n---\n\n");
      ext = "txt";
      mime = "text/plain";
      break;
    case "html":
      content =
        `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"><title>${title}</title>\n` +
        `<style>body{max-width:800px;margin:0 auto;padding:2rem;font-family:system-ui;line-height:1.8}h1,h2{color:#333}hr{border:1px solid #eee;margin:2rem 0}</style></head>\n` +
        `<body>\n<h1>${title}</h1>\n<h2>目录</h2>\n<ol>${chapters
          .map((c) => `<li>${c.title}</li>`)
          .join("")}</ol>\n<hr>\n${chapters
          .map((c) => `<h2>${c.title}</h2>\n${c.content}`)
          .join("\n<hr>\n")}\n</body>\n</html>`;
      ext = "html";
      mime = "text/html";
      break;
  }

  downloadFile(content, title, ext, mime);
}

/**
 * Count plain-text characters across all chapters in a project.
 * Loads chapters via the chapter service.
 */
export async function countProjectWords(
  chapters: { content: string }[],
): Promise<number> {
  return chapters.reduce((sum, c) => sum + stripHtml(c.content).length, 0);
}
