const INGREDIENTS = [
  "яйца",
  "молоко",
  "сыр",
  "помидоры",
  "огурцы",
  "курица",
  "рис",
  "картофель",
  "лук",
  "морковь",
  "чеснок",
  "хлеб",
  "сосиски",
  "сметана",
  "масло сливочное",
  "масло растительное",
  "капуста",
  "грибы",
  "фарш",
  "макароны"
];

const DAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье"
];

let allRecipes = [];
let planBuilt = false;

const state = {
  view: "browse",
  ingredientQuery: "",
  category: "все",
  recipeSearch: "",
  sort: "best",
  maxTime: null,
  easyOnly: false,
  collectionName: ""
};

let selectedIngredients = new Set(
  Store.getArray(STORAGE.selected).filter((name) => INGREDIENTS.includes(name))
);

const els = {
  ingredients: document.getElementById("ingredients"),
  ingredientSearch: document.getElementById("ingredient-search"),
  selectAllBtn: document.getElementById("select-all-btn"),
  findBtn: document.getElementById("find-btn"),
  resetBtn: document.getElementById("reset-btn"),
  status: document.getElementById("status"),

  recipeSearch: document.getElementById("recipe-search"),
  sortSelect: document.getElementById("sort-select"),
  categoryChips: document.getElementById("category-chips"),
  resultsMeta: document.getElementById("results-meta"),
  recipesGrid: document.getElementById("recipes-grid"),
  recipesPanel: document.getElementById("recipes-panel"),

  favoritesGrid: document.getElementById("favorites-grid"),

  shoppingInput: document.getElementById("shopping-input"),
  shoppingAdd: document.getElementById("shopping-add"),
  shoppingClear: document.getElementById("shopping-clear"),
  shoppingList: document.getElementById("shopping-list"),

  planDays: document.getElementById("plan-days"),
  planToShopping: document.getElementById("plan-to-shopping"),
  planClear: document.getElementById("plan-clear"),
  planStatus: document.getElementById("plan-status"),

  collectionsGrid: document.getElementById("collections-grid"),

  statsGrid: document.getElementById("stats-grid"),
  achievementsGrid: document.getElementById("achievements-grid")
};

const COLLECTIONS = [
  {
    title: "Быстрые до 15 минут",
    description: "Когда нужно приготовить максимально быстро.",
    apply() {
      state.category = "все";
      state.recipeSearch = "";
      state.sort = "time";
      state.maxTime = 15;
      state.easyOnly = false;
      state.collectionName = this.title;
    }
  },
  {
    title: "Лёгкие рецепты",
    description: "Минимум сложности и усилий.",
    apply() {
      state.category = "все";
      state.recipeSearch = "";
      state.sort = "easy";
      state.maxTime = null;
      state.easyOnly = true;
      state.collectionName = this.title;
    }
  },
  {
    title: "Завтраки",
    description: "Яйца, бутерброды и быстрые утренние блюда.",
    apply() {
      state.category = "завтрак";
      state.recipeSearch = "";
      state.sort = "best";
      state.maxTime = null;
      state.easyOnly = false;
      state.collectionName = this.title;
    }
  },
  {
    title: "Супы",
    description: "Сытные и согревающие варианты.",
    apply() {
      state.category = "суп";
      state.recipeSearch = "";
      state.sort = "best";
      state.maxTime = null;
      state.easyOnly = false;
      state.collectionName = this.title;
    }
  },
  {
    title: "Салаты",
    description: "Свежие и лёгкие блюда.",
    apply() {
      state.category = "салат";
      state.recipeSearch = "";
      state.sort = "best";
      state.maxTime = null;
      state.easyOnly = false;
      state.collectionName = this.title;
    }
  },
  {
    title: "Из яиц",
    description: "Рецепты, где используются яйца.",
    apply() {
      state.category = "все";
      state.recipeSearch = "яйца";
      state.sort = "best";
      state.maxTime = null;
      state.easyOnly = false;
      state.collectionName = this.title;
    }
  },
  {
    title: "Из курицы",
    description: "Блюда с курицей.",
    apply() {
      state.category = "все";
      state.recipeSearch = "курица";
      state.sort = "best";
      state.maxTime = null;
      state.easyOnly = false;
      state.collectionName = this.title;
    }
  },
  {
    title: "Из картофеля",
    description: "Картофельные блюда на каждый день.",
    apply() {
      state.category = "все";
      state.recipeSearch = "картофель";
      state.sort = "best";
      state.maxTime = null;
      state.easyOnly = false;
      state.collectionName = this.title;
    }
  }
];

