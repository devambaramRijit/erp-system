import { localStorageService } from '../services/localStorageService';

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Mock API service using localStorage
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  console.log('Local Storage Request:', {
    method: options.method || 'GET',
    path,
    body: options.body
  });

  // Get collection name from path
  const collection = path.split('/')[1] || path.split('/')[0];

  // Handle different request methods
  switch (options.method) {
    case 'GET':
      if (path.includes('/')) {
        // Get single item by ID
        const items = localStorageService.getItems(collection);
        const id = path.split('/').pop();
        const item = items.find((item: any) => item.id === id);
        return item as T;
      }
      // Get all items
      return localStorageService.getItems(collection) as T;

    case 'POST':
      // Create new item
      const newItem = JSON.parse(options.body as string);
      localStorageService.addItem(collection, newItem);
      return newItem as T;

    case 'PUT':
    case 'PATCH':
      // Update existing item
      const updateData = JSON.parse(options.body as string);
      const id = path.split('/').pop();
      localStorageService.updateItem(collection, id, updateData);
      return updateData as T;

    case 'DELETE':
      // Delete item
      const deleteId = path.split('/').pop();
      localStorageService.deleteItem(collection, deleteId);
      return { success: true } as T;

    default:
      throw new Error(`Unsupported method: ${options.method}`);
  }
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
