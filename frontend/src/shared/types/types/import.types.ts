export type ImportMethod = "provider_scan" | "state_file" | "terraform_dir";

export type ProviderType = "aws" | "azure" | "gcp" | "k8s";

export interface ImportedResource {
  id: string;
  provider: ProviderType;
  resourceType: string;
  name: string;
  properties: Record<string, string>;
  groupName: string;
}

export interface ResourceGroup {
  name: string;
  provider: ProviderType;
  count: number;
  resources: ImportedResource[];
}

export interface ImportSession {
  id: string;
  method: ImportMethod;
  status: "scanning" | "parsing" | "completed" | "failed";
  resources: ImportedResource[];
  groups: ResourceGroup[];
  startedAt: string;
  completedAt: string | null;
}

export interface ProviderScanResult {
  groups: {
    name: string;
    icon: string;
    resources: {
      id: string;
      resourceType: string;
      name: string;
      properties: Record<string, string>;
    }[];
  }[];
}

export interface StateFileParseResult {
  resources: ImportedResource[];
  warnings: string[];
}

export interface TerraformDirScanResult {
  files: {
    path: string;
    resources: ImportedResource[];
  }[];
}