function saveSelected() {
  Store.setArray(STORAGE.selected, [...selectedIngredients]);
}

async function loadRecipes() {
  try {
    const response = await fetch("data/recipes.json");

    if (!response.ok) {
      throw new Error("Не удалось загрузить рецепты");
    }

    allRecipes = await response.json();
  } catch (error) {
    console.error(error);

    if (els.status) {
      els.status.textContent =
        "Ошибка загрузки рецептов. Запусти сайт через локальный сервер.";
    }
  }
}

function withMatch(recipe) {
  const matched = recipe.ingredients.filter((ingredient) =>
    selectedIngredients.has(ingredient)
  );

  const missing = recipe.ingredients.filter(
    (ingredient) => !selectedIngredients.has(ingredient)
  );

  return {
    ...recipe,
    matchedCount: matched.length,
    missing
  };
}

function renderIngredientChips() {
  if (!els.ingredients) return;

  els.ingredients.innerHTML = "";

  const query = state.ingredientQuery.toLowerCase();

  const visibleIngredients = INGREDIENTS.filter((name) =>
    name.toLowerCase().includes(query)
  );

  if (visibleIngredients.length === 0) {
    els.ingredients.innerHTML = `<p class="panel-subtitle">Ничего не найдено.</p>`;
    return;
  }

  visibleIngredients.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = name;

    if (selectedIngredients.has(name)) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      if (selectedIngredients.has(name)) {
        selectedIngredients.delete(name);
        button.classList.remove("active");
      } else {
        selectedIngredients.add(name);
        button.classList.add("active");
      }

      saveSelected();
      updateStatus();
      applyFilters();
      renderStats();
    });

    els.ingredients.appendChild(button);
  });
}

function updateStatus() {
  if (!els.status) return;

  if (selectedIngredients.size === 0) {
    els.status.textContent = "Выбери хотя бы один продукт.";
  } else {
    els.status.textContent = `Выбрано продуктов: ${selectedIngredients.size}`;
  }

  updateSelectAllButton();
}

function updateSelectAllButton() {
  if (!els.selectAllBtn) return;

  if (selectedIngredients.size === INGREDIENTS.length) {
    els.selectAllBtn.textContent = "Снять всё";
  } else {
    els.selectAllBtn.textContent = "Выбрать всё";
  }
}

function renderCategoryChips() {
  if (!els.categoryChips) return;

  els.categoryChips.innerHTML = "";

  const categories = [
    "все",
    ...new Set(allRecipes.map((recipe) => recipe.category || "другое"))
  ];

  if (!categories.includes(state.category)) {
    state.category = "все";
  }

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.textContent = category;

    if (state.category === category) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.category = category;
      state.collectionName = "";
      renderCategoryChips();
      applyFilters();
    });

    els.categoryChips.appendChild(button);
  });
}

function sortList(list) {
  if (state.sort === "time") {
    list.sort((a, b) => a.time - b.time);
  } else if (state.sort === "easy") {
    list.sort((a, b) => {
      if (a.difficulty === b.difficulty) {
        return a.time - b.time;
      }

      return a.difficulty === "легко" ? -1 : 1;
    });
  } else if (state.sort === "alpha") {
    list.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  } else if (state.sort === "rating") {
    list.sort(
      (a, b) => Store.getRating(b.id) - Store.getRating(a.id) || a.time - b.time
    );
  } else {
    if (selectedIngredients.size > 0) {
      list.sort(
        (a, b) =>
          b.matchedCount - a.matchedCount ||
          a.missing.length - b.missing.length ||
          a.time - b.time
      );
    } else {
      list.sort(
        (a, b) =>
          Store.getRating(b.id) - Store.getRating(a.id) ||
          Store.getCookedCount(b.id) - Store.getCookedCount(a.id) ||
          a.time - b.time
      );
    }
  }

  return list;
}

