/**
 * 運動教學應用 API 服務
 * 基於現有的 fetchDataWithAuth 函數擴展完整的後端整合功能
 */

class ExerciseApiService {
  constructor() {
    this.baseUrl = "https://dae-mobile-assignment.hkit.cc/api";
    this.token = localStorage.getItem('authToken') || null;
    this.currentUser = null;
    this.favorites = new Set();
  }

  /**
   * 設置認證 token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
      this.currentUser = null;
      this.favorites.clear();
    }
  }

  /**
   * 獲取認證標頭
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * 通用 API 請求方法
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token 過期或無效，清除本地認證狀態
          this.setToken(null);
          throw new Error('認證已過期，請重新登入');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `請求失敗 (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error('API 請求失敗:', error);
      throw error;
    }
  }

  /**
   * 用戶認證 - 登入
   */
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (response.token) {
      this.setToken(response.token);
      this.currentUser = response.user || { username };
      await this.loadUserFavorites();
    }

    return response;
  }

  /**
   * 用戶認證 - 註冊
   */
  async register(userData) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * 用戶認證 - 登出
   */
  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('登出 API 調用失敗:', error);
    } finally {
      this.setToken(null);
    }
  }

  /**
   * 獲取用戶資料
   */
  async getUserProfile() {
    if (!this.token) {
      throw new Error('未登入');
    }
    
    const user = await this.request('/auth/profile');
    this.currentUser = user;
    return user;
  }

  /**
   * 載入運動教學資料 (基於原有的 fetchDataWithAuth)
   */
  async getExercises(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/exercises?${queryString}` : '/exercises';
      
      const response = await this.request(endpoint);
      
      // 如果 API 返回 item_ids，則需要進一步處理
      if (response.item_ids) {
        console.log('獲取到運動項目 IDs:', response.item_ids);
        return response;
      }
      
      return response;
    } catch (error) {
      console.error('載入運動教學資料失敗:', error);
      throw error;
    }
  }

  /**
   * 搜尋運動教學
   */
  async searchExercises(query, filters = {}) {
    const params = { q: query, ...filters };
    return await this.getExercises(params);
  }

  /**
   * 載入用戶收藏
   */
  async loadUserFavorites() {
    if (!this.token) {
      this.favorites.clear();
      return [];
    }

    try {
      const response = await this.request('/favorites');
      const favoritesList = response.favorites || response;
      
      this.favorites.clear();
      favoritesList.forEach(item => {
        this.favorites.add(item.exercise_id || item.id);
      });
      
      return favoritesList;
    } catch (error) {
      console.error('載入收藏失敗:', error);
      return [];
    }
  }

  /**
   * 添加收藏
   */
  async addFavorite(exerciseId) {
    if (!this.token) {
      throw new Error('請先登入');
    }

    await this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ exercise_id: exerciseId })
    });

    this.favorites.add(exerciseId);
  }

  /**
   * 移除收藏
   */
  async removeFavorite(exerciseId) {
    if (!this.token) {
      throw new Error('請先登入');
    }

    await this.request(`/favorites/${exerciseId}`, {
      method: 'DELETE'
    });

    this.favorites.delete(exerciseId);
  }

  /**
   * 檢查是否已收藏
   */
  isFavorite(exerciseId) {
    return this.favorites.has(exerciseId);
  }

  /**
   * 獲取收藏列表
   */
  getFavoriteIds() {
    return Array.from(this.favorites);
  }

  /**
   * 檢查是否已登入
   */
  isLoggedIn() {
    return !!this.token && !!this.currentUser;
  }

  /**
   * 獲取當前用戶
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * 初始化用戶狀態
   */
  async initializeUserState() {
    if (this.token) {
      try {
        await this.getUserProfile();
        await this.loadUserFavorites();
        return true;
      } catch (error) {
        console.error('初始化用戶狀態失敗:', error);
        this.setToken(null);
        return false;
      }
    }
    return false;
  }
}

// 創建全局實例
window.exerciseApi = new ExerciseApiService();

export default ExerciseApiService;