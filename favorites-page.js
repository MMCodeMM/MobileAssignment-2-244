// 收藏頁面管理器
class FavoritesPageManager {
  constructor() {
    this.favoritesManager = new FavoritesManager();
    this.currentSort = { field: 'addedAt', order: 'desc' };
    this.currentFilter = '';
    this.currentSearch = '';
    
    if (!this.favoritesManager.currentUser) {
      // 如果用戶未登入，重定向到登入頁面
      window.location.href = 'auth.html?action=login';
      return;
    }
    
    this.initializePage();
    this.setupEventListeners();
    this.loadFavorites();
  }

  // 初始化頁面
  initializePage() {
    this.setupImageModal();
    this.updateStats();
    this.populateFilterSelect();
  }

  // 設置事件監聽器
  setupEventListeners() {
    // 搜尋框
    const searchBar = document.getElementById('favorites-search');
    if (searchBar) {
      searchBar.addEventListener('ionInput', (e) => {
        this.currentSearch = e.detail.value || '';
        this.applyFilters();
      });
    }

    // 分類篩選
    const categorySelect = document.getElementById('favorites-category');
    if (categorySelect) {
      categorySelect.addEventListener('ionChange', (e) => {
        this.currentFilter = e.detail.value || '';
        this.updateFilterButtons();
        this.applyFilters();
      });
    }

    // 清除篩選按鈕
    const clearFilterBtn = document.getElementById('clear-favorites-filter');
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
  }

  // 載入並顯示收藏
  loadFavorites() {
    const favorites = this.favoritesManager.getAllFavorites();
    console.log('載入收藏項目:', favorites.length, '個');
    
    this.updateStats();
    this.applyFilters();
  }

  // 應用篩選和搜尋
  applyFilters() {
    let favorites = this.favoritesManager.getAllFavorites();
    
    // 應用搜尋
    if (this.currentSearch) {
      favorites = favorites.filter(item => 
        item.title?.toLowerCase().includes(this.currentSearch.toLowerCase()) ||
        item.level?.toLowerCase().includes(this.currentSearch.toLowerCase()) ||
        item.equipment?.toLowerCase().includes(this.currentSearch.toLowerCase()) ||
        (Array.isArray(item.tags) && item.tags.some(tag => 
          tag.toLowerCase().includes(this.currentSearch.toLowerCase())
        ))
      );
    }

    // 應用分類篩選
    if (this.currentFilter) {
      favorites = favorites.filter(item => 
        (Array.isArray(item.tags) && item.tags.includes(this.currentFilter)) ||
        item.level === this.currentFilter
      );
    }

    // 應用排序
    favorites = this.sortFavorites(favorites);
    
    this.renderFavorites(favorites);
  }

