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
  themeToggle.dataset.mode = dark ? "dark" : "light"; // CSS shows the sun in dark mode, the moon in light
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function applyTheme(next) {
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
  renderToggle();
  syncThemeColor();
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

// Keep the browser's UI colour (mobile address bar) in step with the page, including manual switches.
function syncThemeColor() {
  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
}

darkQuery.addEventListener?.("change", () => {
  renderToggle();
  syncThemeColor();
});
renderToggle();
syncThemeColor();

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

// ============ Scrollytelling: switch the phone screen per step ============
const storySteps = document.querySelectorAll(".story-step");
const storyShots = document.querySelectorAll(".story-shot");

if (storySteps.length && "IntersectionObserver" in window) {
  const setStep = (i) => {
    storySteps.forEach((step) => step.classList.toggle("is-active", step.dataset.i === i));
    storyShots.forEach((shot) => shot.classList.toggle("is-active", shot.dataset.i === i));
  };
  // A step becomes active when it crosses the middle band of the viewport.
  const storyObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setStep(e.target.dataset.i)),
    { rootMargin: "-45% 0px -45% 0px" }
  );
  storySteps.forEach((step) => storyObserver.observe(step));
}

// ============ Charts: draw once they scroll into view ============
const charts = document.querySelectorAll(".speed-chart, .stack-matrix");

if (charts.length) {
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const chartObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-drawn");
            chartObserver.unobserve(e.target);
          }
        }),
      { threshold: 0.35 }
    );
    charts.forEach((c) => chartObserver.observe(c));
  } else {
    charts.forEach((c) => c.classList.add("is-drawn"));
  }
}

// ============ Stack matrix: highlight the hovered project column ============
const matrix = document.querySelector(".stack-matrix");

if (matrix) {
  const setCol = (col) =>
    matrix.querySelectorAll("[data-col]").forEach((cell) => cell.classList.toggle("col-hover", cell.dataset.col === col));
  matrix.addEventListener("mouseover", (e) => {
    const cell = e.target.closest("[data-col]");
    setCol(cell ? cell.dataset.col : null);
  });
  matrix.addEventListener("mouseleave", () => setCol(null));
  matrix.addEventListener("focusin", (e) => {
    const cell = e.target.closest("[data-col]");
    if (cell) setCol(cell.dataset.col);
  });
  matrix.addEventListener("focusout", () => setCol(null));
}

// ============ Impact numbers: count up once when they come into view ============
// The final values are already in the HTML, so search engines, screen readers and
// visitors without JS (or with reduced motion) always see the right numbers.
const counters = document.querySelectorAll("[data-count-to]");

if (counters.length && "IntersectionObserver" in window && !reduceMotion.matches) {
  const format = (el, value) => {
    const decimals = Number(el.dataset.decimals || 0);
    return (el.dataset.prefix || "") + value.toFixed(decimals) + (el.dataset.suffix || "");
  };

  let countersDone = false; // set when printing: jump to the final values and stop
  const countUp = (el) => {
    const target = Number(el.dataset.countTo);
    const duration = 900;
    const start = performance.now();
    const step = (now) => {
      if (countersDone) return (el.textContent = format(el, target));
      // rAF timestamps can be slightly earlier than performance.now(): clamp so we never show a negative number
      const t = Math.min(Math.max((now - start) / duration, 0), 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = format(el, target * eased);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = format(el, target);
    };
    requestAnimationFrame(step);
  };

  counters.forEach((el) => (el.textContent = format(el, 0)));
  // Printing (or saving as PDF) before scrolling down must still show the real numbers.
  window.addEventListener("beforeprint", () => {
    countersDone = true;
    counters.forEach((el) => (el.textContent = format(el, Number(el.dataset.countTo))));
  });
  const counterObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          countUp(e.target);
          counterObserver.unobserve(e.target);
        }
      }),
    { threshold: 0.6 }
  );
  counters.forEach((el) => counterObserver.observe(el));
}

// ============ Case study header: show the project title once the hero title is gone ============
const caseTitle = document.querySelector(".case-title");
const siteHeader = document.querySelector("header");

