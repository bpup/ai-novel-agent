export interface RAGDocument {
  id: string;
  projectId: string;
  content: string;
  metadata: Record<string, string>;
  embedding?: number[];
}

export interface SearchResult {
  document: RAGDocument;
  score: number;
}