  // 排序收藏項目
  sortFavorites(favorites) {
    return favorites.sort((a, b) => {
      let aValue = a[this.currentSort.field];
      let bValue = b[this.currentSort.field];
      
      if (this.currentSort.field === 'addedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (this.currentSort.field === 'title') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }
      
      if (this.currentSort.order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // 渲染收藏項目
  renderFavorites(favorites) {
    const grid = document.getElementById('favorites-grid');
    const noFavorites = document.getElementById('no-favorites');
    const noSearchResults = document.getElementById('no-search-results');
    
    // 清空網格
    grid.innerHTML = '';
    
    // 判斷顯示狀態
    const hasAnyFavorites = this.favoritesManager.getFavoritesCount() > 0;
    const hasFilteredResults = favorites.length > 0;
    
    if (!hasAnyFavorites) {
      // 完全沒有收藏
      noFavorites.style.display = 'block';
      noSearchResults.style.display = 'none';
      return;
    }
    
    if (!hasFilteredResults) {
      // 有收藏但搜尋/篩選無結果
      noFavorites.style.display = 'none';
      noSearchResults.style.display = 'block';
      return;
    }
    
    // 有結果，隱藏提示訊息
    noFavorites.style.display = 'none';
    noSearchResults.style.display = 'none';
    
    // 渲染項目
    favorites.forEach(item => {
      const card = this.createFavoriteCard(item);
      grid.appendChild(card);
    });
    
    console.log('渲染完成，顯示', favorites.length, '個收藏項目');
  }

  // 創建收藏項目卡片
  createFavoriteCard(item) {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    
    // 處理媒體內容
    let mediaContent = this.createMediaContent(item);
    
    // 處理標籤
    const tagsContent = Array.isArray(item.tags) ? 
      item.tags.map(tag => `<div class="tag-chip">${tag}</div>`).join('') : '';
    
    card.innerHTML = `
      <div class="card-content">
        <div class="card-title">${item.title || "未命名"}</div>
        <div class="card-subtitle">${item.level || ""}</div>
        <div class="card-meta">
          <div class="meta-item">
            <span class="meta-label">所需時間</span>
            <span class="meta-value">${item.timeReq || "-"}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">器材</span>
            <span class="meta-value">${item.equipment || "-"}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">收藏時間</span>
            <span class="meta-value">${new Date(item.addedAt).toLocaleDateString('zh-TW')}</span>
          </div>
        </div>
        <div class="tag-container">${tagsContent}</div>
      </div>
      ${mediaContent}
      <div class="card-actions">
        <button class="favorite-btn favorited" data-item-id="${item.id}" title="取消收藏">
          <i class="fas fa-heart"></i>
        </button>
      </div>
    `;
    
    // 綁定事件
    this.bindCardEvents(card, item);
    
    return card;
  }

  // 創建媒體內容
  createMediaContent(item) {
    if (!item.imageUrl && !item.videoUrl) {
      return `
        <div class="card-media">
          <div class="media-placeholder">
            <i class="fas fa-image"></i>
            <div>無媒體內容</div>
          </div>
        </div>
      `;
    }
    
    let mediaContent = '<div class="card-media">';
    
    // 媒體指示器
    let indicators = [];
    if (item.imageUrl) indicators.push('<i class="fas fa-image"></i> 圖片');
    if (item.videoUrl) {
      if (item.isYouTube) {
        indicators.push('<i class="fab fa-youtube"></i> YouTube');
      } else {
        indicators.push('<i class="fas fa-video"></i> 影片');
      }
    }
    
    if (indicators.length > 0) {
      mediaContent += `
        <div class="media-indicators">
          ${indicators.join(' • ')}
        </div>
      `;
    }
    
    // 圖片區域
    if (item.imageUrl) {
      mediaContent += `
        <div class="media-image-section" data-image-url="${item.imageUrl}" data-title="${item.title || ''}" data-item='${JSON.stringify(item)}'>
          <img src="${item.imageUrl}" 
               alt="${item.title || ''}" 
               class="exercise-img" 
               loading="lazy"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="media-placeholder" style="display:none;">
            <i class="fas fa-image"></i>
            <div>圖片載入失敗</div>
          </div>
        </div>
      `;
    }
    
    // 影片區域
    if (item.videoUrl) {
      mediaContent += '<div class="media-video-section">';
      
      if (item.isYouTube) {
        mediaContent += `
          <iframe class="exercise-youtube" 
                  src="${item.youtubeEmbedUrl}" 
                  title="${item.title || ''}"
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
          </iframe>
          <div class="video-indicator youtube-indicator">
            <i class="fab fa-youtube"></i>
            YouTube
          </div>
        `;
      } else {
        mediaContent += `
          <video class="exercise-video" controls preload="metadata">
            <source src="${item.videoUrl}" type="video/mp4">
            您的瀏覽器不支援影片播放
          </video>
          <div class="video-indicator">
            <i class="fas fa-play-circle"></i>
            影片
          </div>
        `;
      }
      
      mediaContent += '</div>';
    }
    
    mediaContent += '</div>';
    return mediaContent;
  }

  // 綁定卡片事件
  bindCardEvents(card, item) {
    // 標籤點擊事件
    card.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const categorySelect = document.getElementById('favorites-category');
        if (categorySelect) {
          categorySelect.value = chip.textContent;
          this.currentFilter = chip.textContent;
          this.updateFilterButtons();
          this.applyFilters();
        }
      });
    });

    // 圖片點擊事件
    const imageSection = card.querySelector('.media-image-section');
    if (imageSection) {
      imageSection.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const imageUrl = imageSection.getAttribute('data-image-url');
        const title = imageSection.getAttribute('data-title');
        this.openImageModal(imageUrl, title, item);
      });
      
      imageSection.style.cursor = 'pointer';
      imageSection.title = '點擊放大圖片';
    }

