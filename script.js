// ============ Mobile nav toggle ============
const hamburger = document.getElementById("hamburger");
const navList = document.getElementById("navList");

function setMenu(open) {
  hamburger.classList.toggle("active", open);
  navList.classList.toggle("active", open);
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

hamburger.addEventListener("click", () => {
  setMenu(!navList.classList.contains("active"));
});

navList.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => setMenu(false))
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navList.classList.contains("active")) {
    setMenu(false);
    hamburger.focus();
  }
});

// ============ Theme (light / dark) ============
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function currentTheme() {
  return root.getAttribute("data-theme") || (darkQuery.matches ? "dark" : "light");
}

function renderToggle() {
  const dark = currentTheme() === "dark";
  const icon = themeToggle.querySelector("i");
  icon.className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

themeToggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
  renderToggle();
});

darkQuery.addEventListener?.("change", renderToggle);
renderToggle();

// ============ Active nav link on scroll ============
const navLinks = document.querySelectorAll(".nav-link");
const sections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function updateActiveLink() {
  const offset = window.innerHeight * 0.35;
  let current = sections[0];
  sections.forEach((sec) => {
    if (sec.getBoundingClientRect().top <= offset) current = sec;
  });
  // At the very bottom, the last section is always active
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
    current = sections[sections.length - 1];
  }
  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === "#" + current.id;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveLink();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true }
);
window.addEventListener("resize", updateActiveLink);
updateActiveLink();

// ============ Scroll reveal ============
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in-view"));
}

// ============ Footer year ============
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
