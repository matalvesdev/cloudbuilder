import { api } from "./client";

export interface FeatureFlagDTO {
  id: string;
  tenantId: string | null;
  flagKey: string;
  flagType: "BOOLEAN" | "STRING" | "JSON";
  valueJson: string;
  enabled: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlagRequest {
  flagKey: string;
  flagType: "BOOLEAN" | "STRING" | "JSON";
  valueJson: string;
  enabled: boolean;
  description?: string;
}

export interface UpdateFlagRequest {
  enabled?: boolean;
  valueJson?: string;
  description?: string;
}

export function listFlags(): Promise<FeatureFlagDTO[]> {
  return api.get("/feature-flags");
}

export function getFlag(key: string): Promise<FeatureFlagDTO> {
  return api.get(`/feature-flags/${key}`);
}

export function updateFlag(
  key: string,
  req: UpdateFlagRequest,
): Promise<FeatureFlagDTO> {
  return api.put(`/feature-flags/${key}`, req);
}

export function createFlag(
  flag: Omit<FeatureFlagDTO, "id" | "createdAt" | "updatedAt">,
): Promise<FeatureFlagDTO> {
  return api.post("/feature-flags", flag);
}

export function deleteFlag(key: string): Promise<void> {
  return api.delete(`/feature-flags/${key}`);
}

export function refreshCache(): Promise<void> {
  return api.post("/feature-flags/refresh");
}

export function checkFlag(key: string): Promise<{ enabled: boolean }> {
  return api.get(`/feature-flags/${key}/check`);
}

export const featureFlagsApi = {
  listFlags,
  getFlag,
  updateFlag,
  createFlag,
  deleteFlag,
  refreshCache,
  checkFlag,
};
