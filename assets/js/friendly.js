(function applySimpleMode() {
  try {
    const raw = localStorage.getItem("hs-profile");
    const profile = raw ? JSON.parse(raw) : {};

    if (profile.simple) {
      document.body.classList.add("simple-mode");
    }
  } catch (error) {
    console.error(error);
  }
})();

if (typeof allRecipes !== "undefined") {
  const PROFILE_KEY = "hs-profile";
  const ONBOARD_KEY = "hs-onboarded";

  const CATEGORY_EMOJI = {
    "завтрак": "🍳",
    "суп": "🍲",
    "салат": "🥗",
    "горячее": "🍝",
    "гарнир": "🥘",
    "другое": "🍽️"
  };

  function loadProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      const profile = raw ? JSON.parse(raw) : {};

      return {
        name: profile.name || "",
        emoji: profile.emoji || "🙂",
        simple: Boolean(profile.simple)
      };
    } catch (error) {
      return {
        name: "",
        emoji: "🙂",
        simple: false
      };
    }
  }

  let currentProfile = loadProfile();

  function saveProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(currentProfile));
  }

  function applyProfile() {
    document.body.classList.toggle("simple-mode", currentProfile.simple);
    updateGreeting();
  }

  function updateGreeting() {
    const heroTitle = document.querySelector(".page-hero h1");

    if (!heroTitle) return;

    if (currentProfile.name.trim()) {
      heroTitle.textContent = `Привет, ${currentProfile.name.trim()}!`;
    } else {
      heroTitle.textContent = "Твоя кухня стала умнее";
    }
  }

  function openRandomRecipe() {
    if (!allRecipes.length) {
      alert("Рецепты ещё не загрузились.");
      return;
    }

    let pool = allRecipes;

    if (selectedIngredients.size > 0 && typeof withMatch === "function") {
      const matched = allRecipes
        .map(withMatch)
        .filter((recipe) => recipe.matchedCount > 0);

      if (matched.length > 0) {
        pool = matched;
      }
    }

    const recipe = pool[Math.floor(Math.random() * pool.length)];

    if (recipe) {
      window.location.href = `recipe.html?id=${recipe.id}`;
    }
  }

  function friendlyRecipeCard(recipe) {
    const card = document.createElement("article");
    card.className = "recipe-card";

    const seed = recipe.id || recipe.title.length;
    const hue = (seed * 47) % 360;

    card.style.setProperty("--card-accent", `hsl(${hue}, 78%, 45%)`);

    card.addEventListener("click", () => {
      window.location.href = `recipe.html?id=${recipe.id}`;
    });

    const emoji = CATEGORY_EMOJI[recipe.category] || "🍽️";
    const isFavorite = Store.getFavorites().includes(recipe.id);

    const matchedCount =
      recipe.matchedCount ??
      recipe.ingredients.filter((ingredient) =>
        selectedIngredients.has(ingredient)
      ).length;

    const missing =
      recipe.missing ||
      recipe.ingredients.filter(
        (ingredient) => !selectedIngredients.has(ingredient)
      );

    const percent = Math.round(
      (matchedCount / recipe.ingredients.length) * 100
    );

    const rating = Store.getRating(recipe.id);
    const cookedCount = Store.getCookedCount(recipe.id);

    let badges = `
      <span class="badge category">${emoji} ${recipe.category || "рецепт"}</span>
      <span class="badge">⏱ ${recipe.time} мин</span>
      <span class="badge">${recipe.difficulty}</span>
    `;

    if (rating > 0) {
      badges += `<span class="badge ok">★ ${rating}</span>`;
    }

    if (cookedCount > 0) {
      badges += `<span class="badge ok">Приготовлено ×${cookedCount}</span>`;
    }

    if (selectedIngredients.size > 0) {
      badges += `<span class="badge ok">Подходит: ${matchedCount} из ${recipe.ingredients.length}</span>`;
    }

    let matchBlock = "";

    if (selectedIngredients.size > 0) {
      const missingText =
        missing.length === 0
          ? `<div class="badge ok">Все продукты есть</div>`
          : `<div class="badge warn">Не хватает: ${missing.join(", ")}</div>`;

      matchBlock = `
        <div class="match-progress">
          <span style="width:${percent}%"></span>
        </div>
        ${missingText}
      `;
    }

    card.innerHTML = `
      <div
        class="recipe-cover"
        style="background: linear-gradient(135deg, hsl(${hue}, 78%, 45%), hsl(${(hue + 45) % 360}, 78%, 62%))"
      >
        <span class="recipe-cover-emoji">${emoji}</span>
        <button class="icon-btn heart${isFavorite ? " active" : ""}" type="button">♥</button>
      </div>

      <div class="recipe-body">
        <h3 class="recipe-title">${recipe.title}</h3>
        <p class="recipe-description">${recipe.description}</p>

        <div class="meta">${badges}</div>

        ${matchBlock}

        <button class="btn btn-primary btn-small recipe-open" type="button">
          Смотреть рецепт
        </button>
      </div>
    `;

    const heart = card.querySelector(".heart");

    heart.addEventListener("click", (event) => {
      event.stopPropagation();
      Store.toggleFavorite(recipe.id);

      if (typeof refreshAll === "function") {
        refreshAll();
      }
    });

    const openButton = card.querySelector(".recipe-open");

    openButton.addEventListener("click", (event) => {
      event.stopPropagation();
      window.location.href = `recipe.html?id=${recipe.id}`;
    });

    return card;
  }

  function friendlyEmptyState(message = "Пока пусто") {
    const resultsMeta = document.getElementById("results-meta");
    const recipesGrid = document.getElementById("recipes-grid");

    if (resultsMeta) {
      resultsMeta.textContent = "Ничего не найдено";
    }

    if (!recipesGrid) return;

    recipesGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍽️</div>
        <h3>Пока пусто</h3>
        <p>${message}</p>
        <p>Попробуй выбрать ещё 2–3 продукта, например: яйца, сыр, помидоры.</p>
        <div class="actions">
          <button id="empty-random-btn" class="btn btn-primary" type="button">
            🎲 Показать случайный рецепт
          </button>
        </div>
      </div>
    `;

    const randomButton = document.getElementById("empty-random-btn");

    if (randomButton) {
      randomButton.addEventListener("click", openRandomRecipe);
    }
  }

  function injectHelpButton() {
    if (document.getElementById("help-btn")) return;

    const actions = document.querySelector(".topbar-actions");

    if (!actions) return;

    actions.insertAdjacentHTML(
      "afterbegin",
      `<button id="help-btn" class="theme-toggle" type="button" aria-label="Как пользоваться">?</button>`
    );

    document.getElementById("help-btn").addEventListener("click", () => {
      showOnboarding(true);
    });
  }

  function injectRandomButton() {
    if (document.getElementById("random-recipe-btn")) return;

    const actions = document.querySelector("#view-browse .actions");

    if (!actions) return;

    const button = document.createElement("button");
    button.id = "random-recipe-btn";
    button.type = "button";
    button.className = "btn btn-secondary";
    button.textContent = "🎲 Не знаю, что приготовить";

    button.addEventListener("click", openRandomRecipe);

    actions.appendChild(button);
  }

  function injectHints() {
    const ingredients = document.getElementById("ingredients");

    if (ingredients && !document.getElementById("products-hint")) {
      ingredients.insertAdjacentHTML(
        "beforebegin",
        `<p id="products-hint" class="friendly-hint">
          👇 Нажми на продукты, которые есть дома. Можно выбрать несколько.
        </p>`
      );
    }

    const recipesGrid = document.getElementById("recipes-grid");

    if (recipesGrid && !document.getElementById("recipes-hint")) {
      recipesGrid.insertAdjacentHTML(
        "beforebegin",
        `<p id="recipes-hint" class="friendly-hint">
          🍳 Выбери рецепт и нажми «Смотреть рецепт».
        </p>`
      );
    }
  }

  function showOnboarding(force = false) {
    let onboarding = document.getElementById("onboarding");

    if (!onboarding) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div id="onboarding" class="onboarding hidden">
          <div class="onboarding-card">
            <h2>Как пользоваться сайтом</h2>
            <p class="onboarding-subtitle">Всё очень просто.</p>

            <div class="onboarding-step">
              <span>🧊</span>
              <p><strong>Шаг 1.</strong> Выбери продукты, которые есть в холодильнике.</p>
            </div>

            <div class="onboarding-step">
              <span>🍳</span>
              <p><strong>Шаг 2.</strong> Нажми «Найти рецепты» и выбери подходящий.</p>
            </div>

            <div class="onboarding-step">
              <span>🛒</span>
              <p><strong>Шаг 3.</strong> Если чего-то нет — добавь в список покупок.</p>
            </div>

            <div class="actions">
              <button id="onboarding-close" class="btn btn-primary" type="button">
                Понятно
              </button>
            </div>
          </div>
        </div>
        `
      );

      onboarding = document.getElementById("onboarding");

      document
        .getElementById("onboarding-close")
        .addEventListener("click", () => {
          localStorage.setItem(ONBOARD_KEY, "1");
          onboarding.classList.add("hidden");
        });
    }

    const alreadySeen = localStorage.getItem(ONBOARD_KEY) === "1";

    if (force || !alreadySeen) {
      onboarding.classList.remove("hidden");
    }
  }

  function renderEmojiPicker() {
    const container = document.getElementById("profile-emoji");

    if (!container) return;

    const emojis = ["🙂", "👩‍🍳", "👨‍🍳", "🧑‍🍳", "🐱", "🍳"];

    container.innerHTML = "";

    emojis.forEach((emoji) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "emoji-btn";
      button.textContent = emoji;

      if (currentProfile.emoji === emoji) {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        currentProfile.emoji = emoji;

        container.querySelectorAll(".emoji-btn").forEach((item) => {
          item.classList.remove("active");
        });

        button.classList.add("active");
      });

      container.appendChild(button);
    });
  }

  function renderProfileSummary() {
    const summary = document.getElementById("profile-summary");

    if (!summary) return;

    const favorites = Store.getFavorites().length;
    const shopping = Store.getShopping().length;
    const planDays = Object.values(Store.getPlan()).filter(Boolean).length;

    const cooked = Object.values(Store.getCooked()).reduce(
      (total, count) => total + count,
      0
    );

    summary.innerHTML = `
      <div class="stat-card">
        <span>Избранные рецепты</span>
        <strong>${favorites}</strong>
      </div>

      <div class="stat-card">
        <span>Приготовлено блюд</span>
        <strong>${cooked}</strong>
      </div>

      <div class="stat-card">
        <span>Продуктов в списке покупок</span>
        <strong>${shopping}</strong>
      </div>

      <div class="stat-card">
        <span>Запланировано дней</span>
        <strong>${planDays}</strong>
      </div>
    `;
  }

  function injectProfileTab() {
    const tabs = document.querySelector(".tabs");
    const appShell = document.querySelector(".app-shell");

    if (!tabs || !appShell) return;

    if (!document.querySelector('.tab[data-view="profile"]')) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tab";
      tab.dataset.view = "profile";
      tab.textContent = "Кабинет";

      tab.addEventListener("click", () => {
        if (typeof switchView === "function") {
          switchView("profile");
        }

        renderProfileSummary();
      });

      tabs.appendChild(tab);
    }

    if (!document.getElementById("view-profile")) {
      const view = document.createElement("section");
      view.id = "view-profile";
      view.className = "view hidden";

      view.innerHTML = `
        <section class="panel glass">
          <div class="panel-head">
            <div>
              <h2>Личный кабинет</h2>
              <p class="panel-subtitle">
                Пока данные хранятся на этом устройстве. Позже подключим базу данных.
              </p>
            </div>
          </div>

          <div class="profile-grid">
            <div class="profile-form">
              <div class="profile-field">
                <label for="profile-name">Как тебя зовут?</label>
                <input id="profile-name" type="text" placeholder="Например: Мама" />
              </div>

              <div class="profile-field" style="margin-top: 16px;">
                <label>Выбери аватар</label>
                <div id="profile-emoji" class="emoji-picker"></div>
              </div>

              <label class="simple-toggle">
                <input id="simple-mode-toggle" type="checkbox" />
                Простой режим: крупные кнопки и меньше лишнего
              </label>

              <div class="actions">
                <button id="profile-save" class="btn btn-primary" type="button">
                  Сохранить
                </button>
              </div>

              <p id="profile-notice" class="notice"></p>
            </div>

            <div>
              <h3 style="margin: 0 0 12px;">Твоя активность</h3>
              <div id="profile-summary" class="profile-summary"></div>
            </div>
          </div>

          <div class="danger-zone">
            <button id="clear-data" class="danger-btn" type="button">
              Очистить все данные сайта
            </button>
          </div>
        </section>
      `;

      appShell.appendChild(view);
    }

    const nameInput = document.getElementById("profile-name");
    const simpleToggle = document.getElementById("simple-mode-toggle");
    const saveButton = document.getElementById("profile-save");
    const clearButton = document.getElementById("clear-data");
    const notice = document.getElementById("profile-notice");

    if (nameInput) nameInput.value = currentProfile.name;
    if (simpleToggle) simpleToggle.checked = currentProfile.simple;

    renderEmojiPicker();
    renderProfileSummary();

    if (saveButton) {
      saveButton.addEventListener("click", () => {
        currentProfile.name = nameInput.value.trim();
        currentProfile.simple = simpleToggle.checked;

        saveProfile();
        applyProfile();
        renderProfileSummary();

        if (notice) {
          notice.textContent = "Профиль сохранён.";
        }
      });
    }

    if (clearButton) {
      clearButton.addEventListener("click", () => {
        const confirmed = confirm(
          "Удалить все данные сайта на этом устройстве? Избранное, покупки, план и профиль будут удалены."
        );

        if (!confirmed) return;

        Object.keys(localStorage)
          .filter((key) => key.startsWith("hs-"))
          .forEach((key) => localStorage.removeItem(key));

        window.location.reload();
      });
    }
  }

  function injectUI() {
    injectHelpButton();
    injectProfileTab();
    injectRandomButton();
    injectHints();
    // showOnboarding(false);
  }

  window.createRecipeCard = friendlyRecipeCard;
  window.renderEmptyState = friendlyEmptyState;

  injectUI();
  applyProfile();
}