    // 收藏按鈕事件
    const favoriteBtn = card.querySelector('.favorite-btn');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 從收藏中移除
        this.favoritesManager.removeFromFavorites(item.id);
        
        // 重新載入收藏
        this.loadFavorites();
      });
    }
  }

  // 更新統計資訊
  updateStats() {
    const stats = this.favoritesManager.getFavoritesStats();
    
    // 更新收藏數量
    document.querySelectorAll('.favorites-count').forEach(element => {
      element.textContent = stats.total;
    });
    
    // 更新本週新增數量
    const recentCountElement = document.getElementById('recent-count');
    if (recentCountElement) {
      recentCountElement.textContent = stats.recentlyAdded.length;
    }
  }

  // 填充篩選選單
  populateFilterSelect() {
    const categorySelect = document.getElementById('favorites-category');
    if (!categorySelect) return;
    
    // 清空選項
    while (categorySelect.firstChild) {
      categorySelect.removeChild(categorySelect.firstChild);
    }
    
    // 添加"全部收藏"選項
    const allOption = document.createElement('ion-select-option');
    allOption.value = '';
    allOption.textContent = '全部收藏';
    categorySelect.appendChild(allOption);
    
    // 獲取所有標籤和等級
    const favorites = this.favoritesManager.getAllFavorites();
    const uniqueOptions = new Set();
    
    favorites.forEach(item => {
      if (item.level) uniqueOptions.add(item.level);
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => uniqueOptions.add(tag));
      }
    });
    
    // 添加選項
    Array.from(uniqueOptions).sort().forEach(option => {
      const optionElement = document.createElement('ion-select-option');
      optionElement.value = option;
      optionElement.textContent = option;
      categorySelect.appendChild(optionElement);
    });
  }

  // 更新篩選按鈕
  updateFilterButtons() {
    const clearFilterBtn = document.getElementById('clear-favorites-filter');
    if (clearFilterBtn) {
      clearFilterBtn.style.display = this.currentFilter ? 'block' : 'none';
    }
  }

  // 清除篩選
  clearFilters() {
    this.currentFilter = '';
    this.currentSearch = '';
    
    const categorySelect = document.getElementById('favorites-category');
    const searchBar = document.getElementById('favorites-search');
    
    if (categorySelect) categorySelect.value = '';
    if (searchBar) searchBar.value = '';
    
    this.updateFilterButtons();
    this.applyFilters();
  }

  // 設置圖片模態框
  setupImageModal() {
    const modalClose = document.getElementById('modal-close');
    const modalBackdrop = document.getElementById('modal-backdrop');
    
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeImageModal());
    }
    
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', () => this.closeImageModal());
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeImageModal();
      }
    });
  }

  // 開啟圖片模態框
  openImageModal(imageUrl, title, itemData) {
    if (!imageUrl) return;
    
    const imageModal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const imageLoading = document.getElementById('image-loading');
    const imageError = document.getElementById('image-error');
    const imageInfo = document.getElementById('image-info');
    
    imageModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    modalTitle.textContent = title || '圖片預覽';
    
    imageLoading.style.display = 'flex';
    imageError.style.display = 'none';
    modalImage.style.display = 'none';
    
    let infoText = `圖片來源: ${imageUrl}`;
    if (itemData) {
      if (itemData.level) infoText += ` | 等級: ${itemData.level}`;
      if (itemData.equipment) infoText += ` | 器材: ${itemData.equipment}`;
      infoText += ` | 收藏時間: ${new Date(itemData.addedAt).toLocaleDateString('zh-TW')}`;
    }
    imageInfo.textContent = infoText;
    
    const img = new Image();
    img.onload = () => {
      modalImage.src = imageUrl;
      modalImage.alt = title || '放大圖片';
      imageLoading.style.display = 'none';
      modalImage.style.display = 'block';
    };
    
    img.onerror = () => {
      imageLoading.style.display = 'none';
      imageError.style.display = 'flex';
    };
    
    img.src = imageUrl;
  }

  // 關閉圖片模態框
  closeImageModal() {
    const imageModal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    
    imageModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    modalImage.src = '';
  }
}

