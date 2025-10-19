// 運動教學項目的類型定義
export interface Exercise {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  videoUrl: string;
  level?: string;
  duration?: string;
  equipment?: string;
  bodyPart?: string;
  difficulty?: string;
}

// API 回應的分頁資訊
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// API 回應的資料結構
export interface ApiResponse<T> {
  items: T[];
  pagination: Pagination;
}

// 使用者認證相關類型
export interface User {
  user_id: number;
  username: string;
}

export interface AuthResponse {
  user_id: number;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  password: string;
}

// 收藏相關類型
export interface BookmarkResponse {
  message: 'newly bookmarked' | 'already bookmarked' | 'newly deleted' | 'already deleted';
}

export interface BookmarkListResponse {
  item_ids: number[];
}

// 錯誤回應類型
export interface ErrorResponse {
  error: string;
}

// API 查詢參數類型
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 應用程式狀態類型
export interface AppState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  exercises: Exercise[];
  bookmarks: number[];
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}