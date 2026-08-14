const pageEl = document.getElementById("recipe-page");
const params = new URLSearchParams(window.location.search);
const recipeId = Number(params.get("id"));

let currentRecipe = null;

function getSelectedIngredients() {
  return new Set(
    Store.getArray(STORAGE.selected).filter((name) =>
      INGREDIENTS_FALLBACK.includes(name)
    )
  );
}

const INGREDIENTS_FALLBACK = ALL_INGREDIENTS;

function fallbackSteps(recipe) {
  const ingredients = recipe.ingredients;
  const has = (name) => ingredients.includes(name);
  const steps = [];

  steps.push(`Подготовь все ингредиенты: ${ingredients.join(", ")}.`);

  if (recipe.category === "завтрак") {
    if (has("яйца")) steps.push("Разбей яйца в миску и слегка взбей вилкой.");
    if (has("молоко")) steps.push("Добавь молоко и ещё раз перемешай.");
    steps.push("Разогрей сковороду на среднем огне и добавь масло, если оно есть в составе.");
    steps.push(`Готовь около ${recipe.time} минут, пока блюдо не будет готово.`);
  } else if (recipe.category === "салат") {
    steps.push("Помой и нарежь овощи.");
    if (has("курица")) steps.push("Отвари или обжарь курицу и нарежь её.");
    if (has("яйца")) steps.push("Отвари яйца и нарежь их.");
    steps.push("Смешай все ингредиенты в миске.");
    steps.push("Заправь сметаной или маслом, посоли по вкусу.");
  } else if (recipe.category === "суп") {
    if (has("курица")) {
      steps.push("Отвари курицу в кастрюле с водой, снимая пену.");
    } else {
      steps.push("Поставь кастрюлю с водой на огонь и доведи до кипения.");
    }

    steps.push("Нарежь картофель и овощи, добавь в бульон.");
    steps.push(`Вари на среднем огне около ${recipe.time} минут.`);

    if (has("сметана")) steps.push("Подавай со сметаной.");
  } else {
    steps.push("Нарежь овощи и основные ингредиенты.");
    steps.push("Разогрей сковороду или кастрюлю с маслом.");

    if (has("курица") || has("фарш")) {
      steps.push("Обжарь мясо до готовности.");
    }

    steps.push("Добавь остальные ингредиенты и готовь до мягкости.");
    steps.push(`Готовь примерно ${recipe.time} минут, при необходимости добавь соль и специи.`);
  }

  return steps;
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

  button.textContent = isFavorite()
    ? "Убрать из избранного"
    : "В избранное";
}

function updateCookedButton() {
  const button = document.getElementById("cooked-btn");

  if (!button) return;

  const count = Store.getCookedCount(currentRecipe.id);

  button.textContent = count > 0
    ? `Приготовлено ×${count}. Отметить ещё раз`
    : "Отметить приготовленным";
}

function renderStars() {
  const container = document.getElementById("stars");

  if (!container) return;

  const rating = Store.getRating(currentRecipe.id);

  container.innerHTML = "";

  for (let i = 1; i <= 5; i += 1) {
    const star = document.createElement("button");
    star.type = "button";
    star.className = `star${i <= rating ? " active" : ""}`;
    star.textContent = "★";

    star.addEventListener("click", () => {
      Store.setRating(currentRecipe.id, i);
      renderStars();
      showNotice("Оценка сохранена.");
    });

    container.appendChild(star);
  }
}

function bindRecipeActions() {
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

      const missing = currentRecipe.ingredients.filter(
        (ingredient) => !selected.has(ingredient)
      );

      if (missing.length === 0) {
        showNotice("Все продукты уже есть в твоём списке продуктов.");
        return;
      }

      Store.addShoppingItems(missing);
      showNotice(`Добавлено в список покупок: ${missing.join(", ")}`);
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

  const selected = getSelectedIngredients();
  const matched = recipe.ingredients.filter((ingredient) =>
    selected.has(ingredient)
  ).length;

  const steps = Array.isArray(recipe.steps) && recipe.steps.length > 0
    ? recipe.steps
    : fallbackSteps(recipe);

  const ingredientsRows = recipe.ingredients
    .map((ingredient) => {
      const hasIngredient = selected.has(ingredient);

      const stateClass = hasIngredient ? "ok" : "no";
      const label = hasIngredient ? "есть" : selected.size > 0 ? "нет" : "—";

      return `
        <div class="ingredient-row">
          <span>${ingredient}</span>
          <span class="ingredient-state ${stateClass}">${label}</span>
        </div>
      `;
    })
    .join("");

  const stepsHtml = steps
    .map((step, index) => {
      return `
        <div class="step">
          <span class="step-num">${index + 1}</span>
          <p>${step}</p>
        </div>
      `;
    })
    .join("");

  const matchBadge = selected.size
    ? `<span class="badge ok">Совпало: ${matched} из ${recipe.ingredients.length}</span>`
    : "";

  const rating = Store.getRating(recipe.id);
  const review = Store.getReview(recipe.id);

  pageEl.innerHTML = `
    <a class="back-link" href="index.html">← Ко всем рецептам</a>

    <section class="panel glass recipe-hero">
      <div class="meta">
        <span class="badge category">${recipe.category || "рецепт"}</span>
        <span class="badge">⏱ ${recipe.time} мин</span>
        <span class="badge">${recipe.difficulty}</span>
        ${rating ? `<span class="badge ok">Твоя оценка: ★ ${rating}</span>` : ""}
        ${matchBadge}
      </div>

      <h1>${recipe.title}</h1>
      <p class="recipe-hero-subtitle">${recipe.description}</p>

      <div class="recipe-actions">
        <button id="favorite-btn" class="btn btn-secondary">В избранное</button>
        <button id="cooked-btn" class="btn btn-secondary">Отметить приготовленным</button>
        <button id="shopping-btn" class="btn btn-secondary">Добавить недостающее в покупки</button>
        <button id="share-btn" class="btn btn-secondary">Поделиться</button>
      </div>

      <p id="recipe-notice" class="notice"></p>
    </section>

    <div class="recipe-grid">
      <section class="panel glass">
        <h2>Ингредиенты</h2>
        <div class="ingredient-list">${ingredientsRows}</div>
        ${
          selected.size === 0
            ? `<p class="panel-subtitle">Отметь продукты на главной, чтобы увидеть, что уже есть.</p>`
            : ""
        }
      </section>

      <section class="panel glass">
        <h2>Приготовление</h2>
        <div class="steps-list">${stepsHtml}</div>
      </section>
    </div>

    <section class="panel glass" style="margin-top: 26px;">
      <h2>Твоя оценка и отзыв</h2>

      <div id="stars" class="stars"></div>

      <textarea
        id="review-text"
        class="review-area"
        placeholder="Как получилось? Что бы ты изменил?"
      >${review}</textarea>

      <div class="actions">
        <button id="save-review" class="btn btn-primary">Сохранить отзыв</button>
      </div>
    </section>
  `;

  updateFavoriteButton();
  updateCookedButton();
  renderStars();
  bindRecipeActions();
}

function renderNotFound() {
  pageEl.innerHTML = `
    <a class="back-link" href="index.html">← Ко всем рецептам</a>

    <section class="panel glass">
      <h1>Рецепт не найден</h1>
      <p class="recipe-hero-subtitle">
        Возможно, ссылка устарела. Вернись на главную и выбери рецепт из списка.
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
