import { API_URL } from './config.js';
import type {
  AdminUserInput,
  AuthResponse,
  Category,
  LoginInput,
  Product,
  ProductInput,
  Purchase,
  PurchaseInput,
  PurchaseStatus,
  RegisterInput,
  User,
} from './types.js';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

type ProductQuery = {
  search?: string;
  categoryId?: number | null;
};

function buildProductQuery(params: ProductQuery = {}): string {
  const query = new URLSearchParams();

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  if (params.categoryId) {
    query.set('categoryId', String(params.categoryId));
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;

    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message ?? 'Ocurrió un error inesperado.';

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const api = {
  register(payload: RegisterInput) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    });
  },
  login(payload: LoginInput) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    });
  },
  me(token: string) {
    return request<User>('/auth/me', { token });
  },
  getProducts(params: ProductQuery = {}) {
    return request<Product[]>(`/products${buildProductQuery(params)}`);
  },
  getMyProducts(token: string, params: ProductQuery = {}) {
    return request<Product[]>(`/products/me${buildProductQuery(params)}`, {
      token,
    });
  },
  getCategories() {
    return request<Category[]>('/products/categories');
  },
  createCategory(
    payload: { name: string; swMayoriaEdad: '0' | '1' },
    token: string,
  ) {
    return request<Category>('/products/categories', {
      method: 'POST',
      body: payload,
      token,
    });
  },
  updateCategory(id: number, payload: Partial<Category>, token: string) {
    return request<Category>(`/products/categories/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    });
  },
  deleteCategory(id: number, token: string) {
    return request<{ message: string }>(`/products/categories/${id}`, {
      method: 'DELETE',
      token,
    });
  },
  createProduct(payload: ProductInput, token: string) {
    return request<Product>('/products', {
      method: 'POST',
      body: payload,
      token,
    });
  },
  updateProduct(id: number, payload: ProductInput, token: string) {
    return request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    });
  },
  deleteProduct(id: number, token: string) {
    return request<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
      token,
    });
  },
  createPurchase(payload: PurchaseInput, token: string) {
    return request<Purchase>('/purchases', {
      method: 'POST',
      body: payload,
      token,
    });
  },
  getMyPurchases(token: string) {
    return request<Purchase[]>('/purchases/me', { token });
  },
  getMySales(token: string) {
    return request<Purchase[]>('/purchases/sales/me', { token });
  },
  getPurchases(token: string) {
    return request<Purchase[]>('/purchases', { token });
  },
  updatePurchaseStatus(id: number, swEstado: PurchaseStatus, token: string) {
    return request<Purchase>(`/purchases/${id}/status`, {
      method: 'PUT',
      body: { swEstado },
      token,
    });
  },
  getUsers(token: string) {
    return request<User[]>('/users', { token });
  },
  updateUserByAdmin(id: number, payload: AdminUserInput, token: string) {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: payload,
      token,
    });
  },
};