function applyFilters() {
  if (!els.recipesGrid) return;

  if (allRecipes.length === 0) {
    els.recipesGrid.innerHTML = `<p class="panel-subtitle">Рецепты ещё не загрузились.</p>`;
    return;
  }

  let list = allRecipes.map(withMatch);

  if (state.category !== "все") {
    list = list.filter((recipe) => recipe.category === state.category);
  }

  if (state.recipeSearch.trim()) {
    const query = state.recipeSearch.trim().toLowerCase();

    list = list.filter((recipe) => {
      return (
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        (recipe.category || "").toLowerCase().includes(query) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(query)
        )
      );
    });
  }

  if (state.maxTime) {
    list = list.filter((recipe) => recipe.time <= state.maxTime);
  }

  if (state.easyOnly) {
    list = list.filter((recipe) => recipe.difficulty === "легко");
  }

  if (selectedIngredients.size > 0) {
    list = list.filter((recipe) => recipe.matchedCount > 0);
  }

  list = sortList(list);

  renderRecipes(list, els.recipesGrid, "Ничего не найдено. Попробуй изменить запрос или продукты.");

  if (els.resultsMeta) {
    if (state.collectionName) {
      els.resultsMeta.textContent = `${state.collectionName}: найдено ${list.length}`;
    } else {
      els.resultsMeta.textContent = list.length
        ? `Показано: ${list.length}`
        : "Ничего не найдено";
    }
  }
}

function renderRecipes(list, container, emptyMessage) {
  if (!container) return;

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <h3>Пока пусто</h3>
        <p>${emptyMessage}</p>
      </div>
    `;
    return;
  }

  list.forEach((recipe) => {
    container.appendChild(createRecipeCard(recipe));
  });
}

function createRecipeCard(recipe) {
  const card = document.createElement("article");
  card.className = "recipe-card";

  const seed = recipe.id || recipe.title.length;
  const hue = (seed * 47) % 360;

  card.style.setProperty("--card-accent", `hsl(${hue}, 78%, 45%)`);

  card.addEventListener("click", () => {
    window.location.href = `recipe.html?id=${recipe.id}`;
  });

  const top = document.createElement("div");
  top.className = "recipe-top";

  const left = document.createElement("div");
  left.className = "recipe-top-left";

  const dot = document.createElement("span");
  dot.className = "recipe-dot";

  const title = document.createElement("h3");
  title.className = "recipe-title";
  title.textContent = recipe.title;

  left.appendChild(dot);
  left.appendChild(title);

  const isFavorite = Store.getFavorites().includes(recipe.id);

  const heart = document.createElement("button");
  heart.type = "button";
  heart.className = `icon-btn heart${isFavorite ? " active" : ""}`;
  heart.textContent = "♥";
  heart.title = "Избранное";

  heart.addEventListener("click", (event) => {
    event.stopPropagation();
    Store.toggleFavorite(recipe.id);
    refreshAll();
  });

  top.appendChild(left);
  top.appendChild(heart);

  const description = document.createElement("p");
  description.className = "recipe-description";
  description.textContent = recipe.description;

  const meta = document.createElement("div");
  meta.className = "meta";

  const categoryBadge = document.createElement("span");
  categoryBadge.className = "badge category";
  categoryBadge.textContent = recipe.category || "рецепт";

  const timeBadge = document.createElement("span");
  timeBadge.className = "badge";
  timeBadge.textContent = `⏱ ${recipe.time} мин`;

  const difficultyBadge = document.createElement("span");
  difficultyBadge.className = "badge";
  difficultyBadge.textContent = recipe.difficulty;

  meta.appendChild(categoryBadge);
  meta.appendChild(timeBadge);
  meta.appendChild(difficultyBadge);

  const rating = Store.getRating(recipe.id);

  if (rating > 0) {
    const ratingBadge = document.createElement("span");
    ratingBadge.className = "badge ok";
    ratingBadge.textContent = `★ ${rating}`;
    meta.appendChild(ratingBadge);
  }

  const cookedCount = Store.getCookedCount(recipe.id);

  if (cookedCount > 0) {
    const cookedBadge = document.createElement("span");
    cookedBadge.className = "badge ok";
    cookedBadge.textContent = `Приготовлено ×${cookedCount}`;
    meta.appendChild(cookedBadge);
  }

  if (selectedIngredients.size > 0) {
    const matchBadge = document.createElement("span");
    matchBadge.className = "badge ok";
    matchBadge.textContent = `Совпало: ${recipe.matchedCount} из ${recipe.ingredients.length}`;
    meta.appendChild(matchBadge);
  }

  card.appendChild(top);
  card.appendChild(description);
  card.appendChild(meta);

  if (selectedIngredients.size > 0) {
    const progress = document.createElement("div");
    progress.className = "match-progress";

    const progressBar = document.createElement("span");
    const percent = Math.round(
      (recipe.matchedCount / recipe.ingredients.length) * 100
    );

    progressBar.style.width = `${percent}%`;
    progress.appendChild(progressBar);
    card.appendChild(progress);
  }

  const tags = document.createElement("div");
  tags.className = "recipe-tags";

  recipe.ingredients.slice(0, 4).forEach((ingredient) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = ingredient;
    tags.appendChild(tag);
  });

  if (recipe.ingredients.length > 4) {
    const more = document.createElement("span");
    more.className = "tag";
    more.textContent = `+${recipe.ingredients.length - 4}`;
    tags.appendChild(more);
  }

  card.appendChild(tags);

  if (selectedIngredients.size > 0) {
    const missing = document.createElement("div");

    if (recipe.missing.length === 0) {
      missing.className = "badge ok";
      missing.textContent = "Все продукты есть";
    } else {
      missing.className = "badge warn";
      missing.textContent = `Не хватает: ${recipe.missing.join(", ")}`;
    }

    card.appendChild(missing);
  }

  return card;
}

function renderFavorites() {
  if (!els.favoritesGrid) return;

  const favorites = Store.getFavorites();

  const list = allRecipes
    .filter((recipe) => favorites.includes(recipe.id))
    .map(withMatch);

  renderRecipes(
    list,
    els.favoritesGrid,
    "Пока нет избранных рецептов. Нажми на сердечко в карточке рецепта."
  );
}

function renderShopping() {
  if (!els.shoppingList) return;

  const items = Store.getShopping();

  els.shoppingList.innerHTML = "";

  if (items.length === 0) {
    els.shoppingList.innerHTML = `
      <p class="panel-subtitle">
        Список покупок пуст. Добавь продукт вручную или добавь недостающие ингредиенты со страницы рецепта.
      </p>
    `;
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = `shopping-row${item.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.done;

    checkbox.addEventListener("change", () => {
      const current = Store.getShopping();
      current[index].done = checkbox.checked;
      Store.setShopping(current);
      renderShopping();
      renderStats();
    });

    const name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item.name;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "small-btn";
    removeButton.textContent = "Удалить";

    removeButton.addEventListener("click", () => {
      const current = Store.getShopping();
      current.splice(index, 1);
      Store.setShopping(current);
      renderShopping();
      renderStats();
    });

    row.appendChild(checkbox);
    row.appendChild(name);
    row.appendChild(removeButton);

    els.shoppingList.appendChild(row);
  });
}

