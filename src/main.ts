import { ApiService } from './api.js';
import type { Exercise, AppState, QueryParams, User } from './types.js';

/**
 * 主要應用程式類別
 */
class ExerciseApp {
  private api: ApiService;
  private state: AppState;
  
  // DOM 元素
  private elements: {
    // 認證相關
    authModal: any;
    authModalTitle: HTMLElement;
    usernameInput: any;
    passwordInput: any;
    loginBtn: HTMLElement;
    signupBtn: HTMLElement;
    authError: HTMLDivElement;
    closeAuthModal: HTMLElement;
    userInfo: HTMLDivElement;
    usernameDisplay: HTMLSpanElement;
    logoutBtn: HTMLElement;
    authTrigger: HTMLElement;
    
    // 搜尋和篩選
    searchBar: any;
    categorySelect: any;
    sortSelect: any;
    showBookmarksBtn: HTMLElement;
    resetFiltersBtn: HTMLElement;
    
    // 清單和載入
    exercisesList: HTMLElement;
    exerciseTemplate: HTMLElement;
    loadingIndicator: HTMLDivElement;
    errorMessage: HTMLDivElement;
    errorText: HTMLParagraphElement;
    retryBtn: HTMLElement;
    loadMoreBtn: HTMLElement;
    loadMoreLoading: HTMLDivElement;
    noDataMessage: HTMLDivElement;
  };

  constructor() {
    this.api = new ApiService();
    this.initializeState();
    this.initializeElements();
    this.attachEventListeners();
    this.initialize();
  }

  private initializeState(): void {
    this.state = {
      user: null,
      token: this.api.getToken(),
      isLoading: false,
      exercises: [],
      bookmarks: [],
      currentPage: 1,
      totalPages: 1,
      hasMore: false
    };
  }

  private initializeElements(): void {
    this.elements = {
      // 認證相關
      authModal: document.getElementById('auth-modal'),
      authModalTitle: document.getElementById('auth-modal-title') as HTMLElement,
      usernameInput: document.getElementById('username-input'),
      passwordInput: document.getElementById('password-input'),
      loginBtn: document.getElementById('login-btn') as HTMLElement,
      signupBtn: document.getElementById('signup-btn') as HTMLElement,
      authError: document.getElementById('auth-error') as HTMLDivElement,
      closeAuthModal: document.getElementById('close-auth-modal') as HTMLElement,
      userInfo: document.getElementById('user-info') as HTMLDivElement,
      usernameDisplay: document.getElementById('username-display') as HTMLSpanElement,
      logoutBtn: document.getElementById('logout-btn') as HTMLElement,
      authTrigger: document.getElementById('auth-trigger') as HTMLElement,
      
      // 搜尋和篩選
      searchBar: document.getElementById('search-bar'),
      categorySelect: document.getElementById('category-select'),
      sortSelect: document.getElementById('sort-select'),
      showBookmarksBtn: document.getElementById('show-bookmarks-btn') as HTMLElement,
      resetFiltersBtn: document.getElementById('reset-filters-btn') as HTMLElement,
      
      // 清單和載入
      exercisesList: document.getElementById('exercises-list') as HTMLElement,
      exerciseTemplate: document.querySelector('.exercise-template') as HTMLElement,
      loadingIndicator: document.getElementById('loading-indicator') as HTMLDivElement,
      errorMessage: document.getElementById('error-message') as HTMLDivElement,
      errorText: document.getElementById('error-text') as HTMLParagraphElement,
      retryBtn: document.getElementById('retry-btn') as HTMLElement,
      loadMoreBtn: document.getElementById('load-more-btn') as HTMLElement,
      loadMoreLoading: document.getElementById('load-more-loading') as HTMLDivElement,
      noDataMessage: document.getElementById('no-data-message') as HTMLDivElement,
    };
  }

