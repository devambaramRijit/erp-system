type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = "http://localhost:3000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api${path}`;
  console.log('API Request:', {
    method: options.method || 'GET',
    url,
    body: options.body
  });
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  });

  const text = await res.text();
  let data;
  
  // Check if response is HTML (error page) or JSON
  if (text && text.trim().startsWith('<!DOCTYPE')) {
    console.error('Server returned HTML instead of JSON:', text);
    throw new Error(`Server error: ${res.status} ${res.statusText}`);
  } else {
    data = text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  }
  
  console.log('API Response:', {
    status: res.status,
    statusText: res.statusText,
    url: res.url,
    data
  });

  if (!res.ok) {
    // Handle authentication errors
    if (res.status === 401) {
      console.error('Authentication error - removing token from localStorage');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
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
