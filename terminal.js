/*
 * A small terminal for the portfolio. Opened from "> whoami" in the hero or the ` key.
 * Content is read from the page itself (experience, projects, skills), so it never drifts.
 * Everything the visitor types is rendered as text, never as HTML.
 *
 * Usage: KtTerminal.mount(dialogElement, { onPlay, onTheme });
 */
(function () {
  "use strict";

  const PROMPT = "reza@portfolio ~ $";

  function text(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  // ---------- data from the page ----------
  function readExperience() {
    return [...document.querySelectorAll(".timeline-item")].map((item) => ({
      role: text(item.querySelector(".timeline-role")).replace(/current$/, "").trim(),
      org: text(item.querySelector(".timeline-org")),
      date: text(item.querySelector(".timeline-date")),
    }));
  }

  function readProjects() {
    return [...document.querySelectorAll(".project-card")].map((card) => {
      const caseLink = card.querySelector("a.link-case");
      return {
        name: text(card.querySelector(".project-name")),
        meta: text(card.querySelector(".project-meta")),
        href: caseLink ? caseLink.getAttribute("href") : null,
        key: caseLink ? (caseLink.getAttribute("href").match(/projects\/(\w+)\.html/) || [])[1] : null,
      };
    });
  }

  function readSkills() {
    return [...document.querySelectorAll(".skill-group")].map((g) => ({
      title: text(g.querySelector(".skill-title")).replace(/^\/\/\s*/, ""),
      chips: [...g.querySelectorAll(".chip")].map(text),
    }));
  }

  function mount(dialog, hooks) {
    const out = dialog.querySelector(".term-output");
    const form = dialog.querySelector(".term-form");
    const input = dialog.querySelector(".term-input");
    const history = [];
    let historyAt = 0;

    // ---------- output helpers ----------
    function line(content, cls) {
      const p = document.createElement("p");
      p.className = "term-line" + (cls ? " " + cls : "");
      if (typeof content === "string") p.textContent = content;
      else content.forEach((part) => p.append(part));
      out.appendChild(p);
      return p;
    }

    function link(label, href, external) {
      const a = document.createElement("a");
      a.textContent = label;
      a.href = href;
      if (external) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      return a;
    }

    function span(t, cls) {
      const s = document.createElement("span");
      s.textContent = t;
      if (cls) s.className = cls;
      return s;
    }

    function echo(cmd) {
      line([span(PROMPT + " ", "term-prompt"), span(cmd)], "term-echo");
    }

    function scrollDown() {
      out.scrollTop = out.scrollHeight;
    }

    function close() {
      dialog.close();
    }

    function goTo(hash) {
      close();
      const target = document.querySelector(hash);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", hash);
    }

    // ---------- commands ----------
    const commands = {
      help: {
        about: "list the commands",
        run() {
          Object.keys(commands)
            .filter((c) => !commands[c].hidden)
            .forEach((c) => line([span(c.padEnd(12), "term-key"), span(commands[c].about, "term-dim")]));
          line("tip: Tab completes, ↑/↓ walks your history, Esc closes.", "term-dim");
        },
      },
      whoami: {
        about: "who am I",
        run() {
          line([span(text(document.querySelector(".hero-name")), "term-strong")]);
          line(text(document.querySelector(".hero-role")));
          line(text(document.querySelector(".hero-bio")), "term-dim");
        },
      },
      experience: {
        about: "where I've worked",
        run() {
          readExperience().forEach((e) => {
            line([span(e.role, "term-strong")]);
            line([span(e.org), span("  " + e.date, "term-dim")]);
          });
        },
      },
      projects: {
        about: "what I've built (open <name> for a case study)",
        run() {
          readProjects().forEach((p) => {
            const parts = [span(p.name.padEnd(16), "term-strong"), span(p.meta, "term-dim")];
            if (p.href) parts.push(span("  "), link("case study →", p.href));
            line(parts);
          });
        },
      },
      skills: {
        about: "the stack I work with",
        run() {
          readSkills().forEach((g) => {
            line([span(g.title, "term-key")]);
            line(g.chips.join(" · "), "term-dim");
          });
        },
      },
      contact: {
        about: "how to reach me",
        run() {
          line([span("email    ", "term-key"), link("rezaagung3910@gmail.com", "mailto:rezaagung3910@gmail.com")]);
          line([span("linkedin ", "term-key"), link("linkedin.com/in/rezaagn2", "https://www.linkedin.com/in/rezaagn2/", true)]);
          line([span("github   ", "term-key"), link("github.com/rezaagung1101", "https://github.com/rezaagung1101", true)]);
        },
      },
      resume: {
        about: "open my CV (PDF)",
        run() {
          line([span("opening "), link("Reza_Agung_Nugraha_CV.pdf", "assets/Reza_Agung_Nugraha_CV.pdf", true), span(" …")]);
          window.open("assets/Reza_Agung_Nugraha_CV.pdf", "_blank", "noopener");
        },
      },
      open: {
        about: "open a case study: open xporter | qurbanku | tipsntrip",
        run(args) {
          const want = (args[0] || "").toLowerCase().replace(/[^a-z]/g, "");
          const match = readProjects().find((p) => p.key && (p.key === want || p.name.toLowerCase().replace(/[^a-z]/g, "").startsWith(want)));
          if (!want) return line("usage: open <project>   e.g. open xporter", "term-dim");
          if (!match) return line(`no case study called "${args[0]}". Try: projects`, "term-err");
          line(`opening ${match.name} …`, "term-dim");
          window.location.href = match.href;
        },
      },
      cd: {
        about: "jump to a section: cd projects | skills | contact …",
        run(args) {
          const want = (args[0] || "").toLowerCase().replace(/[^a-z]/g, "");
          const sections = ["about", "experience", "education", "skills", "projects", "certification", "contact"];
          const hit = sections.find((s) => s === want || (want && s.startsWith(want)));
          if (!want || want === "home") return goTo("#about");
          if (!hit) return line(`cd: no such section: ${args[0]}. Try: ls`, "term-err");
          goTo("#" + hit);
        },
      },
      ls: {
        about: "list the sections",
        run() {
          line("about/  experience/  education/  skills/  projects/  certification/  contact/  resume.pdf", "term-key");
        },
      },
      play: {
        about: "play Ship It!, a tiny .kt runner",
        run() {
          close();
          hooks.onPlay && hooks.onPlay();
        },
      },
      theme: {
        about: "switch theme: theme | theme dark | theme light",
        run(args) {
          const want = (args[0] || "").toLowerCase();
          const now = hooks.currentTheme ? hooks.currentTheme() : "";
          if (want && want !== "dark" && want !== "light") return line("usage: theme [dark|light]", "term-dim");
          if (want && want === now) return line(`already ${now}`, "term-dim");
          hooks.onTheme && hooks.onTheme();
          line(`theme: ${hooks.currentTheme ? hooks.currentTheme() : "switched"}`, "term-dim");
        },
      },
      date: {
        about: "today's date",
        run() {
          line(new Date().toString());
        },
      },
      echo: {
        about: "print text",
        run(args) {
          line(args.join(" "));
        },
      },
      clear: {
        about: "clear the screen",
        run() {
          out.textContent = "";
        },
      },
      exit: {
        about: "close the terminal",
        run() {
          close();
        },
      },
      // easter eggs, not listed in help
      sudo: {
        hidden: true,
        run(args) {
          if (args.join(" ").toLowerCase() === "hire reza") {
            line("[sudo] password for recruiter: ••••••••", "term-dim");
            line([span("✓ permission granted. ", "term-ok"), link("Send the offer →", "mailto:rezaagung3910@gmail.com?subject=Let%27s%20work%20together")]);
          } else {
            line("nice try. Try: sudo hire reza", "term-dim");
          }
        },
      },
      hire: { hidden: true, run: () => commands.sudo.run(["hire", "reza"]) },
      gradle: {
        hidden: true,
        run() {
          line("> Task :app:assembleRelease", "term-dim");
          line("BUILD SUCCESSFUL in 0s ☕", "term-ok");
        },
      },
    };

    function run(raw) {
      const cmd = raw.trim();
      echo(cmd);
      if (!cmd) return;
      history.push(cmd);
      historyAt = history.length;
      const [name, ...args] = cmd.split(/\s+/);
      const c = commands[name.toLowerCase()];
      if (c) c.run(args);
      else line(`command not found: ${name}. Type help`, "term-err");
    }

    function complete() {
      const v = input.value.trimStart();
      if (!v || v.includes(" ")) return;
      const names = Object.keys(commands).filter((c) => !commands[c].hidden && c.startsWith(v.toLowerCase()));
      if (names.length === 1) input.value = names[0] + " ";
      else if (names.length > 1) line(names.join("  "), "term-dim");
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value;
      input.value = "";
      run(v);
      scrollDown();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        complete();
        scrollDown();
      } else if (e.key === "ArrowUp") {
        if (!history.length) return;
        e.preventDefault();
        historyAt = Math.max(0, historyAt - 1);
        input.value = history[historyAt];
      } else if (e.key === "ArrowDown") {
        if (!history.length) return;
        e.preventDefault();
        historyAt = Math.min(history.length, historyAt + 1);
        input.value = history[historyAt] || "";
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        out.textContent = "";
      }
    });

    // Clicking anywhere in the screen focuses the prompt, like a real terminal.
    out.addEventListener("click", (e) => {
      if (!e.target.closest("a") && !window.getSelection().toString()) input.focus();
    });

    // greeting
    line([span("Welcome to "), span("reza.kt", "term-strong"), span(" — type "), span("help", "term-key"), span(" to get started.")]);

    return {
      focus() {
        input.focus();
      },
      run,
    };
  }

  window.KtTerminal = { mount };
})();
