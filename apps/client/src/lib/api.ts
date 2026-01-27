type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const API_BASE = '/api';

let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const refreshToken = async () => {
  try {
    const oldToken = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: oldToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const { token } = await response.json();
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return Promise.reject(error);
  }
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  // Get token from localStorage
  let token = localStorage.getItem('token');
  
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
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
  
  if (!res.ok) {
    if (res.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshToken().then(newToken => {
          isRefreshing = false;
          processQueue(null, newToken);
        }).catch(error => {
          processQueue(error, null);
          return Promise.reject(error);
        });
      }

      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newToken => {
        if (options.headers) {
          (options.headers as any)['Authorization'] = `Bearer ${newToken}`;
        }
        return request(path, options);
      }) as Promise<T>;
    }
    
    const message = (data as unknown as any)?.message || res.statusText;
    throw new Error(message);
  }
  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" satisfies HttpMethod }),
  post: <T>(path: string, body?: unknown, isFormData?: boolean) =>
    request<T>(path, { 
      method: "POST" satisfies HttpMethod, 
      body: isFormData && body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
      headers: isFormData ? {} : { "Content-Type": "application/json" }
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT" satisfies HttpMethod, body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH" satisfies HttpMethod, body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" satisfies HttpMethod }),
};