// 頁面控制函數
function showFavoritesMenu() {
  document.getElementById('favorites-menu').style.display = 'flex';
}

function closeFavoritesMenu() {
  document.getElementById('favorites-menu').style.display = 'none';
}

function showFavoritesStats() {
  closeFavoritesMenu();
  
  const statsModal = document.getElementById('stats-modal');
  const statsContent = document.getElementById('stats-content');
  
  if (window.favoritesPageManager) {
    const stats = window.favoritesPageManager.favoritesManager.getFavoritesStats();
    
    let html = `
      <div class="stats-section">
        <h4><i class="fas fa-heart"></i> 總體統計</h4>
        <p><strong>總收藏數:</strong> ${stats.total} 個項目</p>
        <p><strong>本週新增:</strong> ${stats.recentlyAdded.length} 個項目</p>
      </div>
    `;
    
    if (Object.keys(stats.byLevel).length > 0) {
      html += `
        <div class="stats-section">
          <h4><i class="fas fa-layer-group"></i> 按等級分布</h4>
          ${Object.entries(stats.byLevel).map(([level, count]) => 
            `<p><strong>${level}:</strong> ${count} 個</p>`
          ).join('')}
        </div>
      `;
    }
    
    if (Object.keys(stats.byEquipment).length > 0) {
      html += `
        <div class="stats-section">
          <h4><i class="fas fa-dumbbell"></i> 按器材分布</h4>
          ${Object.entries(stats.byEquipment).map(([equipment, count]) => 
            `<p><strong>${equipment}:</strong> ${count} 個</p>`
          ).join('')}
        </div>
      `;
    }
    
    if (Object.keys(stats.byTags).length > 0) {
      html += `
        <div class="stats-section">
          <h4><i class="fas fa-tags"></i> 熱門標籤</h4>
          ${Object.entries(stats.byTags)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([tag, count]) => 
              `<p><strong>${tag}:</strong> ${count} 個</p>`
            ).join('')}
        </div>
      `;
    }
    
    statsContent.innerHTML = html;
  }
  
  statsModal.style.display = 'flex';
}

function closeStatsModal() {
  document.getElementById('stats-modal').style.display = 'none';
}

function exportFavorites() {
  closeFavoritesMenu();
  if (window.favoritesPageManager) {
    window.favoritesPageManager.favoritesManager.exportFavorites();
  }
}

function sortFavorites() {
  closeFavoritesMenu();
  document.getElementById('sort-modal').style.display = 'flex';
}

function closeSortModal() {
  document.getElementById('sort-modal').style.display = 'none';
}

function applySorting(field, order) {
  closeSortModal();
  
  if (window.favoritesPageManager) {
    window.favoritesPageManager.currentSort = { field, order };
    window.favoritesPageManager.applyFilters();
    
    // 顯示排序提示
    const sortNames = {
      'addedAt_desc': '最新收藏',
      'addedAt_asc': '最早收藏',
      'title_asc': '名稱 A-Z',
      'title_desc': '名稱 Z-A',
      'level_asc': '按等級排序'
    };
    
    const sortKey = `${field}_${order}`;
    const sortName = sortNames[sortKey] || '自訂排序';
    
    window.favoritesPageManager.favoritesManager.showToast(`已套用排序: ${sortName}`, 'success');
  }
}

function clearAllFavorites() {
  closeFavoritesMenu();
  
  if (window.favoritesPageManager) {
    const success = window.favoritesPageManager.favoritesManager.clearAllFavorites();
    if (success) {
      window.favoritesPageManager.loadFavorites();
    }
  }
}

function goToHome() {
  window.location.href = 'index.html';
}

// 初始化收藏頁面
document.addEventListener('DOMContentLoaded', () => {
  window.favoritesPageManager = new FavoritesPageManager();
});