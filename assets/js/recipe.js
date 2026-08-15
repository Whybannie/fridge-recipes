const CATEGORY_EMOJI = {
  "завтрак": "🍳",
  "суп": "🍲",
  "салат": "🥗",
  "горячее": "🍝",
  "гарнир": "🥘",
  "другое": "🍽️"
};

const pageEl = document.getElementById("recipe-page");
const params = new URLSearchParams(window.location.search);
const recipeId = Number(params.get("id"));

let currentRecipe = null;

function getSelectedIngredients() {
  const all = Array.isArray(window.ALL_INGREDIENTS) ? window.ALL_INGREDIENTS : [];

  return new Set(
    Store.getArray(STORAGE.selected).filter((name) => {
      if (all.length === 0) return true;
      return all.includes(name);
    })
  );
}

function fallbackSteps(recipe) {
  const ingredients = recipe.ingredients || [];
  const time = recipe.time || 20;

  return [
    `Подготовь ингредиенты: ${ingredients.join(", ")}.`,
    "Разогрей сковороду, кастрюлю или духовку в зависимости от блюда.",
    "Смешай и приготовь продукты так, чтобы блюдо было готово.",
    `Ориентируйся примерно на ${time} минут и вкус.`
  ];
}

function getSteps(recipe) {
  if (Array.isArray(recipe.steps) && recipe.steps.length > 0) {
    return recipe.steps;
  }

  return fallbackSteps(recipe);
}

function showNotice(text) {
  const notice = document.getElementById("recipe-notice");

  if (notice) {
    notice.textContent = text;
  }
}

function isFavorite() {
  return Store.getFavorites().includes(currentRecipe.id);
}

function updateFavoriteButton() {
  const button = document.getElementById("favorite-btn");

  if (!button) return;

  const favorite = isFavorite();

  button.textContent = favorite ? "♥ В избранном" : "♡ В избранное";
  button.classList.toggle("rw-fav-active", favorite);
}

function updateCookedButton() {
  const button = document.getElementById("cooked-btn");

  if (!button) return;

  const count = Store.getCookedCount(currentRecipe.id);

  button.textContent = count > 0
    ? `🍳 Приготовлено ×${count}`
    : "🍳 Приготовить";
}

function renderStars() {
  const container = document.getElementById("stars");

  if (!container) return;

  const rating = Store.getRating(currentRecipe.id);

  container.innerHTML = "";

  for (let i = 1; i <= 5; i += 1) {
    const star = document.createElement("button");
    star.type = "button";
    star.className = `rw-star${i <= rating ? " active" : ""}`;
    star.textContent = "★";

    star.addEventListener("click", () => {
      Store.setRating(currentRecipe.id, i);
      renderStars();
      showNotice("Оценка сохранена.");
    });

    container.appendChild(star);
  }
}

function bindActions() {
  const favoriteBtn = document.getElementById("favorite-btn");
  const cookedBtn = document.getElementById("cooked-btn");
  const shoppingBtn = document.getElementById("shopping-btn");
  const shareBtn = document.getElementById("share-btn");
  const saveReviewBtn = document.getElementById("save-review");
  const reviewText = document.getElementById("review-text");

  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", () => {
      Store.toggleFavorite(currentRecipe.id);
      updateFavoriteButton();
      showNotice(
        isFavorite()
          ? "Рецепт добавлен в избранное."
          : "Рецепт убран из избранного."
      );
    });
  }

  if (cookedBtn) {
    cookedBtn.addEventListener("click", () => {
      Store.addCooked(currentRecipe.id);
      updateCookedButton();
      showNotice("Отлично! Рецепт отмечен как приготовленный.");
    });
  }

  if (shoppingBtn) {
    shoppingBtn.addEventListener("click", () => {
      const selected = getSelectedIngredients();

      const missing = selected.size
        ? currentRecipe.ingredients.filter((ingredient) => !selected.has(ingredient))
        : currentRecipe.ingredients;

      if (missing.length === 0) {
        showNotice("Все продукты уже есть.");
        return;
      }

      Store.addShoppingItems(missing);
      showNotice(`Добавлено в покупки: ${missing.join(", ")}`);
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const url = window.location.href;

      try {
        await navigator.clipboard.writeText(url);
        showNotice("Ссылка на рецепт скопирована.");
      } catch (error) {
        window.prompt("Скопируй ссылку вручную:", url);
      }
    });
  }

  if (saveReviewBtn && reviewText) {
    saveReviewBtn.addEventListener("click", () => {
      Store.setReview(currentRecipe.id, reviewText.value.trim());
      showNotice("Отзыв сохранён.");
    });
  }
}