if (caseTitle && siteHeader && "IntersectionObserver" in window) {
  const swapped = siteHeader.querySelectorAll(".case-nav-title, .case-nav-cta");
  const originals = siteHeader.querySelectorAll(".nav-swap .brand, .nav-swap-end .back-link");
  const setCondensed = (on) => {
    siteHeader.classList.toggle("is-condensed", on);
    // Only the visible item of each pair is focusable and announced.
    swapped.forEach((el) => {
      el.tabIndex = on ? 0 : -1;
      el.toggleAttribute("aria-hidden", !on);
    });
    originals.forEach((el) => {
      el.tabIndex = on ? -1 : 0;
      el.toggleAttribute("aria-hidden", on);
    });
  };
  new IntersectionObserver(
    ([entry]) => setCondensed(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    { rootMargin: "-64px 0px 0px 0px" }
  ).observe(caseTitle);
}

// ============ "Ship It!" mini game: loaded only when someone asks for it ============
let gameScript = null;

function loadGame(src) {
  if (window.KtRunner) return Promise.resolve(window.KtRunner);
  if (!gameScript) {
    gameScript = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = () => resolve(window.KtRunner);
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }
  return gameScript;
}

// Easter egg: reza.play() in the hero code card opens the game in a dialog.
const playButton = document.getElementById("playGame");
const gameDialog = document.getElementById("gameDialog");

if (playButton && gameDialog && typeof gameDialog.showModal === "function") {
  let game = null;
  playButton.addEventListener("click", () => {
    gameDialog.showModal();
    loadGame("game.js").then((KtRunner) => {
      if (!game) game = KtRunner.mount(document.getElementById("gameMount"));
      game.focus();
    });
  });
  document.getElementById("gameClose").addEventListener("click", () => gameDialog.close());
  // Clicking the dimmed backdrop closes it too.
  gameDialog.addEventListener("click", (e) => {
    if (e.target !== gameDialog) return;
    const r = gameDialog.getBoundingClientRect();
    const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (outside) gameDialog.close();
  });
  gameDialog.addEventListener("close", () => {
    if (game) game.pause();
    playButton.focus({ preventScroll: true });
  });
} else if (playButton) {
  playButton.hidden = true; // very old browsers without <dialog>
}

// ============ Terminal: "> whoami" in the hero, or the ` key anywhere ============
const termOpen = document.getElementById("termOpen");
const termDialog = document.getElementById("termDialog");

if (termOpen && termDialog && typeof termDialog.showModal === "function") {
  let terminal = null;
  let termScript = null;
  const loadTerminal = () => {
    if (window.KtTerminal) return Promise.resolve(window.KtTerminal);
    if (!termScript) {
      termScript = new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src = "terminal.js";
        el.onload = () => resolve(window.KtTerminal);
        el.onerror = reject;
        document.head.appendChild(el);
      });
    }
    return termScript;
  };
  const openTerminal = () => {
    if (termDialog.open) return;
    termDialog.showModal();
    loadTerminal().then((KtTerminal) => {
      if (!terminal) {
        terminal = KtTerminal.mount(termDialog, {
          onPlay: () => playButton && playButton.click(),
          onTheme: () => themeToggle.click(),
          currentTheme,
        });
      }
      terminal.focus();
    });
  };
  termOpen.addEventListener("click", openTerminal);
  document.getElementById("termClose").addEventListener("click", () => termDialog.close());
  termDialog.addEventListener("click", (e) => {
    if (e.target !== termDialog) return;
    const r = termDialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) termDialog.close();
  });
  termDialog.addEventListener("close", () => termOpen.focus({ preventScroll: true }));

  // The backtick opens it, unless someone is typing or another dialog is open.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "`" || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
    if (document.querySelector("dialog[open]")) return;
    e.preventDefault();
    openTerminal();
  });
}

// The 404 page mounts the game straight away.
const notFoundGame = document.getElementById("notFoundGame");
if (notFoundGame) {
  loadGame("/game.js").then((KtRunner) => KtRunner.mount(notFoundGame));
}

