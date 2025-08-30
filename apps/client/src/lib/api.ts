type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : (undefined as unknown as T);

  if (!res.ok) {
    const message = (data as unknown as any)?.message || res.statusText;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" satisfies HttpMethod }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST" satisfies HttpMethod, body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT" satisfies HttpMethod, body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH" satisfies HttpMethod, body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" satisfies HttpMethod }),
};
