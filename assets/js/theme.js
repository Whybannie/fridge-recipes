(function () {
  const stored = localStorage.getItem("hs-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored || (prefersDark ? "dark" : "light");

  document.documentElement.setAttribute("data-theme", theme);
})();

document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("theme-toggle");

  if (!button) return;

  function updateIcon() {
    const current = document.documentElement.getAttribute("data-theme");
    button.textContent = current === "dark" ? "☀️" : "🌙";
  }

  updateIcon();

  button.addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("hs-theme", next);
    updateIcon();
  });
});
