import { api } from "./client";
import type {
  ImportTerraformRequest,
  ImportTerraformResponse,
  ImportStateRequest,
  ImportStateResponse,
  ImportMultiRequest,
  ImportMultiResponse,
} from "./types";

export function importTerraform(
  content: string,
): Promise<ImportTerraformResponse> {
  return api.post<ImportTerraformResponse>("/import/terraform", {
    content,
  } as ImportTerraformRequest);
}

export function importState(content: string): Promise<ImportStateResponse> {
  return api.post<ImportStateResponse>("/import/state", {
    content,
  } as ImportStateRequest);
}

export function importMulti(
  files: { fileName: string; content: string }[],
): Promise<ImportMultiResponse> {
  return api.post<ImportMultiResponse>("/import/multi", {
    files,
  } as ImportMultiRequest);
}

export async function importUpload(
  files: FileList | File[],
): Promise<ImportMultiResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  return api.post<ImportMultiResponse>("/import/upload", formData);
}
