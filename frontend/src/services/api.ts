const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = import.meta.env.VITE_AUTH_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function fetchCanvases() {
  return request<any[]>("/canvases");
}

export function fetchCanvas(id: string) {
  return request<any>(`/canvases/${id}`);
}

export function createCanvas(data: any) {
  return request<any>("/canvases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCanvas(id: string, data: any) {
  return request<any>(`/canvases/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCanvas(id: string) {
  return request<void>(`/canvases/${id}`, {
    method: "DELETE",
  });
}

export function addNode(canvasId: string, data: any) {
  return request<any>(`/canvases/${canvasId}/nodes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateNode(canvasId: string, nodeId: string, data: any) {
  return request<any>(`/canvases/${canvasId}/nodes/${nodeId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removeNode(canvasId: string, nodeId: string) {
  return request<void>(`/canvases/${canvasId}/nodes/${nodeId}`, {
    method: "DELETE",
  });
}

export function addEdge(canvasId: string, data: any) {
  return request<any>(`/canvases/${canvasId}/edges`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function removeEdge(canvasId: string, edgeId: string) {
  return request<void>(`/canvases/${canvasId}/edges/${edgeId}`, {
    method: "DELETE",
  });
}

export function validateCanvas(canvasId: string) {
  return request<any>(`/canvases/${canvasId}/validate`, {
    method: "POST",
  });
}