function renderRecipe(recipe) {
  currentRecipe = recipe;

  document.title = `${recipe.title} — Холодильник Шеф`;

  const selected = getSelectedIngredients();
  const matched = recipe.ingredients.filter((ingredient) => selected.has(ingredient)).length;
  const missing = recipe.ingredients.filter((ingredient) => !selected.has(ingredient));

  const seed = recipe.id || recipe.title.length;
  const hue = (seed * 47) % 360;
  const emoji = CATEGORY_EMOJI[recipe.category] || "🍽️";

  const steps = getSteps(recipe);
  const review = Store.getReview(recipe.id);

  const stepsHtml = steps
    .map((step, index) => {
      return `
        <li class="rw-step">
          <span class="rw-step-num">${index + 1}</span>
          <p>${step}</p>
        </li>
      `;
    })
    .join("");

  const ingredientsRows = recipe.ingredients
    .map((ingredient) => {
      const hasIngredient = selected.has(ingredient);

      const stateClass = selected.size === 0
        ? "unknown"
        : hasIngredient
        ? "has"
        : "no";

      const icon = selected.size === 0
        ? "•"
        : hasIngredient
        ? "✓"
        : "!";

      const pill = selected.size === 0
        ? "—"
        : hasIngredient
        ? "есть"
        : "нет";

      return `
        <div class="rw-ingredient ${stateClass}">
          <span class="rw-ingredient-state">${icon}</span>
          <span>${ingredient}</span>
          <span class="rw-pill">${pill}</span>
        </div>
      `;
    })
    .join("");

  let ingredientNote = "";

  if (selected.size === 0) {
    ingredientNote = `
      <div class="rw-note">
        Отметь продукты на главной, чтобы видеть, что уже есть.
      </div>
    `;
  } else if (missing.length === 0) {
    ingredientNote = `
      <div class="rw-all">
        Все продукты есть 🎉
      </div>
    `;
  } else {
    ingredientNote = `
      <div class="rw-missing">
        Не хватает: ${missing.join(", ")}
      </div>
    `;
  }

  const selectedBadge = selected.size
    ? `<span class="rw-badge">Совпало: ${matched} из ${recipe.ingredients.length}</span>`
    : "";

  pageEl.innerHTML = `
    <a class="rw-back" href="index.html">← Назад</a>

    <section class="rw-hero">
      <div
        class="rw-cover"
        style="background: linear-gradient(135deg, hsl(${hue}, 78%, 45%), hsl(${(hue + 50) % 360}, 78%, 62%))"
      >
        <div class="rw-cover-badges">
          <span class="rw-badge">${emoji} ${recipe.category || "рецепт"}</span>
          <span class="rw-badge">⏱ ${recipe.time} мин</span>
          <span class="rw-badge">${recipe.difficulty}</span>
          ${selectedBadge}
        </div>

        <span class="rw-emoji">${emoji}</span>
      </div>

      <div class="rw-hero-content">
        <h1>${recipe.title}</h1>
        <p class="rw-subtitle">${recipe.description}</p>

        <div class="rw-actions">
          <button id="favorite-btn" class="rw-btn" type="button"></button>
          <button id="cooked-btn" class="rw-btn rw-primary" type="button"></button>
          <button id="shopping-btn" class="rw-btn" type="button">🛒 В покупки</button>
          <button id="share-btn" class="rw-btn" type="button">🔗 Поделиться</button>
        </div>

        <p id="recipe-notice" class="rw-notice"></p>
      </div>
    </section>

    <section class="rw-grid">
      <aside class="rw-panel">
        <h2>Ингредиенты</h2>
        <div class="rw-ingredients">${ingredientsRows}</div>
        ${ingredientNote}
      </aside>

      <section class="rw-panel">
        <h2>Приготовление</h2>
        <ol class="rw-steps">${stepsHtml}</ol>
      </section>
    </section>

    <section class="rw-panel rw-rating">
      <h2>Оценка</h2>

      <div id="stars" class="rw-stars"></div>

      <textarea
        id="review-text"
        class="rw-textarea"
        placeholder="Как получилось? Что бы ты изменил?"
      >${review}</textarea>

      <div class="rw-actions" style="margin-top: 14px;">
        <button id="save-review" class="rw-btn" type="button">Сохранить отзыв</button>
      </div>
    </section>
  `;

  updateFavoriteButton();
  updateCookedButton();
  renderStars();
  bindActions();
}

function renderNotFound() {
  pageEl.innerHTML = `
    <a class="rw-back" href="index.html">← Назад</a>

    <section class="rw-panel">
      <h1>Рецепт не найден</h1>
      <p class="rw-subtitle">
        Вернись на главную и выбери рецепт из списка.
      </p>
    </section>
  `;
}

async function init() {
  try {
    const response = await fetch("data/recipes.json");

    if (!response.ok) {
      throw new Error("Не удалось загрузить рецепты");
    }

    const recipes = await response.json();
    const recipe = recipes.find((item) => item.id === recipeId);

    if (!recipe) {
      renderNotFound();
      return;
    }

    renderRecipe(recipe);
  } catch (error) {
    console.error(error);
    renderNotFound();
  }
}

init();
