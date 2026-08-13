import { api } from "@/api/client";

export interface CanvasVersion {
  id: string;
  canvasId: string;
  version: number;
  changeDescription: string;
  createdBy: string;
  createdAt: string;
}

export interface VersionDiff {
  canvasId: string;
  versionA: number;
  versionB: number;
  nodesAdded: DiffEntry[];
  nodesRemoved: DiffEntry[];
  nodesModified: DiffEntry[];
  edgesAdded: DiffEntry[];
  edgesRemoved: DiffEntry[];
}

export interface DiffEntry {
  componentId: string;
  componentName: string;
  changeType: string;
  details: string;
}

export async function fetchVersions(
  canvasId: string,
): Promise<CanvasVersion[]> {
  return api.get<CanvasVersion[]>(`/canvases/${canvasId}/versions`);
}

export async function createVersion(
  canvasId: string,
  changeDescription: string,
  createdBy?: string,
): Promise<CanvasVersion> {
  return api.post<CanvasVersion>(`/canvases/${canvasId}/versions`, {
    changeDescription,
    createdBy: createdBy ?? "anonymous",
  });
}

export async function rollbackToVersion(
  canvasId: string,
  version: number,
): Promise<void> {
  return api.post<void>(`/canvases/${canvasId}/versions/rollback/${version}`);
}

export async function fetchVersionDiff(
  canvasId: string,
  from: number,
  to: number,
): Promise<VersionDiff> {
  return api.get<VersionDiff>(
    `/canvases/${canvasId}/versions/diff?from=${from}&to=${to}`,
  );
}
