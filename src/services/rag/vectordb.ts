import * as lancedb from "@lancedb/lancedb";
import type { SearchResult } from "../../types/rag";

let db: lancedb.Connection | null = null;
const TABLE_NAME = "documents";

async function getDB(): Promise<lancedb.Connection> {
  if (!db) {
    db = await lancedb.connect("data/lancedb");
  }
  return db;
}

async function ensureTable(): Promise<lancedb.Table> {
  const database = await getDB();
  const tables = await database.tableNames();
  if (tables.includes(TABLE_NAME)) {
    return database.openTable(TABLE_NAME);
  }
  return database.createTable(TABLE_NAME, [
    {
      id: "init",
      projectId: "_init_",
      content: "",
      metadata: "{}",
      embedding: "[]",
      fingerprintId: "",
    },
  ]);
}

export interface IndexParams {
  projectId: string;
  content: string;
  metadata?: Record<string, string>;
  embedding: number[];
  /** Unique ID to deduplicate chunks belonging to the same source (chapter id, character id, etc.) */
  fingerprintId: string;
}

export async function indexDocument(params: IndexParams): Promise<void> {
  const { projectId, content, metadata = {}, embedding, fingerprintId } = params;
  const table = await ensureTable();

  // Dedup: remove old chunks with the same fingerprint before inserting new ones
  if (fingerprintId) {
    await table.delete(`fingerprintId = "${fingerprintId}"`);
  }

  const row = {
    id: `${projectId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    projectId,
    content,
    metadata: JSON.stringify(metadata),
    embedding: JSON.stringify(embedding),
    fingerprintId,
  };

  await table.add([row]);
}

export async function indexDocuments(
  items: IndexParams[],
): Promise<void> {
  if (items.length === 0) return;
  const table = await ensureTable();

  const rows = items.map(({ projectId, content, metadata = {}, embedding, fingerprintId }) => ({
    id: `${projectId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    projectId,
    content,
    metadata: JSON.stringify(metadata),
    embedding: JSON.stringify(embedding),
    fingerprintId,
  }));

  await table.add(rows);
}

export interface SearchOptions {
  projectId: string;
  queryVector: number[];
  limit?: number;
  /** Filter by metadata.type (e.g. "chapter", "character", "world_setting") */
  metadataType?: string;
}

export async function searchDocuments(
  options: SearchOptions,
): Promise<SearchResult[]> {
  const { projectId, queryVector, limit = 5, metadataType } = options;
  const database = await getDB();
  const tableNames = await database.tableNames();
  if (!tableNames.includes(TABLE_NAME)) return [];

  const table = await database.openTable(TABLE_NAME);

  let query = table.vectorSearch(queryVector).limit(limit);

  if (metadataType) {
    query = query.where(
      `projectId = "${projectId}" AND metadata LIKE '%"type":"${metadataType}"%'`,
    );
  } else {
    query = query.where(`projectId = "${projectId}"`);
  }

  const results = await query.toArray();

  return results.map((row: Record<string, unknown>) => ({
    document: {
      id: row.id as string,
      projectId: row.projectId as string,
      content: row.content as string,
      metadata: JSON.parse((row.metadata as string) || "{}"),
    },
    score: row._distance as number,
  }));
}

/** Keyword-based text search, complementary to vector search. */
export async function keywordSearch(
  projectId: string,
  keyword: string,
  limit = 3,
): Promise<SearchResult[]> {
  const database = await getDB();
  const tableNames = await database.tableNames();
  if (!tableNames.includes(TABLE_NAME)) return [];

  const table = await database.openTable(TABLE_NAME);

  // LanceDB supports full-text search but requires FTS index setup.
  // Fallback: fetch all project docs and filter in-memory for Chinese keyword matching.
  const all = await table
    .query()
    .where(`projectId = "${projectId}"`)
    .limit(500)
    .toArray();

  const lowerKw = keyword.toLowerCase();
  const scored = all
    .filter((row: Record<string, unknown>) => {
      const content = (row.content as string || "").toLowerCase();
      return content.includes(lowerKw);
    })
    .map((row: Record<string, unknown>) => {
      const content = row.content as string;
      // Score by match density: keyword occurrences / content length
      const occurrences = (content.toLowerCase().match(new RegExp(lowerKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
      return {
        document: {
          id: row.id as string,
          projectId: row.projectId as string,
          content: content,
          metadata: JSON.parse((row.metadata as string) || "{}"),
        },
        score: occurrences / Math.max(content.length, 1) * 100,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export async function deleteProjectDocuments(projectId: string): Promise<void> {
  const database = await getDB();
  const tableNames = await database.tableNames();
  if (!tableNames.includes(TABLE_NAME)) return;

  const table = await database.openTable(TABLE_NAME);
  await table.delete(`projectId = "${projectId}"`);
}

export async function deleteByFingerprint(fingerprintId: string): Promise<void> {
  const database = await getDB();
  const tableNames = await database.tableNames();
  if (!tableNames.includes(TABLE_NAME)) return;

  const table = await database.openTable(TABLE_NAME);
  await table.delete(`fingerprintId = "${fingerprintId}"`);
}
