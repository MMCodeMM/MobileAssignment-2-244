import type {
  Exercise,
  ApiResponse,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  BookmarkResponse,
  BookmarkListResponse,
  QueryParams,
  ErrorResponse
} from './types.js';

/**
 * API 服務類別，負責與後端 API 通信
 */
export class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'https://dae-mobile-assignment.hkit.cc/api') {
    this.baseUrl = baseUrl;
    // 從 localStorage 載入 token
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * 設定認證 token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * 取得認證 token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * 建立 HTTP 請求的 headers
   */
  private getHeaders(includeAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 處理 API 回應
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(errorData.error);
    }
    return response.json();
  }

  /**
   * 建構查詢字串
   */
  private buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * 取得運動教學清單
   */
  async getExercises(params: QueryParams = {}): Promise<ApiResponse<Exercise>> {
    const queryString = this.buildQueryString(params);
    const response = await fetch(`${this.baseUrl}/exercises${queryString}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    return this.handleResponse<ApiResponse<Exercise>>(response);
  }

  /**
   * 使用者註冊
   */
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    });

    const result = await this.handleResponse<AuthResponse>(response);
    this.setToken(result.token);
    return result;
  }

  /**
   * 使用者登入
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials)
    });

    const result = await this.handleResponse<AuthResponse>(response);
    this.setToken(result.token);
    return result;
  }

  /**
   * 檢查登入狀態
   */
  async checkAuth(): Promise<{ user_id: number | null }> {
    if (!this.token) {
      return { user_id: null };
    }

    const response = await fetch(`${this.baseUrl}/auth/check`, {
      method: 'GET',
      headers: this.getHeaders(true)
    });

    return this.handleResponse<{ user_id: number | null }>(response);
  }

  /**
   * 登出
   */
  logout(): void {
    this.setToken(null);
  }

  /**
   * 收藏項目
   */
  async bookmarkItem(itemId: number): Promise<BookmarkResponse> {
    const response = await fetch(`${this.baseUrl}/bookmarks/${itemId}`, {
      method: 'POST',
      headers: this.getHeaders(true)
    });

    return this.handleResponse<BookmarkResponse>(response);
  }

  /**
   * 取消收藏項目
   */
  async unbookmarkItem(itemId: number): Promise<BookmarkResponse> {
    const response = await fetch(`${this.baseUrl}/bookmarks/${itemId}`, {
      method: 'DELETE',
      headers: this.getHeaders(true)
    });

    return this.handleResponse<BookmarkResponse>(response);
  }

  /**
   * 取得收藏清單
   */
  async getBookmarks(): Promise<BookmarkListResponse> {
    const response = await fetch(`${this.baseUrl}/bookmarks`, {
      method: 'GET',
      headers: this.getHeaders(true)
    });

    return this.handleResponse<BookmarkListResponse>(response);
  }
}