// 收藏管理系統
class FavoritesManager {
  constructor() {
    console.log('初始化收藏管理器...');
    this.authSystem = new AuthSystem();
    this.currentUser = this.authSystem.getCurrentUser();
    this.storageKey = 'maxSports_favorites';
    
    console.log('當前用戶:', this.currentUser ? this.currentUser.username : '未登入');
    
    this.favorites = this.loadFavorites();
    
    console.log('收藏管理器初始化完成，收藏數量:', this.favorites.length);
  }

  // 載入用戶收藏
  loadFavorites() {
    if (!this.currentUser) {
      console.log('沒有當前用戶，返回空收藏列表');
      return [];
    }
    
    try {
      const allFavorites = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      const userFavorites = allFavorites[this.currentUser.id] || [];
      console.log(`載入用戶 ${this.currentUser.id} 的收藏:`, userFavorites.length, '個項目');
      console.log('收藏詳情:', userFavorites);
      return userFavorites;
    } catch (error) {
      console.error('載入收藏失敗:', error);
      return [];
    }
  }

  // 保存收藏到本地存儲
  saveFavorites() {
    if (!this.currentUser) return;
    
    try {
      const allFavorites = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      allFavorites[this.currentUser.id] = this.favorites;
      localStorage.setItem(this.storageKey, JSON.stringify(allFavorites));
      
      // 同時更新用戶的收藏統計
      this.currentUser.profile.favoritesCount = this.favorites.length;
      this.authSystem.saveUsers();
      this.authSystem.login(this.currentUser, localStorage.getItem('maxSports_rememberMe') === 'true');
      
      console.log('收藏已保存:', this.favorites.length, '個項目');
    } catch (error) {
      console.error('保存收藏失敗:', error);
    }
  }

  // 檢查項目是否已收藏
  isFavorite(itemId) {
    const result = this.favorites.some(fav => fav.id === itemId);
    console.log(`檢查收藏狀態 - 項目ID: ${itemId}, 結果: ${result}`);
    console.log(`當前收藏列表:`, this.favorites.map(f => f.id));
    return result;
  }

  // 添加到收藏
  addToFavorites(item) {
    if (!this.currentUser) {
      this.showToast('請先登入才能收藏項目', 'warning');
      return false;
    }

    if (this.isFavorite(item.id)) {
      this.showToast('此項目已在收藏清單中', 'warning');
      return false;
    }

    // 創建收藏項目對象
    const favoriteItem = {
      id: item.id,
      title: item.title,
      level: item.level,
      equipment: item.equipment,
      timeReq: item.timeReq,
      tags: item.tags,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      isYouTube: item.isYouTube,
      youtubeEmbedUrl: item.youtubeEmbedUrl,
      addedAt: new Date().toISOString(),
      // 保留原始 API 數據
      image_url: item.image_url,
      video_url: item.video_url
    };

    this.favorites.push(favoriteItem);
    console.log(`添加收藏: ${item.title} (ID: ${item.id})`);
    console.log('收藏後總數:', this.favorites.length);
    
    this.saveFavorites();
    
    this.showToast(`已將「${item.title}」加入收藏`, 'success');
    this.updateFavoriteButtons();
    
    // 如果當前是收藏視圖，觸發重新篩選
    if (window.showingFavoritesOnly && typeof applyFilters === 'function') {
      console.log('在收藏視圖中添加收藏，重新篩選');
      setTimeout(() => applyFilters(), 100);
    }
    
    return true;
  }

  // 從收藏中移除
  removeFromFavorites(itemId) {
    const index = this.favorites.findIndex(fav => fav.id === itemId);
    
    if (index === -1) {
      this.showToast('此項目不在收藏清單中', 'warning');
      return false;
    }

    const removedItem = this.favorites.splice(index, 1)[0];
    console.log(`移除收藏: ${removedItem.title} (ID: ${itemId})`);
    console.log('移除後總數:', this.favorites.length);
    
    this.saveFavorites();
    
    this.showToast(`已將「${removedItem.title}」從收藏中移除`, 'success');
    this.updateFavoriteButtons();
    
    // 如果當前是收藏視圖，觸發重新篩選
    if (window.showingFavoritesOnly && typeof applyFilters === 'function') {
      console.log('在收藏視圖中移除收藏，重新篩選');
      setTimeout(() => applyFilters(), 100);
    }
    
    return true;
  }

  // 切換收藏狀態
  toggleFavorite(item) {
    if (this.isFavorite(item.id)) {
      return this.removeFromFavorites(item.id);
    } else {
      return this.addToFavorites(item);
    }
  }

  // 獲取所有收藏
  getAllFavorites() {
    return [...this.favorites];
  }

  // 獲取收藏數量
  getFavoritesCount() {
    return this.favorites.length;
  }

