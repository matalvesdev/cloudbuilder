import { api } from "./client";
import type { CodeAnalysisRequest, CodeAnalysisResponse } from "./types";

export async function analyzeCode(
  request: CodeAnalysisRequest,
): Promise<CodeAnalysisResponse> {
  return api.post("/code-analysis/analyze", request);
}
