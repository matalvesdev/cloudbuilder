import { api } from "./client";

export interface DocNode {
  id: string;
  path: string;
  name: string;
  type: "file" | "directory";
  children?: DocNode[];
}

export interface DocContent {
  path: string;
  title: string;
  content: string;
}

export interface DocLink {
  id: string;
  docPath: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  lastSync: string;
  createdAt: string;
}

export function fetchDocTree(): Promise<DocNode[]> {
  return api.get("/docs/tree");
}

export function fetchDocContent(path: string): Promise<DocContent> {
  return api.get(`/docs/content?path=${encodeURIComponent(path)}`);
}

export function searchDocs(query: string): Promise<DocNode[]> {
  return api.get(`/docs/search?q=${encodeURIComponent(query)}`);
}

export interface StaleDoc {
  path: string;
  title: string;
  entityType: string;
  entityName: string;
  lastSync: string;
}

export function fetchStaleDocs(): Promise<StaleDoc[]> {
  return api.get("/docs/stale");
}

export function fetchDocLinks(path: string): Promise<DocLink[]> {
  return api.get(`/docs/links?path=${encodeURIComponent(path)}`);
}

export function saveDocContent(path: string, content: string): Promise<void> {
  return api.put("/docs/content", { path, content });
}

export function generateDocFromCanvas(
  canvasId: string,
  canvasName?: string,
  description?: string,
): Promise<DocContent> {
  return api.post("/docs/generate", { canvasId, canvasName, description });
}

export function generateArchitectureDoc(canvasId: string): Promise<DocContent> {
  return api.post("/docs/generate-architecture", { canvasId });
}

export function getAiContext(canvasId: string): Promise<{ context: string }> {
  return api.get(`/docs/ai-context/${canvasId}`);
}

export function generateReadme(canvasId: string): Promise<DocContent> {
  return api.post("/docs/generate-readme", { canvasId });
}

export function generateC4(canvasId: string): Promise<DocContent> {
  return api.post("/docs/generate-c4", { canvasId });
}

export function importDoc(file: File): Promise<{ path: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/docs/import", formData);
}

export function scanDocs(): Promise<{ scanned: number }> {
  return api.post("/docs/scan");
}
