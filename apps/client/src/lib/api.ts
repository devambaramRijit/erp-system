type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log('API Request:', {
    method: options.method || 'GET',
    url,
    body: options.body
  });
  
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  
  console.log('API Response:', {
    status: res.status,
    statusText: res.statusText,
    url: res.url,
    data
  });

  if (!res.ok) {
    const message = (data as unknown as any)?.message || res.statusText;
    console.error('API Error:', {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      message
    });
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
