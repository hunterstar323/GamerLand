export type UserRole = '0' | '1';
export type AuthMode = 'login' | 'register';
export type AppView = 'catalog' | 'auth' | 'profile' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  birthDate: string;
  role: UserRole;
  registeredAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Product {
  id: number;
  ownerId: number;
  ownerName: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  image: string | null;
  categories: Category[];
  isAdultOnly: boolean;
}

export interface Category {
  id: number;
  name: string;
  swMayoriaEdad: '0' | '1';
}

export interface PurchaseItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    image: string | null;
  };
}

export interface Purchase {
  id: number;
  buyerId: number;
  buyerName: string;
  purchaseDate: string;
  total: number;
  items: PurchaseItem[];
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  birthDate?: string;
  password: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  categoryIds?: number[];
}

export interface AdminUserInput {
  name?: string;
  role?: UserRole;
}

export interface PurchaseInput {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface Session {
  token: string;
  user: User;
}

export interface Notice {
  kind: 'success' | 'error' | 'info';
  message: string;
}

export interface AppState {
  session: Session | null;
  products: Product[];
  categories: Category[];
  myProducts: Product[];
  purchases: Purchase[];
  users: User[];
  authMode: AuthMode;
  currentView: AppView;
  catalogSearch: string;
  selectedCategoryId: number | null;
  productEditingId: number | null;
  busy: boolean;
  notice: Notice | null;
}