function addCustomShoppingItem() {
  if (!els.shoppingInput) return;

  const value = els.shoppingInput.value.trim();

  if (!value) return;

  Store.addShoppingItems([value]);
  els.shoppingInput.value = "";

  renderShopping();
  renderStats();
}

function renderPlan() {
  if (!els.planDays || allRecipes.length === 0) return;

  const plan = Store.getPlan();

  if (!planBuilt) {
    els.planDays.innerHTML = "";

    const sortedRecipes = [...allRecipes].sort((a, b) =>
      a.title.localeCompare(b.title, "ru")
    );

    DAYS.forEach((day) => {
      const row = document.createElement("div");
      row.className = "plan-row";

      const label = document.createElement("div");
      label.className = "plan-day";
      label.textContent = day;

      const select = document.createElement("select");
      select.className = "select";
      select.dataset.day = day;

      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "—";
      select.appendChild(emptyOption);

      sortedRecipes.forEach((recipe) => {
        const option = document.createElement("option");
        option.value = recipe.id;
        option.textContent = recipe.title;
        select.appendChild(option);
      });

      select.addEventListener("change", () => {
        const currentPlan = Store.getPlan();

        if (select.value) {
          currentPlan[day] = Number(select.value);
        } else {
          delete currentPlan[day];
        }

        Store.setPlan(currentPlan);
        renderStats();
      });

      row.appendChild(label);
      row.appendChild(select);

      els.planDays.appendChild(row);
    });

    planBuilt = true;
  }

  els.planDays.querySelectorAll("select").forEach((select) => {
    const value = plan[select.dataset.day];

    if (value) {
      select.value = String(value);
    } else {
      select.value = "";
    }
  });
}