  private attachEventListeners(): void {
    // 認證事件
    this.elements.loginBtn.addEventListener('click', () => this.handleLogin());
    this.elements.signupBtn.addEventListener('click', () => this.handleSignup());
    this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
    this.elements.closeAuthModal.addEventListener('click', () => this.closeAuthModal());
    this.elements.authTrigger.addEventListener('click', () => this.openAuthModal());

    // 搜尋和篩選事件
    this.elements.searchBar.addEventListener('ionInput', () => this.handleSearch());
    this.elements.categorySelect.addEventListener('ionChange', () => this.handleCategoryChange());
    this.elements.sortSelect.addEventListener('ionChange', () => this.handleSortChange());
    this.elements.showBookmarksBtn.addEventListener('click', () => this.toggleBookmarksView());
    this.elements.resetFiltersBtn.addEventListener('click', () => this.resetFilters());

    // 載入更多事件
    this.elements.loadMoreBtn.addEventListener('click', () => this.loadMoreExercises());
    this.elements.retryBtn.addEventListener('click', () => this.initialize());

    // Enter 鍵支持
    this.elements.usernameInput.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.handleLogin();
    });
    this.elements.passwordInput.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.handleLogin();
    });
  }

  private async initialize(): Promise<void> {
    try {
      this.showLoading(true);
      
      // 檢查用戶登入狀態
      if (this.state.token) {
        await this.checkAuthStatus();
      }
      
      // 載入初始資料
      await this.loadExercises(true);
      
    } catch (error) {
      this.showError(`初始化失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this.showLoading(false);
    }
  }

  private async checkAuthStatus(): Promise<void> {
    try {
      const response = await this.api.checkAuth();
      if (response.user_id) {
        this.state.user = { user_id: response.user_id, username: '' };
        await this.loadBookmarks();
        this.updateAuthUI();
      } else {
        this.handleLogout();
      }
    } catch (error) {
      console.warn('檢查認證狀態失敗:', error);
      this.handleLogout();
    }
  }

  private async loadBookmarks(): Promise<void> {
    if (!this.state.user) return;
    
    try {
      const response = await this.api.getBookmarks();
      this.state.bookmarks = response.item_ids;
    } catch (error) {
      console.warn('載入收藏清單失敗:', error);
    }
  }

  private async loadExercises(reset: boolean = false): Promise<void> {
    try {
      if (reset) {
        this.state.currentPage = 1;
        this.state.exercises = [];
      }

      const params = this.buildQueryParams();
      const response = await this.api.getExercises(params);
      
      if (reset) {
        this.state.exercises = response.items;
      } else {
        this.state.exercises.push(...response.items);
      }
      
      this.state.currentPage = response.pagination.page;
      this.state.totalPages = Math.ceil(response.pagination.total / response.pagination.limit);
      this.state.hasMore = this.state.currentPage < this.state.totalPages;
      
      this.renderExercises();
      this.updateLoadMoreButton();
      this.populateCategoryOptions(response.items);
      
    } catch (error) {
      throw new Error(`載入運動教學失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  private async loadMoreExercises(): Promise<void> {
    if (!this.state.hasMore || this.state.isLoading) return;
    
    try {
      this.showLoadMoreLoading(true);
      this.state.currentPage++;
      await this.loadExercises(false);
    } catch (error) {
      this.state.currentPage--; // 復原頁碼
      this.showError(`載入更多資料失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      this.showLoadMoreLoading(false);
    }
  }

  private buildQueryParams(): QueryParams {
    const params: QueryParams = {
      page: this.state.currentPage,
      limit: 5
    };

    const searchValue = this.elements.searchBar.value;
    if (searchValue?.trim()) {
      params.search = searchValue.trim();
    }

    const categoryValue = this.elements.categorySelect.value;
    if (categoryValue) {
      params.category = categoryValue as string;
    }

    const sortValue = this.elements.sortSelect.value;
    if (sortValue) {
      params.sort = sortValue as string;
      params.order = 'asc';
    }

    return params;
  }

  private renderExercises(): void {
    // 清空清單但保留模板
    const items = this.elements.exercisesList.querySelectorAll('.list-item:not(.exercise-template)');
    items.forEach(item => item.remove());

    if (this.state.exercises.length === 0) {
      this.elements.noDataMessage.style.display = 'block';
      return;
    }

    this.elements.noDataMessage.style.display = 'none';

    for (const exercise of this.state.exercises) {
      const itemElement = this.createExerciseElement(exercise);
      this.elements.exercisesList.appendChild(itemElement);
    }
  }

  private createExerciseElement(exercise: Exercise): HTMLElement {
    const item = this.elements.exerciseTemplate.cloneNode(true) as HTMLElement;
    item.style.display = 'block';
    item.classList.remove('exercise-template');

    // 設定內容
    const titleElement = item.querySelector('.item-title') as HTMLDivElement;
    const subtitleElement = item.querySelector('.item-subtitle') as HTMLDivElement;
    const categoryElement = item.querySelector('.item-category') as HTMLDivElement;
    const durationElement = item.querySelector('.item-duration') as HTMLDivElement;
    const equipmentElement = item.querySelector('.item-equipment') as HTMLDivElement;
    const descriptionElement = item.querySelector('.item-description') as HTMLDivElement;
    const imageElement = item.querySelector('.item-image') as HTMLImageElement;
    const videoElement = item.querySelector('.item-video') as HTMLVideoElement;
    const bookmarkBtn = item.querySelector('.bookmark-btn') as HTMLElement;
    const bookmarkIcon = bookmarkBtn.querySelector('ion-icon') as HTMLElement;

    titleElement.textContent = exercise.title;
    subtitleElement.textContent = exercise.level || '未分級';
    categoryElement.textContent = `分類: ${exercise.category}`;
    durationElement.textContent = exercise.duration ? `時長: ${exercise.duration}` : '';
    equipmentElement.textContent = exercise.equipment ? `器材: ${exercise.equipment}` : '';
    descriptionElement.textContent = exercise.description;

    // 設定圖片
    if (exercise.imageUrl) {
      imageElement.src = exercise.imageUrl;
      imageElement.style.display = 'block';
    } else {
      imageElement.style.display = 'none';
    }

    // 設定影片
    if (exercise.videoUrl) {
      videoElement.src = exercise.videoUrl;
      videoElement.style.display = 'block';
    } else {
      videoElement.style.display = 'none';
    }

    // 設定收藏狀態
    const isBookmarked = this.state.bookmarks.includes(exercise.id);
    if (isBookmarked) {
      bookmarkBtn.classList.add('bookmarked');
      bookmarkIcon.setAttribute('name', 'bookmark');
    } else {
      bookmarkBtn.classList.remove('bookmarked');
      bookmarkIcon.setAttribute('name', 'bookmark-outline');
    }

    // 收藏按鈕事件
    bookmarkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleBookmark(exercise.id, bookmarkBtn, bookmarkIcon);
    });

    return item;
  }

  private async toggleBookmark(exerciseId: number, btnElement: HTMLElement, iconElement: HTMLElement): Promise<void> {
    if (!this.state.user) {
      this.openAuthModal();
      return;
    }

    const isBookmarked = this.state.bookmarks.includes(exerciseId);
    
    try {
      if (isBookmarked) {
        await this.api.unbookmarkItem(exerciseId);
        this.state.bookmarks = this.state.bookmarks.filter(id => id !== exerciseId);
        btnElement.classList.remove('bookmarked');
        iconElement.setAttribute('name', 'bookmark-outline');
      } else {
        await this.api.bookmarkItem(exerciseId);
        this.state.bookmarks.push(exerciseId);
        btnElement.classList.add('bookmarked');
        iconElement.setAttribute('name', 'bookmark');
      }
    } catch (error) {
      this.showError(`收藏操作失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  private populateCategoryOptions(exercises: Exercise[]): void {
    // 收集所有分類
    const categories = new Set<string>();
    exercises.forEach(exercise => {
      if (exercise.category) {
        categories.add(exercise.category);
      }
    });

    // 清空並重新填入選項
    const existingOptions = this.elements.categorySelect.querySelectorAll('ion-select-option:not([value=""])');
    existingOptions.forEach((option: HTMLElement) => option.remove());

    categories.forEach(category => {
      const option = document.createElement('ion-select-option');
      option.value = category;
      option.textContent = category;
      this.elements.categorySelect.appendChild(option);
    });
  }

  // 認證相關方法
  private openAuthModal(): void {
    this.clearAuthForm();
    if (this.elements.authModal.present) {
      this.elements.authModal.present();
    }
  }

  private closeAuthModal(): void {
    if (this.elements.authModal.dismiss) {
      this.elements.authModal.dismiss();
    }
  }

  private clearAuthForm(): void {
    this.elements.usernameInput.value = '';
    this.elements.passwordInput.value = '';
    this.elements.authError.style.display = 'none';
  }

  private async handleLogin(): Promise<void> {
    const username = this.elements.usernameInput.value as string;
    const password = this.elements.passwordInput.value as string;

    if (!username?.trim() || !password?.trim()) {
      this.showAuthError('請輸入使用者名稱和密碼');
      return;
    }

    try {
      const response = await this.api.login({ username: username.trim(), password });
      this.state.user = { user_id: response.user_id, username: username.trim() };
      this.state.token = response.token;
      
      await this.loadBookmarks();
      this.updateAuthUI();
      this.closeAuthModal();
      this.renderExercises(); // 重新渲染以更新收藏狀態
      
    } catch (error) {
      this.showAuthError(`登入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  private async handleSignup(): Promise<void> {
    const username = this.elements.usernameInput.value as string;
    const password = this.elements.passwordInput.value as string;

    if (!username?.trim() || !password?.trim()) {
      this.showAuthError('請輸入使用者名稱和密碼');
      return;
    }

    try {
      const response = await this.api.signup({ username: username.trim(), password });
      this.state.user = { user_id: response.user_id, username: username.trim() };
      this.state.token = response.token;
      
      this.updateAuthUI();
      this.closeAuthModal();
      
    } catch (error) {
      this.showAuthError(`註冊失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  private handleLogout(): void {
    this.api.logout();
    this.state.user = null;
    this.state.token = null;
    this.state.bookmarks = [];
    this.updateAuthUI();
    this.renderExercises(); // 重新渲染以更新收藏狀態
  }

  private updateAuthUI(): void {
    if (this.state.user) {
      this.elements.userInfo.style.display = 'flex';
      this.elements.usernameDisplay.textContent = this.state.user.username;
      this.elements.authTrigger.style.display = 'none';
    } else {
      this.elements.userInfo.style.display = 'none';
      this.elements.authTrigger.style.display = 'block';
    }
  }

  private showAuthError(message: string): void {
    this.elements.authError.textContent = message;
    this.elements.authError.style.display = 'block';
  }

  // 搜尋和篩選方法
  private async handleSearch(): Promise<void> {
    this.state.currentPage = 1;
    await this.loadExercises(true);
  }

  private async handleCategoryChange(): Promise<void> {
    this.state.currentPage = 1;
    await this.loadExercises(true);
  }

  private async handleSortChange(): Promise<void> {
    this.state.currentPage = 1;
    await this.loadExercises(true);
  }

  private async toggleBookmarksView(): Promise<void> {
    if (!this.state.user) {
      this.openAuthModal();
      return;
    }

    // 切換顯示收藏項目的邏輯
    const bookmarkedExercises = this.state.exercises.filter(exercise => 
      this.state.bookmarks.includes(exercise.id)
    );

    if (bookmarkedExercises.length === 0) {
      this.showError('您還沒有收藏任何運動教學');
      return;
    }

    // 暫時顯示收藏的項目
    const originalExercises = [...this.state.exercises];
    this.state.exercises = bookmarkedExercises;
    this.renderExercises();
    
    // 3秒後恢復原始清單
    setTimeout(() => {
      this.state.exercises = originalExercises;
      this.renderExercises();
    }, 3000);
  }

  private async resetFilters(): Promise<void> {
    this.elements.searchBar.value = '';
    this.elements.categorySelect.value = '';
    this.elements.sortSelect.value = '';
    
    this.state.currentPage = 1;
    await this.loadExercises(true);
  }

  // UI 狀態管理方法
  private showLoading(show: boolean): void {
    this.state.isLoading = show;
    this.elements.loadingIndicator.style.display = show ? 'block' : 'none';
    this.elements.errorMessage.style.display = 'none';
  }

  private showLoadMoreLoading(show: boolean): void {
    this.elements.loadMoreLoading.style.display = show ? 'block' : 'none';
  }

  private updateLoadMoreButton(): void {
    this.elements.loadMoreBtn.style.display = this.state.hasMore ? 'block' : 'none';
  }

  private showError(message: string): void {
    this.elements.errorText.textContent = message;
    this.elements.errorMessage.style.display = 'block';
    this.elements.loadingIndicator.style.display = 'none';
    
    // 3秒後自動隱藏錯誤訊息
    setTimeout(() => {
      this.elements.errorMessage.style.display = 'none';
    }, 3000);
  }
}

// 當 DOM 準備就緒時啟動應用程式
document.addEventListener('DOMContentLoaded', () => {
  new ExerciseApp();
});