// ============ Mobile nav toggle ============
const hamburger = document.getElementById("hamburger");
const navList = document.getElementById("navList");

function setMenu(open) {
  hamburger.classList.toggle("active", open);
  navList.classList.toggle("active", open);
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

// Case study pages have no hamburger menu, so only wire it up when present.
if (hamburger && navList) {
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
}

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

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function applyTheme(next) {
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
  renderToggle();
}

// Circular reveal from the toggle button, like Android's
// ViewAnimationUtils.createCircularReveal. Falls back to an instant
// switch where the View Transitions API or motion is unavailable.
themeToggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";

  if (!document.startViewTransition || reduceMotion.matches) {
    applyTheme(next);
    return;
  }

  const rect = themeToggle.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Light expands out of the icon; dark is revealed as the light page
  // shrinks back into the icon.
  const toDark = next === "dark";
  const small = `circle(0px at ${x}px ${y}px)`;
  const full = `circle(${radius}px at ${x}px ${y}px)`;

  root.classList.add("theme-switching");
  root.classList.toggle("theme-to-dark", toDark);
  const transition = document.startViewTransition(() => applyTheme(next));
  let reveal;
  transition.ready.then(() => {
    reveal = root.animate(
      { clipPath: toDark ? [full, small] : [small, full] },
      {
        duration: 600,
        // Standard easing both ways. A decelerate curve on the expanding
        // circle covers the screen within the first frames and looks like
        // a flash, because the toggle sits in the corner.
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
        pseudoElement: toDark ? "::view-transition-old(root)" : "::view-transition-new(root)",
      }
    );
  });
  transition.finished.finally(() => {
    // Drop the finished animation. With fill: "forwards" it would otherwise
    // stay attached to ::view-transition-old(root) and clip the next
    // transition's old snapshot to nothing, so dark -> light would flash
    // to a blank page before the circle grows.
    reveal?.cancel();
    root.classList.remove("theme-switching", "theme-to-dark");
  });
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
  let current = null; // nothing highlighted while in the hero
  sections.forEach((sec) => {
    if (sec.getBoundingClientRect().top <= offset) current = sec;
  });
  // At the very bottom, the last section is always active
  if (sections.length && window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
    current = sections[sections.length - 1];
  }
  navLinks.forEach((link) => {
    const active = current !== null && link.getAttribute("href") === "#" + current.id;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

// ============ Scroll progress bar ============
const progressBar = document.getElementById("scrollProgress");

function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${ratio})`;
}

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveLink();
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true }
);
window.addEventListener("resize", () => {
  updateActiveLink();
  updateProgress();
});
updateActiveLink();
updateProgress();

// ============ Scroll reveal (staggered inside grids) ============
const revealEls = document.querySelectorAll(".reveal");

document
  .querySelectorAll(".project-grid, .cert-grid, .skills-grid, .hero-visual")
  .forEach((group) => {
    [...group.children]
      .filter((el) => el.classList.contains("reveal"))
      .forEach((el, i) => el.style.setProperty("--stagger", `${Math.min(i, 5) * 90}ms`));
  });

if ("IntersectionObserver" in window && revealEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add("in-view");
          observer.unobserve(el);
          // Once revealed, drop the reveal classes so the element's own
          // hover transitions apply without the reveal duration/delay.
          el.addEventListener(
            "transitionend",
            (e) => {
              if (e.propertyName !== "opacity") return;
              el.classList.remove("reveal", "in-view");
              el.style.removeProperty("--stagger");
            },
            { once: false }
          );
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("in-view"));
}

// ============ Code window: close / restore ============
const codeCard = document.querySelector(".code-card");
const codeClose = document.getElementById("codeClose");
const codeRestore = document.getElementById("codeRestore");

function afterTransition(el, fn) {
  if (reduceMotion.matches) return fn();
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      fn();
    }
  };
  el.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 300); // safety net if transitionend never fires
}

codeClose?.addEventListener("click", () => {
  codeCard.classList.remove("reveal", "in-view");
  codeCard.classList.add("is-closed");
  afterTransition(codeCard, () => {
    codeCard.hidden = true;
    codeRestore.hidden = false;
    codeRestore.classList.add("is-entering");
    requestAnimationFrame(() => requestAnimationFrame(() => codeRestore.classList.remove("is-entering")));
    codeRestore.focus({ preventScroll: true });
  });
});

codeRestore?.addEventListener("click", () => {
  codeRestore.hidden = true;
  codeCard.hidden = false;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      codeCard.classList.remove("is-closed");
      codeClose.focus({ preventScroll: true });
    })
  );
});

// ============ Footer year ============
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