function planToShopping() {
  const plan = Store.getPlan();
  const ingredients = [];

  Object.values(plan).forEach((recipeId) => {
    const recipe = allRecipes.find((item) => item.id === Number(recipeId));

    if (recipe) {
      ingredients.push(...recipe.ingredients);
    }
  });

  if (ingredients.length === 0) {
    if (els.planStatus) {
      els.planStatus.textContent = "Сначала выбери рецепты в план.";
    }
    return;
  }

  Store.addShoppingItems(ingredients);

  if (els.planStatus) {
    els.planStatus.textContent = "Продукты из плана добавлены в список покупок.";
  }

  renderShopping();
  renderStats();
}

function clearPlan() {
  Store.setPlan({});
  renderPlan();
  renderStats();

  if (els.planStatus) {
    els.planStatus.textContent = "План очищен.";
  }
}

function renderCollections() {
  if (!els.collectionsGrid) return;

  els.collectionsGrid.innerHTML = "";

  COLLECTIONS.forEach((collection) => {
    const card = document.createElement("article");
    card.className = "collection-card";

    card.innerHTML = `
      <h3>${collection.title}</h3>
      <p>${collection.description}</p>
      <span class="btn btn-secondary btn-small">Открыть подборку</span>
    `;

    card.addEventListener("click", () => {
      collection.apply();

      if (els.recipeSearch) {
        els.recipeSearch.value = state.recipeSearch;
      }

      if (els.sortSelect) {
        els.sortSelect.value = state.sort;
      }

      switchView("browse");
      renderCategoryChips();
      applyFilters();
    });

    els.collectionsGrid.appendChild(card);
  });
}

function renderStats() {
  if (!els.statsGrid || !els.achievementsGrid) return;

  const favorites = Store.getFavorites();
  const shopping = Store.getShopping();
  const plan = Store.getPlan();
  const cooked = Store.getCooked();

  let cookedCount = 0;
  let usedIngredients = 0;

  Object.entries(cooked).forEach(([recipeId, count]) => {
    const recipe = allRecipes.find((item) => item.id === Number(recipeId));

    if (recipe) {
      cookedCount += count;
      usedIngredients += recipe.ingredients.length * count;
    }
  });

  const planCount = Object.values(plan).filter(Boolean).length;

  els.statsGrid.innerHTML = `
    <div class="stat-card">
      <strong>${favorites.length}</strong>
      <span>избранных рецептов</span>
    </div>

    <div class="stat-card">
      <strong>${cookedCount}</strong>
      <span>приготовлено блюд</span>
    </div>

    <div class="stat-card">
      <strong>${shopping.length}</strong>
      <span>продуктов в покупках</span>
    </div>

    <div class="stat-card">
      <strong>${planCount}</strong>
      <span>дней запланировано</span>
    </div>

    <div class="stat-card">
      <strong>${selectedIngredients.size}</strong>
      <span>продуктов в холодильнике</span>
    </div>

    <div class="stat-card">
      <strong>${usedIngredients}</strong>
      <span>продуктов использовано</span>
    </div>
  `;

  const achievements = [
    {
      title: "Первые шаги",
      description: "Выбери продукты в холодильнике.",
      unlocked: selectedIngredients.size > 0
    },
    {
      title: "Искатель",
      description: "Добавь первый рецепт в избранное.",
      unlocked: favorites.length >= 1
    },
    {
      title: "Коллекционер",
      description: "Собери 5 избранных рецептов.",
      unlocked: favorites.length >= 5
    },
    {
      title: "Повар",
      description: "Отметь первое приготовленное блюдо.",
      unlocked: cookedCount >= 1
    },
    {
      title: "Шеф",
      description: "Приготовь 5 блюд.",
      unlocked: cookedCount >= 5
    },
    {
      title: "Планировщик",
      description: "Заполни 3 дня в плане.",
      unlocked: planCount >= 3
    },
    {
      title: "Закупщик",
      description: "Добавь 5 продуктов в список покупок.",
      unlocked: shopping.length >= 5
    },
    {
      title: "Эко-кухня",
      description: "Используй 20 продуктов в приготовлении.",
      unlocked: usedIngredients >= 20
    }
  ];

  els.achievementsGrid.innerHTML = "";

  achievements.forEach((achievement) => {
    const item = document.createElement("div");
    item.className = `achievement${achievement.unlocked ? " unlocked" : ""}`;

    item.innerHTML = `
      <h3>${achievement.title}</h3>
      <p>${achievement.description}</p>
    `;

    els.achievementsGrid.appendChild(item);
  });
}

