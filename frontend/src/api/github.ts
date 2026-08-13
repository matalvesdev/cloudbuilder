import { api } from "./client";

export interface GitHubRepo {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  description: string;
  url: string;
  language: string;
  isPrivate: boolean;
  updatedAt: string;
  htmlUrl: string;
}

export interface GitHubContentItem {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  size: number;
}

export interface GitHubAuthResponse {
  authorizeUrl?: string;
  configured?: boolean;
}

export function getGitHubAuthUrl(): Promise<GitHubAuthResponse> {
  return api.get("/github/auth");
}

export function listRepos(): Promise<{ repos: GitHubRepo[] }> {
  return api.get("/github/repos");
}

export function listRepoContents(
  owner: string,
  name: string,
  path: string,
  branch?: string,
): Promise<{ files: GitHubContentItem[] }> {
  const query = `path=${encodeURIComponent(path)}${branch ? `&branch=${encodeURIComponent(branch)}` : ""}`;
  return api.get(`/github/repos/${owner}/${name}/contents?${query}`);
}

export function getFileContent(
  owner: string,
  name: string,
  path: string,
  branch?: string,
): Promise<{ content: string }> {
  const query = `path=${encodeURIComponent(path)}${branch ? `&branch=${encodeURIComponent(branch)}` : ""}`;
  return api.get(`/github/repos/${owner}/${name}/file?${query}`);
}
