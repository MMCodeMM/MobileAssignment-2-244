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

      const mediaContent = item?.imageUrl
        ? `<div class="card-media"><img src="${item.imageUrl}" alt="${item.title || ''}" class="exercise-img" loading="lazy"></div>`
        : `<div class="card-media"><div class="media-placeholder"><i class="fas fa-image"></i><div>無媒體內容</div></div></div>`;

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

      card.querySelectorAll(".tag-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          categorySelect.value = chip.textContent;
          applyFilters();
        });
      });

      grid.appendChild(card);
    }
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
      const res = await fetch(`${baseUrl}/exercises`, { method: "GET" });
      if (!res.ok) {
        showError(`讀取資料失敗（HTTP ${res.status}）`);
        return false;
      }
      const json = await res.json();
      console.log("load list json =", json);
      if (!json || json.error) {
        showError(json?.error || "API 回應異常");
        return false;
      }
      if (!Array.isArray(json.items)) {
        showError("API 回傳格式不正確：缺少 items 陣列");
        return false;
      }
      originalItems = json.items.map(i => ({ ...i, tags: Array.isArray(i.tags) ? [...i.tags] : [] }));
      return true;
    } catch (err) {
      console.error(err);
      showError("無法連線至伺服器");
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
