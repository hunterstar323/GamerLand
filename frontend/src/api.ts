import { API_URL } from './config.js';
import type {
  AuthResponse,
  LoginInput,
  Product,
  ProductInput,
  Purchase,
  PurchaseInput,
  RegisterInput,
  User,
} from './types.js';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

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
  getProducts() {
    return request<Product[]>('/products');
  },
  getMyProducts(token: string) {
    return request<Product[]>('/products/me', { token });
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
};
