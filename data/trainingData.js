// 运动项目数据（不使用本地数据作为后备）
const importedItems = [];

document.addEventListener("DOMContentLoaded", () => {
  // 使用可变的 originalItems 以便从 API 注入数据
  let originalItems = [];

  // DOM 元素
  const grid = document.getElementById("exercise-grid");
  const searchbar = document.getElementById("search-bar");
  const categorySelect = document.getElementById("category-select");
  const resetBtn = document.getElementById("reset-category");
  const noResultsElement = document.getElementById("no-results");
  const totalCountElement = document.getElementById("total-count");
  const filterCountElement = document.getElementById("filter-count");
  const activeFilterElement = document.getElementById("active-filter");
  const clearFilterBtn = document.getElementById("clear-filter");

  // 初始狀態
  totalCountElement.textContent = "0";
  filterCountElement.textContent = "0";
  noResultsElement.style.display = "none";
  clearFilterBtn.style.display = "none";

  // UI helpers
  function showLoading() {
    grid.innerHTML = `<div class="item-content" style="text-align:center;padding:1rem;">載入中…</div>`;
  }

  function showError(message) {
    const msg = message || "讀取資料失敗，請稍後再試。";
    grid.innerHTML = `
      <div class="item-content" style="text-align:center;padding:1rem;">
        <div style="margin-bottom:0.75rem;color:#c33;">${msg}</div>
        <ion-button id="retry-btn" color="primary">重新載入</ion-button>
      </div>
    `;
    // 綁定重新載入
    const retry = document.getElementById("retry-btn");
    if (retry) retry.addEventListener("click", () => {
      init(true);
    });
  }

  function setCounts(total, filtered) {
    totalCountElement.textContent = String(total);
    filterCountElement.textContent = String(filtered);
  }

  function getUniqueTags() {
    const set = new Set();
    for (const it of originalItems) {
      if (Array.isArray(it.tags)) for (const t of it.tags) set.add(t);
    }
    return Array.from(set);
  }

  function populateCategorySelect() {
    // 先清空，避免重複選項
    while (categorySelect.firstChild) categorySelect.removeChild(categorySelect.firstChild);
    
    // 首先添加"全部"選項
    const allOption = document.createElement("ion-select-option");
    allOption.value = "";
    allOption.textContent = "全部";
    categorySelect.appendChild(allOption);
    
    // 然後添加唯一的標籤選項
    const unique = getUniqueTags();
    unique.forEach(tag => {
      const el = document.createElement("ion-select-option");
      el.value = tag;
      el.textContent = tag;
      categorySelect.appendChild(el);
    });
    
    // 重設選擇器的值為"全部"
    categorySelect.value = "";
  }

  // 處理URL，確保是完整的URL
  function processMediaUrl(url, baseUrl = "https://dae-mobile-assignment.hkit.cc") {
    if (!url) return null;
    
    // 如果是完整URL，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 如果是相對路徑，加上base URL
    if (url.startsWith('/')) {
      return baseUrl + url;
    }
    
    // 如果沒有開頭斜線，也加上
    return baseUrl + '/' + url;
  }

  // 處理YouTube URL，轉換為嵌入格式
  function processYouTubeUrl(url) {
    if (!url) return null;
    
    // 檢查是否為YouTube URL
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      const videoId = match[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  }

  // 檢查是否為YouTube URL
  function isYouTubeUrl(url) {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  // 測試圖片URL是否可訪問
  async function testImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      console.error("圖片URL測試失敗:", url, err);
      return false;
    }
  }

  async function renderGrid(filteredItems) {
    grid.innerHTML = "";

    if (!Array.isArray(filteredItems)) filteredItems = [];

    if (filteredItems.length === 0) {
      noResultsElement.style.display = "block";
    } else {
      noResultsElement.style.display = "none";
    }

    setCounts(originalItems.length, filteredItems.length);

    for (const item of filteredItems) {
      const card = document.createElement("div");
      card.className = "exercise-card";

      // 改善媒體內容處理
      let mediaContent = "";
      console.log("處理項目:", item.title, "圖片:", item.imageUrl, "影片:", item.videoUrl, "YouTube:", item.isYouTube);
      
      if (item?.imageUrl || item?.videoUrl) {
        mediaContent = `<div class="card-media">`;
        
        if (item.videoUrl) {
          if (item.isYouTube) {
            // YouTube影片使用iframe嵌入
            console.log("渲染YouTube影片:", item.youtubeEmbedUrl);
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
            // 普通影片使用video標籤
            console.log("渲染普通影片:", item.videoUrl);
            mediaContent += `
              <video class="exercise-video" controls preload="metadata" poster="${item.imageUrl || ''}">
                <source src="${item.videoUrl}" type="video/mp4">
                您的瀏覽器不支援影片播放
              </video>
              <div class="video-indicator">
                <i class="fas fa-play-circle"></i>
                影片
              </div>
            `;
          }
        } else if (item.imageUrl) {
          // 只有圖片時顯示圖片
          console.log("渲染圖片:", item.imageUrl);
          mediaContent += `
            <img src="${item.imageUrl}" 
                 alt="${item.title || ''}" 
                 class="exercise-img" 
                 loading="lazy"
                 onload="console.log('圖片載入成功:', this.src)"
                 onerror="console.error('圖片載入失敗:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="media-placeholder" style="display:none;">
              <i class="fas fa-image"></i>
              <div>圖片載入失敗</div>
            </div>
          `;
        }
        
        mediaContent += `</div>`;
      } else {
        // 沒有媒體內容時的預設顯示
        console.log("無媒體內容項目:", item.title);
        mediaContent = `
          <div class="card-media">
            <div class="media-placeholder">
              <i class="fas fa-image"></i>
              <div>無媒體內容</div>
            </div>
          </div>
        `;
      }

      const tagsContent = Array.isArray(item?.tags)
        ? item.tags.map(tag => `<div class="tag-chip">${tag}</div>`).join("")
        : "";

      card.innerHTML = `
        <div class="card-content">
          <div class="card-title">${item?.title || "未命名"}</div>
          <div class="card-subtitle">${item?.level || ""}</div>
          <div class="card-meta">
            <div class="meta-item"><span class="meta-label">所需時間</span><span class="meta-value">${item?.timeReq || "-"}</span></div>
            <div class="meta-item"><span class="meta-label">器材</span><span class="meta-value">${item?.equipment || "-"}</span></div>
          </div>
          <div class="tag-container">${tagsContent}</div>
        </div>
        ${mediaContent}
      `;

      // 綁定標籤點擊事件
      card.querySelectorAll(".tag-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          const categorySelect = document.getElementById("category-select");
          if (categorySelect) {
            categorySelect.value = chip.textContent;
            applyFilters();
          }
        });
      });

      grid.appendChild(card);
    }
    
    console.log("渲染完成，顯示", filteredItems.length, "個項目");
  }

  function applyFilters() {
    // 重新獲取DOM元素，確保引用正確
    const searchbar = document.getElementById("search-bar");
    const categorySelect = document.getElementById("category-select");
    
    const q = (searchbar?.value || "").toLowerCase().trim();
    const cat = categorySelect?.value || "";

    console.log("套用篩選 - 搜尋詞:", q, "分類:", cat);

    const filtered = (originalItems || []).filter(it => {
      const matchesSearch =
        !q ||
        it.title?.toLowerCase().includes(q) ||
        it.level?.toLowerCase().includes(q) ||
        it.equipment?.toLowerCase().includes(q) ||
        it.tags?.some(tag => tag.toLowerCase().includes(q));

      const matchesCategory = !cat || it.tags?.includes(cat) || it.level === cat;

      return matchesSearch && matchesCategory;
    });

    // 更新篩選指示器
    if (cat) {
      activeFilterElement.textContent = cat;
      activeFilterElement.style.display = "inline-flex";
      clearFilterBtn.style.display = "inline";
    } else {
      activeFilterElement.textContent = "全部";
      activeFilterElement.style.display = "inline-flex";
      clearFilterBtn.style.display = "none";
    }

    // 如果有搜尋詞，也顯示在介面上
    if (q) {
      console.log(`正在搜尋: "${q}"`);
    }

    console.log("篩選結果:", filtered.length, "筆，總數:", originalItems.length);
    renderGrid(filtered);
  }

  function setupEventListeners() {
    // 搜尋框事件
    const searchbar = document.getElementById("search-bar");
    if (searchbar) {
      // 移除舊的事件監聽器
      searchbar.removeEventListener("ionInput", applyFilters);
      // 添加新的事件監聽器
      searchbar.addEventListener("ionInput", (e) => {
        console.log("搜尋輸入:", e.detail.value);
        applyFilters();
      });
    }
    
    // 分類選擇器事件
    if (categorySelect) {
      // 移除舊的事件監聽器
      categorySelect.removeEventListener("ionChange", applyFilters);
      // 添加新的事件監聽器
      categorySelect.addEventListener("ionChange", (e) => {
        console.log("分類變更:", e.detail.value);
        applyFilters();
      });
    }
    
    // 重設按鈕事件
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        console.log("重設篩選");
        // 重設所有篩選條件
        categorySelect.value = "";
        const searchbar = document.getElementById("search-bar");
        if (searchbar) searchbar.value = "";
        
        // 顯示重設提示
        const toast = document.createElement('div');
        toast.textContent = '已重設所有篩選條件';
        toast.style.cssText = `
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
          background: #4CAF50; color: white; padding: 10px 20px;
          border-radius: 4px; z-index: 1000; font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 2000);
        
        applyFilters();
      });
    }
    
    // 清除分類按鈕事件
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener("click", e => {
        e.stopPropagation();
        console.log("清除分類篩選");
        categorySelect.value = "";
        applyFilters();
      });
    }
    
    console.log("事件監聽器設置完成");
  }

  async function fetchExercises() {
    const baseUrl = "https://dae-mobile-assignment.hkit.cc/api";
    try {
      console.log("開始請求API...");
      const res = await fetch(`${baseUrl}/exercises`, { 
        method: "GET",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log("API回應狀態:", res.status, res.statusText);
      
      if (!res.ok) {
        showError(`讀取資料失敗（HTTP ${res.status} ${res.statusText}）`);
        return false;
      }
      
      const json = await res.json();
      console.log("API回應完整資料:", json);
      
      if (!json || json.error) {
        showError(json?.error || "API 回應異常");
        return false;
      }
      if (!Array.isArray(json.items)) {
        console.error("API 回應格式:", json);
        showError("API 回傳格式不正確：缺少 items 陣列");
        return false;
      }
      
      // 處理資料並檢查媒體檔案
      originalItems = json.items.map(i => {
        const processedItem = { 
          ...i, 
          tags: Array.isArray(i.tags) ? [...i.tags] : [],
          // 處理媒體URL - 注意API使用下劃線命名
          imageUrl: processMediaUrl(i.image_url),
          videoUrl: i.video_url, // YouTube URL 保持原樣
          youtubeEmbedUrl: isYouTubeUrl(i.video_url) ? processYouTubeUrl(i.video_url) : null,
          isYouTube: isYouTubeUrl(i.video_url),
          // 保留原始欄位
          image_url: i.image_url,
          video_url: i.video_url
        };
        
        // 調試：檢查每個項目的媒體資料
        if (processedItem.imageUrl || processedItem.videoUrl) {
          console.log("項目媒體資料:", {
            title: processedItem.title,
            原始image_url: i.image_url,
            處理後imageUrl: processedItem.imageUrl,
            原始video_url: i.video_url,
            isYouTube: processedItem.isYouTube,
            youtubeEmbedUrl: processedItem.youtubeEmbedUrl
          });
        }
        
        return processedItem;
      });
      
      console.log("處理後的資料數量:", originalItems.length);
      console.log("前3個項目:", originalItems.slice(0, 3));
      
      // 檢查有媒體檔案的項目數量
      const itemsWithMedia = originalItems.filter(item => item.imageUrl || item.videoUrl);
      console.log("有媒體檔案的項目數量:", itemsWithMedia.length);
      
      return true;
    } catch (err) {
      console.error("API請求錯誤:", err);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        showError("網路連線錯誤或CORS問題");
      } else {
        showError("無法連線至伺服器: " + err.message);
      }
      return false;
    }
  }

  async function init(isRetry = false) {
    // 請求前顯示 loading
    showLoading();

    const ok = await fetchExercises();
    if (!ok) {
      // 已在 showError 中注入了重新載入按鈕
      setCounts(0, 0);
      return;
    }

    // 成功後刷新分類
    populateCategorySelect();
    
    // 等待一下讓Ionic元件完全載入
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 總是重新設置事件監聽器，確保功能正常
    setupEventListeners();

    // 首次渲染（未輸入搜尋與分類時顯示全部）
    applyFilters();
    
    console.log("初始化完成，資料數量:", originalItems.length);
  }

  // 啟動，等待DOM和Ionic完全載入
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, 500); // 給Ionic更多時間初始化
    });
  } else {
    setTimeout(init, 500);
  }
});
