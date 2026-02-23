const themeToggle = document.getElementById("theme-toggle");
/* ---------- Dark Mode ---------- */
function setTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
}

const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  setTheme(savedTheme === "dark");
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  setTheme(true);
}

themeToggle.addEventListener("click", () => {
  setTheme(!document.body.classList.contains("dark"));
});