  // 根據標籤篩選收藏
  getFavoritesByTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return this.getAllFavorites();
    }
    
    return this.favorites.filter(item => 
      Array.isArray(item.tags) && 
      tags.some(tag => item.tags.includes(tag))
    );
  }

  // 搜尋收藏
  searchFavorites(query) {
    if (!query || query.trim() === '') {
      return this.getAllFavorites();
    }
    
    const lowerQuery = query.toLowerCase().trim();
    return this.favorites.filter(item => 
      item.title?.toLowerCase().includes(lowerQuery) ||
      item.level?.toLowerCase().includes(lowerQuery) ||
      item.equipment?.toLowerCase().includes(lowerQuery) ||
      (Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  // 清空所有收藏
  clearAllFavorites() {
    if (this.favorites.length === 0) {
      this.showToast('收藏清單已經是空的', 'warning');
      return false;
    }

    const confirmed = confirm(`確定要清空所有收藏嗎？這將移除 ${this.favorites.length} 個收藏項目，此操作無法復原。`);
    
    if (confirmed) {
      const count = this.favorites.length;
      this.favorites = [];
      this.saveFavorites();
      this.showToast(`已清空 ${count} 個收藏項目`, 'success');
      this.updateFavoriteButtons();
      return true;
    }
    
    return false;
  }

  // 匯出收藏數據
  exportFavorites() {
    if (this.favorites.length === 0) {
      this.showToast('沒有收藏項目可以匯出', 'warning');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        username: this.currentUser.username,
        displayName: this.currentUser.profile.displayName
      },
      favorites: this.favorites,
      count: this.favorites.length
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `MAX運動平台_收藏清單_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    this.showToast(`已匯出 ${this.favorites.length} 個收藏項目`, 'success');
  }

  // 更新所有收藏按鈕的狀態
  updateFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(button => {
      const itemId = button.getAttribute('data-item-id');
      const isFav = this.isFavorite(itemId);
      
      button.classList.toggle('favorited', isFav);
      button.innerHTML = isFav ? 
        '<i class="fas fa-heart"></i>' : 
        '<i class="far fa-heart"></i>';
      button.title = isFav ? '取消收藏' : '加入收藏';
    });

    // 更新收藏數量顯示
    this.updateFavoritesCountDisplay();
  }

  // 更新收藏數量顯示
  updateFavoritesCountDisplay() {
    const countElements = document.querySelectorAll('.favorites-count');
    countElements.forEach(element => {
      element.textContent = this.favorites.length;
      
      // 添加顯示/隱藏邏輯
      if (this.favorites.length > 0) {
        element.style.display = '';
        element.classList.add('show');
        element.classList.remove('empty');
      } else {
        element.classList.remove('show');
        element.classList.add('empty');
        // 延遲隱藏以允許動畫播放完成
        setTimeout(() => {
          if (element.classList.contains('empty')) {
            element.style.display = 'none';
          }
        }, 300);
      }
    });
    
    // 觸發收藏變化事件
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: {
        count: this.favorites.length,
        action: 'update'
      }
    }));
  }

  // 創建收藏按鈕
  createFavoriteButton(item) {
    const isFav = this.isFavorite(item.id);
    const button = document.createElement('button');
    button.className = `favorite-btn ${isFav ? 'favorited' : ''}`;
    button.setAttribute('data-item-id', item.id);
    button.innerHTML = isFav ? 
      '<i class="fas fa-heart"></i>' : 
      '<i class="far fa-heart"></i>';
    button.title = isFav ? '取消收藏' : '加入收藏';
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleFavorite(item);
    });
    
    return button;
  }

  // 顯示提示訊息
  showToast(message, type = 'success') {
    // 檢查是否有 toast 容器
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.cssText = `
      padding: 12px 20px;
      margin-bottom: 8px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      pointer-events: auto;
      animation: slideInRight 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      max-width: 300px;
      word-break: break-word;
    `;
    
    // 根據類型設置背景色
    const colors = {
      success: 'linear-gradient(135deg, #2dd36f 0%, #37d399 100%)',
      error: 'linear-gradient(135deg, #eb445a 0%, #f25454 100%)',
      warning: 'linear-gradient(135deg, #ffc409 0%, #ffca2c 100%)'
    };
    
    toast.style.background = colors[type] || colors.success;
    if (type === 'warning') {
      toast.style.color = '#333';
    }
    
    toast.textContent = message;
    container.appendChild(toast);

    // 自動移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 4000);
  }

  // 獲取收藏統計信息
  getFavoritesStats() {
    const stats = {
      total: this.favorites.length,
      byLevel: {},
      byEquipment: {},
      byTags: {},
      recentlyAdded: []
    };

    this.favorites.forEach(item => {
      // 按等級統計
      if (item.level) {
        stats.byLevel[item.level] = (stats.byLevel[item.level] || 0) + 1;
      }

      // 按器材統計
      if (item.equipment) {
        stats.byEquipment[item.equipment] = (stats.byEquipment[item.equipment] || 0) + 1;
      }

      // 按標籤統計
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          stats.byTags[tag] = (stats.byTags[tag] || 0) + 1;
        });
      }

      // 最近添加的項目（7天內）
      const addedDate = new Date(item.addedAt);
      const daysDiff = (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 7) {
        stats.recentlyAdded.push(item);
      }
    });

    // 排序最近添加的項目
    stats.recentlyAdded.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    return stats;
  }
}

// CSS 動畫
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  .favorite-btn {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    position: relative;
  }

  .favorite-btn i {
    font-size: 18px;
    color: #ccc;
    transition: all 0.2s ease;
  }

  .favorite-btn:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: scale(1.1);
  }

  .favorite-btn:hover i {
    color: #e74c3c;
  }

  .favorite-btn.favorited i {
    color: #e74c3c;
    animation: heartBeat 0.6s ease-in-out;
  }

  @keyframes heartBeat {
    0% { transform: scale(1); }
    25% { transform: scale(1.2); }
    50% { transform: scale(1); }
    75% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .card-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 2;
  }

  .exercise-card:hover .card-actions {
    opacity: 1;
  }

  .favorites-count {
    font-weight: bold;
    color: #e74c3c;
  }
`;

document.head.appendChild(style);

// 全域收藏管理器實例
window.favoritesManager = null;

// 初始化收藏管理器
document.addEventListener('DOMContentLoaded', () => {
  // 檢查用戶是否已登入
  const authSystem = new AuthSystem();
  if (authSystem.isLoggedIn()) {
    window.favoritesManager = new FavoritesManager();
    console.log('收藏管理器已初始化');
  }
});