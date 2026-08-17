let currentGame = "dota";

const inputEl = document.getElementById("player-id");
const checkBtn = document.getElementById("check-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const tabs = document.querySelectorAll(".game-tab");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updatePlaceholder() {
  if (currentGame === "dota") {
    inputEl.placeholder = "Введи Dota 2 Account ID";
  }

  if (currentGame === "genshin") {
    inputEl.placeholder = "Введи Genshin Impact UID";
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.game === "brawl") {
      statusEl.textContent =
        "Brawl Stars подключим позже: нужен официальный API-ключ.";
      return;
    }

    currentGame = tab.dataset.game;

    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");

    updatePlaceholder();

    resultEl.innerHTML = "";
    statusEl.textContent = "";
  });
});

checkBtn.addEventListener("click", check);

inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    check();
  }
});

async function check() {
  const id = inputEl.value.trim();

  if (!id) {
    statusEl.textContent = "Введи ID игрока.";
    return;
  }

  resultEl.innerHTML = "";
  statusEl.textContent = "Загружаем данные...";

  try {
    if (currentGame === "dota") {
      await checkDota(id);
    }

    if (currentGame === "genshin") {
      await checkGenshin(id);
    }

    statusEl.textContent = "Готово.";
  } catch (error) {
    console.error(error);

    resultEl.innerHTML = errorBox(
      "Не удалось получить данные. Проверь ID, открытость профиля и интернет."
    );

    statusEl.textContent = "Ошибка загрузки.";
  }
}

async function checkDota(id) {
  const accountId = id.replace(/[^0-9]/g, "");

  if (!accountId) {
    throw new Error("Dota 2 ID должен содержать цифры.");
  }

  const response = await fetch(
    `https://api.opendota.com/api/players/${accountId}`
  );

  if (!response.ok) {
    throw new Error("OpenDota API error");
  }

  const data = await response.json();

  if (!data.profile) {
    throw new Error("Профиль не найден.");
  }

  renderDota(data);
}

function getDotaRank(rankTier, leaderboardRank) {
  if (!rankTier) {
    return {
      label: "Без рейтинга",
      tier: 0
    };
  }

  const names = {
    1: "Herald",
    2: "Guardian",
    3: "Crusader",
    4: "Archon",
    5: "Legend",
    6: "Ancient",
    7: "Divine",
    8: "Immortal"
  };

  const tier = Math.floor(rankTier / 10);
  const star = rankTier % 10;

  if (tier === 8) {
    return {
      label: leaderboardRank
        ? `Immortal #${leaderboardRank}`
        : "Immortal",
      tier
    };
  }

  return {
    label: `${names[tier] || "Unknown"} ${star}`,
    tier
  };
}

function getDotaScore(data) {
  const wins = data.win || 0;
  const lose = data.lose || 0;
  const total = wins + lose;
  const winrate = total ? wins / total : 0;

  const rankTier = data.rank_tier || 0;
  const tier = Math.floor(rankTier / 10);

  let score = Math.round(winrate * 50 + tier * 6);

  if (data.leaderboard_rank) {
    score += 10;
  }

  return Math.max(1, Math.min(100, score));
}

function renderDota(data) {
  const profile = data.profile || {};

  const wins = data.win || 0;
  const lose = data.lose || 0;
  const total = wins + lose;
  const winrate = total ? Math.round((wins / total) * 100) : 0;

  const rank = getDotaRank(data.rank_tier, data.leaderboard_rank);
  const score = getDotaScore(data);

  const avatarHtml = profile.avatarfull
    ? `<img class="avatar" src="${escapeHtml(profile.avatarfull)}" alt="Аватар" />`
    : `<div class="avatar avatar-placeholder">🎮</div>`;

  resultEl.innerHTML = `
    <div class="profile-card">
      ${avatarHtml}

      <div>
        <div class="score-badge">Gamer Score: ${score}/100</div>

        <h3 class="profile-name">
          ${escapeHtml(profile.personaname || "Игрок")}
        </h3>

        <p class="profile-game">
          Dota 2 • ${escapeHtml(rank.label)}
        </p>

        <div class="stats">
          <div class="stat">
            <span>Винрейт</span>
            <strong>${winrate}%</strong>
          </div>

          <div class="stat">
            <span>Победы</span>
            <strong>${wins}</strong>
          </div>

          <div class="stat">
            <span>Поражения</span>
            <strong>${lose}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function checkGenshin(uid) {
  const genshinUid = uid.replace(/[^0-9]/g, "");

  if (!genshinUid) {
    throw new Error("Genshin UID должен содержать цифры.");
  }

  const response = await fetch(
    `https://enka.network/api/uid/${genshinUid}`
  );

  if (!response.ok) {
    throw new Error("Enka API error");
  }

  const data = await response.json();

  if (!data.playerInfo) {
    throw new Error("Профиль Genshin не найден.");
  }

  renderGenshin(data);
}

function getGenshinScore(playerInfo) {
  const level = playerInfo.level || 1;
  const worldLevel = playerInfo.worldLevel || 1;

  let score = Math.round((level / 60) * 70 + (worldLevel / 8) * 30);

  return Math.max(1, Math.min(100, score));
}

function renderGenshin(data) {
  const info = data.playerInfo || {};
  const characters = Array.isArray(data.avatarInfoList)
    ? data.avatarInfoList.length
    : 0;

  const score = getGenshinScore(info);

  resultEl.innerHTML = `
    <div class="profile-card">
      <div class="avatar avatar-placeholder">🌟</div>

      <div>
        <div class="score-badge">Gamer Score: ${score}/100</div>

        <h3 class="profile-name">
          ${escapeHtml(info.nickname || "Путешественник")}
        </h3>

        <p class="profile-game">
          Genshin Impact • AR ${escapeHtml(info.level || "?")}
        </p>

        <div class="stats">
          <div class="stat">
            <span>Adventure Rank</span>
            <strong>${escapeHtml(info.level || "?")}</strong>
          </div>

          <div class="stat">
            <span>World Level</span>
            <strong>${escapeHtml(info.worldLevel || "?")}</strong>
          </div>

          <div class="stat">
            <span>Персонажи</span>
            <strong>${characters}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function errorBox(message) {
  return `<div class="error">${escapeHtml(message)}</div>`;
}