function switchView(view) {
  state.view = view;

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });

  document.querySelectorAll(".view").forEach((section) => {
    section.classList.add("hidden");
  });

  const activeView = document.getElementById(`view-${view}`);

  if (activeView) {
    activeView.classList.remove("hidden");
  }

  if (view === "browse") {
    applyFilters();
  }

  if (view === "favorites") {
    renderFavorites();
  }

  if (view === "shopping") {
    renderShopping();
  }

  if (view === "plan") {
    renderPlan();
  }

  if (view === "stats") {
    renderStats();
  }
}

function refreshAll() {
  renderIngredientChips();
  renderCategoryChips();
  applyFilters();
  renderFavorites();
  renderShopping();
  renderPlan();
  renderStats();
  updateStatus();
}

function resetAll() {
  selectedIngredients.clear();
  saveSelected();

  state.ingredientQuery = "";
  state.category = "все";
  state.recipeSearch = "";
  state.sort = "best";
  state.maxTime = null;
  state.easyOnly = false;
  state.collectionName = "";

  if (els.ingredientSearch) {
    els.ingredientSearch.value = "";
  }

  if (els.recipeSearch) {
    els.recipeSearch.value = "";
  }

  if (els.sortSelect) {
    els.sortSelect.value = state.sort;
  }

  renderIngredientChips();
  renderCategoryChips();
  applyFilters();
  renderStats();
  updateStatus();
}

function bindStaticEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchView(tab.dataset.view);
    });
  });

  if (els.ingredientSearch) {
    els.ingredientSearch.addEventListener("input", () => {
      state.ingredientQuery = els.ingredientSearch.value.trim();
      renderIngredientChips();
    });
  }

  if (els.selectAllBtn) {
    els.selectAllBtn.addEventListener("click", () => {
      if (selectedIngredients.size === INGREDIENTS.length) {
        selectedIngredients.clear();
      } else {
        INGREDIENTS.forEach((ingredient) => {
          selectedIngredients.add(ingredient);
        });
      }

      saveSelected();
      renderIngredientChips();
      applyFilters();
      renderStats();
      updateStatus();
    });
  }

  if (els.findBtn) {
    els.findBtn.addEventListener("click", () => {
      applyFilters();

      if (els.recipesPanel) {
        els.recipesPanel.scrollIntoView({
          behavior: "smooth"
        });
      }
    });
  }

  if (els.resetBtn) {
    els.resetBtn.addEventListener("click", resetAll);
  }

  if (els.recipeSearch) {
    els.recipeSearch.addEventListener("input", () => {
      state.recipeSearch = els.recipeSearch.value.trim();
      state.collectionName = "";
      applyFilters();
    });
  }

  if (els.sortSelect) {
    els.sortSelect.addEventListener("change", () => {
      state.sort = els.sortSelect.value;
      state.collectionName = "";
      applyFilters();
    });
  }

  if (els.shoppingAdd) {
    els.shoppingAdd.addEventListener("click", addCustomShoppingItem);
  }

  if (els.shoppingInput) {
    els.shoppingInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        addCustomShoppingItem();
      }
    });
  }

  if (els.shoppingClear) {
    els.shoppingClear.addEventListener("click", () => {
      Store.setShopping([]);
      renderShopping();
      renderStats();
    });
  }

  if (els.planToShopping) {
    els.planToShopping.addEventListener("click", planToShopping);
  }

  if (els.planClear) {
    els.planClear.addEventListener("click", clearPlan);
  }
}

async function init() {
  await loadRecipes();
  bindStaticEvents();
  renderCollections();
  refreshAll();
}

init();
