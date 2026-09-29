// Typed shapes of the DRF API responses. Keep in sync with backend/catalog/serializers.py.

export interface Category {
  id: number;
  name: string;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  credits: number;
  category: number;
  category_name: string;
}

/** DRF PageNumberPagination envelope used by every list endpoint. */
export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Response of POST /api/token/ (SimpleJWT). */
export interface TokenPair {
  access: string;
  refresh: string;
}