// ============ Card spotlight: track the pointer inside cards (mouse only) ============
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const spotCards = document.querySelectorAll(
    ".project-card, .skill-group, .cert-card, .edu-card, .decision, .flow-step, .stat-strip > div, .showcase"
  );
  spotCards.forEach((el) => el.classList.add("spot"));

  let spotTarget = null;
  let spotEvent = null;
  let spotQueued = false;
  document.addEventListener(
    "pointermove",
    (e) => {
      spotTarget = e.target.closest && e.target.closest(".spot");
      spotEvent = e;
      if (spotTarget && !spotQueued) {
        spotQueued = true;
        requestAnimationFrame(() => {
          spotQueued = false;
          if (!spotTarget) return;
          const r = spotTarget.getBoundingClientRect();
          spotTarget.style.setProperty("--mx", spotEvent.clientX - r.left + "px");
          spotTarget.style.setProperty("--my", spotEvent.clientY - r.top + "px");
        });
      }
    },
    { passive: true }
  );
}

// ============ Experience timeline: draw the line with scroll and light up dots ============
const timeline = document.querySelector(".timeline");

if (timeline) {
  const items = [...timeline.querySelectorAll(".timeline-item")];
  const line = document.createElement("div");
  line.className = "timeline-progress";
  line.setAttribute("aria-hidden", "true");
  // First child, so the last timeline item stays :last-child (no connector below it).
  timeline.prepend(line);
  timeline.classList.add("timeline-animated");

  const DOT_CENTER = 5 + 8.5; // dot top offset + half its size
  let dotY = []; // each dot's centre, relative to the timeline top

  // Measured without the reveal translate, so the line lines up with the dots.
  const measure = () => {
    const top = timeline.getBoundingClientRect().top;
    dotY = items.map((el) => {
      const ty = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 || 0;
      return el.getBoundingClientRect().top - top - ty + DOT_CENTER;
    });
    const first = dotY[0];
    const last = dotY[dotY.length - 1];
    line.style.top = first + "px";
    line.style.height = Math.max(last - first, 0) + "px";
  };

  const draw = () => {
    if (!dotY.length) return;
    // The "pen" sits 60% down the viewport.
    const reach = window.innerHeight * 0.6 - timeline.getBoundingClientRect().top;
    const first = dotY[0];
    const span = Math.max(dotY[dotY.length - 1] - first, 1);
    const progress = Math.min(Math.max((reach - first) / span, 0), 1);
    line.style.transform = `scaleY(${progress})`;
    items.forEach((item, i) => item.classList.toggle("is-lit", reach >= dotY[i] - 2));
  };

  const remeasure = () => {
    measure();
    draw();
  };

  let queued = false;
  window.addEventListener(
    "scroll",
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        draw();
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", remeasure);
  // Reveal animations and late fonts move things for a moment; settle afterwards.
  window.addEventListener("load", remeasure);
  setTimeout(remeasure, 900);
  remeasure();
}

// ============ Contact: copy the email address ============
const copyBtn = document.getElementById("copyEmail");
const copyToast = document.getElementById("copyToast");

if (copyBtn) {
  let copyTimer = 0;
  copyBtn.addEventListener("click", async () => {
    const value = copyBtn.dataset.copy;
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch (e) {
      // Older browsers or blocked clipboard: fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch (err) {
        ok = false;
      }
      ta.remove();
    }
    copyBtn.classList.toggle("is-copied", ok);
    copyBtn.querySelector(".copy-label").textContent = ok ? "Copied" : "Copy";
    copyToast.textContent = ok ? "Email copied to clipboard" : "Couldn't copy. Select the address instead.";
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copyBtn.classList.remove("is-copied");
      copyBtn.querySelector(".copy-label").textContent = "Copy";
      copyToast.textContent = "";
    }, 2200);
  });
}

// ============ Mobile menu: tapping outside closes it ============
if (hamburger && navList) {
  document.addEventListener("pointerdown", (e) => {
    if (!navList.classList.contains("active")) return;
    if (e.target.closest("#navList, #hamburger")) return;
    setMenu(false);
  });
}

// ============ Footer year ============
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
