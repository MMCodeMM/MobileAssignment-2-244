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
    const unique = getUniqueTags();
    unique.forEach(tag => {
      const el = document.createElement("ion-select-option");
      el.value = tag;
      el.textContent = tag;
      categorySelect.appendChild(el);
    });
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
    const q = (searchbar?.value || "").toLowerCase();
    const cat = categorySelect?.value || "";

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

    if (cat) {
      activeFilterElement.textContent = cat;
      activeFilterElement.style.display = "inline-flex";
      clearFilterBtn.style.display = "inline";
    } else {
      activeFilterElement.style.display = "none";
      clearFilterBtn.style.display = "none";
    }

    renderGrid(filtered);
  }

  function setupEventListeners() {
    if (searchbar) searchbar.addEventListener("ionInput", () => applyFilters());
    if (categorySelect) categorySelect.addEventListener("ionChange", () => applyFilters());
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        categorySelect.value = "";
        searchbar.value = "";
        applyFilters();
      });
    }
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener("click", e => {
        e.stopPropagation();
        categorySelect.value = "";
        activeFilterElement.style.display = "none";
        clearFilterBtn.style.display = "none";
        applyFilters();
      });
    }
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

    // 成功後刷新分類及事件
    populateCategorySelect();
    // 確保事件綁定一次
    if (!isRetry) setupEventListeners();

    // 首次渲染（未輸入搜尋與分類時顯示全部）
    applyFilters();
  }

  // 啟動
  init();
});
