export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: number;
  user_id: number;
  date: string;
  category: string;
  amount: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface Summary {
  total: number;
  average: number;
  count: number;
  categories: CategoryBreakdown[];
  recent: Expense[];
}

export interface PaginatedResponse<T> {
  expenses: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
}
