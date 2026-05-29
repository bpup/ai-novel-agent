import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/ollama";
import type { Embeddings } from "@langchain/core/embeddings";
import { loadConfig } from "../llm/config";
import type { SearchResult } from "../../types/rag";

type VectordbModule = typeof import("./vectordb");

async function getVectordb(): Promise<VectordbModule> {
  return import("./vectordb");
}

type EmbeddingProvider = "openai" | "ollama";

export class RAGEngine {
  private splitter: RecursiveCharacterTextSplitter;
  private embeddings: Embeddings | null = null;
  private embeddingProvider: EmbeddingProvider;

  constructor() {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
      separators: ["\n\n", "\n", "。", ".", " ", ""],
    });
    this.embeddingProvider = "openai";
  }

  private getEmbeddings(): Embeddings {
    const config = loadConfig();

    // Determine provider from current config
    const currentProvider: EmbeddingProvider =
      config.provider === "ollama" || config.provider === "deepseek"
        ? "ollama"
        : "openai";

    // Recreate if provider changed or no embeddings yet
    if (this.embeddings && this.embeddingProvider === currentProvider) {
      return this.embeddings;
    }

    this.embeddingProvider = currentProvider;

    if (currentProvider === "ollama") {
      this.embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: config.baseUrl || "http://localhost:11434",
      });
    } else {
      this.embeddings = new OpenAIEmbeddings({
        modelName: "text-embedding-3-small",
        apiKey: config.apiKey || undefined,
        configuration: config.baseUrl
          ? { baseURL: config.baseUrl }
          : undefined,
      });
    }
    return this.embeddings;
  }

  async indexContent(
    projectId: string,
    content: string,
    metadata: Record<string, string> = {},
  ): Promise<void> {
    const chunks = await this.splitter.splitText(content);
    if (chunks.length === 0) return;

    const embedder = this.getEmbeddings();
    const vectors = await embedder.embedDocuments(chunks);

    const fingerprintId = metadata.chapterId
      ?? metadata.characterId
      ?? metadata.settingId
      ?? "";

    const { indexDocuments, deleteByFingerprint } = await getVectordb();

    if (fingerprintId) {
      await deleteByFingerprint(fingerprintId);
    }

    await indexDocuments(
      chunks.map((chunk, i) => ({
        projectId,
        content: chunk,
        metadata: { ...metadata, chunkIndex: String(i) },
        embedding: vectors[i],
        fingerprintId: fingerprintId || `${projectId}_${Date.now()}`,
      })),
    );
  }

  async searchContent(
    projectId: string,
    query: string,
    topK = 5,
    metadataType?: string,
  ): Promise<SearchResult[]> {
    const embedder = this.getEmbeddings();
    const queryVector = await embedder.embedQuery(query);
    const { searchDocuments, keywordSearch } = await getVectordb();

    const [vectorResults, keywordResults] = await Promise.all([
      searchDocuments({ projectId, queryVector, limit: topK, metadataType }),
      keywordSearch(projectId, query, 2),
    ]);

    // Merge vector + keyword results, deduplicate by content, sort by score
    const seen = new Set<string>();
    const merged: SearchResult[] = [];

    for (const r of [...vectorResults, ...keywordResults]) {
      const key = r.document.content.slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }

    return merged
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async indexCharacter(
    projectId: string,
    name: string,
    description: string,
    characterId?: string,
  ): Promise<void> {
    await this.indexContent(projectId, description, {
      type: "character",
      name,
      ...(characterId ? { characterId } : {}),
    });
  }

  async searchCharacters(
    projectId: string,
    query: string,
    topK = 3,
  ): Promise<SearchResult[]> {
    return this.searchContent(projectId, query, topK, "character");
  }

  async indexWorldSetting(
    projectId: string,
    name: string,
    description: string,
    category?: string,
    settingId?: string,
  ): Promise<void> {
    await this.indexContent(projectId, description, {
      type: "world_setting",
      name,
      category: category || "",
      ...(settingId ? { settingId } : {}),
    });
  }

  async searchWorldSettings(
    projectId: string,
    query: string,
    topK = 3,
  ): Promise<SearchResult[]> {
    return this.searchContent(projectId, query, topK, "world_setting");
  }

  async removeProject(projectId: string): Promise<void> {
    const { deleteProjectDocuments } = await getVectordb();
    await deleteProjectDocuments(projectId);
  }

  async removeCharacter(characterId: string): Promise<void> {
    const { deleteByFingerprint } = await getVectordb();
    await deleteByFingerprint(characterId);
  }

  async removeWorldSetting(settingId: string): Promise<void> {
    const { deleteByFingerprint } = await getVectordb();
    await deleteByFingerprint(settingId);
  }
}

export const ragEngine = new RAGEngine();
