// 运动项目数据
const importedItems = [
  {
    title: "Dumbbell Chest Press",
    level: "Beginner",
    timeReq: "2hr",
    equipment: "Dumbbell",
    tags: ["gym", "Dumbbell Training", "Chest"],
    imageUrl: "src/DumbbellChestPress.png",
    videoUrl: "",
  },
  {
    title: "Squat",
    level: "Beginner",
    timeReq: "45min",
    equipment: "Bodyweight",
    tags: ["gym", "Leg Training", "Bodyweight"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Pull-up",
    level: "Advanced",
    timeReq: "30min",
    equipment: "Pull-up Bar",
    tags: ["gym", "Back Training", "Advanced"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Plank",
    level: "Beginner",
    timeReq: "15min",
    equipment: "None",
    tags: ["home", "Core Training", "Endurance"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Barbell Deadlift",
    level: "Advanced",
    timeReq: "1.5hr",
    equipment: "Barbell",
    tags: ["gym", "Full Body Training", "Strength"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Overhead Press",
    level: "Intermediate",
    timeReq: "1hr",
    equipment: "Dumbbell/Barbell",
    tags: ["gym", "Shoulder Training", "Upper Body"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Burpee",
    level: "Intermediate",
    timeReq: "20min",
    equipment: "None",
    tags: ["home", "Cardio", "Explosive Power"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Seated Row",
    level: "Intermediate",
    timeReq: "1hr",
    equipment: "Rowing Machine",
    tags: ["gym", "Back Training", "Machine"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Triceps Pushdown",
    level: "Beginner",
    timeReq: "30min",
    equipment: "Cable Machine",
    tags: ["gym", "Arm Training", "Triceps"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Sit-up",
    level: "Beginner",
    timeReq: "30min",
    equipment: "None",
    tags: ["home", "Core Training", "Abs"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Leg Press",
    level: "Intermediate",
    timeReq: "1hr",
    equipment: "Leg Press Machine",
    tags: ["gym", "Leg Training", "Machine"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Kettlebell Swing",
    level: "Intermediate",
    timeReq: "40min",
    equipment: "Kettlebell",
    tags: ["home", "Full Body Training", "Kettlebell"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Reverse Fly",
    level: "Beginner",
    timeReq: "30min",
    equipment: "Dumbbell",
    tags: ["gym", "Shoulder Training", "Dumbbell"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Farmer's Walk",
    level: "Intermediate",
    timeReq: "20min",
    equipment: "Dumbbell/Kettlebell",
    tags: ["gym", "Full Body Training", "Grip Strength"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "High Knees",
    level: "Beginner",
    timeReq: "15min",
    equipment: "None",
    tags: ["home", "Cardio", "Warm-up"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Bicep Curl",
    level: "Beginner",
    timeReq: "30min",
    equipment: "Dumbbell",
    tags: ["gym", "Arm Training", "Biceps"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Romanian Deadlift",
    level: "Intermediate",
    timeReq: "1hr",
    equipment: "Barbell",
    tags: ["gym", "Leg Training", "Posterior Chain"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Incline Dumbbell Press",
    level: "Intermediate",
    timeReq: "1hr",
    equipment: "Dumbbell",
    tags: ["gym", "Dumbbell Training", "Chest"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Mountain Climber",
    level: "Beginner",
    timeReq: "20min",
    equipment: "None",
    tags: ["home", "Core Training", "Cardio"],
    imageUrl: "",
    videoUrl: "",
  },
  {
    title: "Push-up",
    level: "Beginner",
    timeReq: "30min",
    equipment: "None",
    tags: ["home", "Upper Body Training", "Chest"],
    imageUrl: "",
    videoUrl: "",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const originalItems = importedItems.map(i => ({ ...i, tags: [...i.tags] }));
  const grid = document.getElementById("exercise-grid");
  const searchbar = document.getElementById("search-bar");
  const categorySelect = document.getElementById("category-select");
  const resetBtn = document.getElementById("reset-category");
  const noResultsElement = document.getElementById("no-results");
  const totalCountElement = document.getElementById("total-count");
  const filterCountElement = document.getElementById("filter-count");
  const activeFilterElement = document.getElementById("active-filter");
  const clearFilterBtn = document.getElementById("clear-filter");

  totalCountElement.textContent = originalItems.length;
  filterCountElement.textContent = originalItems.length;
  noResultsElement.style.display = "none";
  clearFilterBtn.style.display = "none";

  function getUniqueTags() {
    const set = new Set();
    for (const it of originalItems) {
      if (Array.isArray(it.tags)) for (const t of it.tags) set.add(t);
    }
    return Array.from(set);
  }

  function populateCategorySelect() {
    const unique = getUniqueTags();
    unique.forEach(tag => {
      const el = document.createElement("ion-select-option");
      el.value = tag;
      el.textContent = tag;
      categorySelect.appendChild(el);
    });
  }

  async function renderGrid(filteredItems) {

        async function fetchProtectedData() {
  let baseUrl = 'https://dae-mobile-assignment.hkit.cc/api/exercises'
  let res = await fetch(`${baseUrl}/exercises`, {
    method: 'GET',
  })
  let json = await res.json()
  console.log(json.item_ids)
  let items = json.items
    }
    grid.innerHTML = "";

    if (filteredItems.length === 0) {
      noResultsElement.style.display = "block";
    } else {
      noResultsElement.style.display = "none";
    }

    filterCountElement.textContent = filteredItems.length;

    for (const item of filteredItems) {
      const card = document.createElement("div");
      card.className = "exercise-card";

      const mediaContent = item.imageUrl
        ? `<div class="card-media"><img src="${item.imageUrl}" alt="${item.title}" class="exercise-img" loading="lazy"></div>`
        : `<div class="card-media"><div class="media-placeholder"><i class="fas fa-image"></i><div>無媒體內容</div></div></div>`;

      const tagsContent = Array.isArray(item.tags)
        ? item.tags.map(tag => `<div class="tag-chip">${tag}</div>`).join("")
        : "";

      card.innerHTML = `
        <div class="card-content">
          <div class="card-title">${item.title}</div>
          <div class="card-subtitle">${item.level}</div>
          <div class="card-meta">
            <div class="meta-item"><span class="meta-label">所需時間</span><span class="meta-value">${item.timeReq}</span></div>
            <div class="meta-item"><span class="meta-label">器材</span><span class="meta-value">${item.equipment}</span></div>
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
    const q = (searchbar.value || "").toLowerCase();
    const cat = categorySelect.value || "";

    const filtered = originalItems.filter(it => {
      const matchesSearch =
        !q ||
        it.title?.toLowerCase().includes(q) ||
        it.level?.toLowerCase().includes(q) ||
        it.equipment?.toLowerCase().includes(q) ||
        it.tags?.some(tag => tag.toLowerCase().includes(q));

      const matchesCategory =
        !cat || it.tags?.includes(cat) || it.level === cat;

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
    searchbar.addEventListener("ionInput", () => applyFilters());
    categorySelect.addEventListener("ionChange", () => applyFilters());
    resetBtn.addEventListener("click", () => {
      categorySelect.value = "";
      searchbar.value = "";
      applyFilters();
    });
    clearFilterBtn.addEventListener("click", e => {
      e.stopPropagation();
      categorySelect.value = "";
      activeFilterElement.style.display = "none";
      clearFilterBtn.style.display = "none";
      applyFilters();
    });
  }

  function init() {
    populateCategorySelect();
    setupEventListeners();
    renderGrid(originalItems);
  }

  init();
});
