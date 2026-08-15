(function () {
  const profileTab = document.querySelector('.tab[data-view="profile"]');
  if (profileTab) profileTab.remove();

  const profileView = document.getElementById("view-profile");
  if (profileView) profileView.remove();

  const heroPill = document.querySelector(".hero-pill");
  if (heroPill) heroPill.remove();

  const heroTitle = document.querySelector(".page-hero h1");
  if (heroTitle) {
    heroTitle.innerHTML =
      'Что приготовить <span class="wow-accent">из того, что есть?</span>';
  }

  const heroText = document.querySelector(".page-hero p");
  if (heroText) {
    heroText.textContent =
      "Выбери продукты — получи рецепты. Избранное и списки хранятся в браузере.";
  }
})();
