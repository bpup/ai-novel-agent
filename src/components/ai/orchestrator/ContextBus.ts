import type { Chapter } from "../../../types/novel";
import type { MentionTarget } from "../../../types/chat";

export interface EditorContext {
  currentChapterId: string | null;
  currentChapterTitle: string | null;
  selectedText: string;
  beforeText: string;
  afterText: string;
}

export interface ProjectContextData {
  id: string;
  title: string;
  description: string;
}

export interface SelectionData {
  selectedText: string;
  beforeText: string;
  afterText: string;
}

export interface PromptOptions {
  includeProject?: boolean;
  includeChapter?: boolean;
  includeSelection?: boolean;
  additionalPrompt?: string;
}

const SYSTEM_INSTRUCTION =
  "你是一位专业的写作助手，帮助作者创作小说。请根据提供的上下文，给出符合角色设定和故事基调的回答。";

export class ContextBus {
  private chapter: Chapter | null = null;
  private project: ProjectContextData | null = null;
  private selection: SelectionData | null = null;

  setEditor(_editor: unknown): void {
    // Placeholder for ProseMirror editor reference
  }

  setCurrentChapter(chapter: Chapter | null): void {
    this.chapter = chapter;
  }

  setProjectContext(project: ProjectContextData): void {
    this.project = project;
  }

  setSelectionContext(data: SelectionData | null): void {
    this.selection = data;
  }

  clear(): void {
    this.chapter = null;
    this.project = null;
    this.selection = null;
  }

  resolveMention(input: string): MentionTarget | null {
    const trimmed = input.trim();

    if (trimmed === "@selection") {
      return { kind: "selection", label: "@selection" };
    }

    if (trimmed === "@project") {
      return { kind: "project", label: "@project" };
    }

    if (trimmed.startsWith("@chapter")) {
      if (!this.chapter) return null;

      const rest = trimmed.slice("@chapter".length).trim();
      const title = this.chapter.title;

      if (!rest || title.includes(rest)) {
        return {
          kind: "chapter",
          label: `@chapter ${title}`,
          chapterId: this.chapter.id,
          chapterTitle: title,
        };
      }
      return null;
    }

    return null;
  }

  getEditorContext(): EditorContext {
    return {
      currentChapterId: this.chapter?.id ?? null,
      currentChapterTitle: this.chapter?.title ?? null,
      selectedText: this.selection?.selectedText ?? "",
      beforeText: this.selection?.beforeText ?? "",
      afterText: this.selection?.afterText ?? "",
    };
  }

  buildContextPrompt(options: PromptOptions = {}): string {
    const parts: string[] = [SYSTEM_INSTRUCTION];

    if (options.includeProject && this.project) {
      parts.push(
        `\n## 项目信息\n项目名称：${this.project.title}\n项目简介：${this.project.description}`,
      );
    }

    if (options.includeChapter && this.chapter) {
      const content = this.chapter.content.length > 2000
        ? this.chapter.content.slice(0, 2000) + "..."
        : this.chapter.content;
      parts.push(
        `\n## 当前章节：${this.chapter.title}\n章节内容：\n${content}`,
      );
    }

    if (options.includeSelection && this.selection) {
      parts.push(
        `\n## 当前选中文字\n${this.selection.selectedText}`,
      );
      if (this.selection.beforeText) {
        parts.push(`上文：\n${this.selection.beforeText}`);
      }
    }

    if (options.additionalPrompt) {
      parts.push(`\n${options.additionalPrompt}`);
    }

    return parts.join("\n");
  }
}

export const contextBus = new ContextBus();
