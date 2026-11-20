/*
 * "Ship It!": a tiny endless runner starring the .kt block.
 * Jump over build errors, duck under ANRs and crashes.
 * Loaded only when needed (the 404 page and the reza.play() easter egg).
 *
 * Usage: const game = KtRunner.mount(containerElement); game.destroy();
 */
(function () {
  "use strict";

  // Logical canvas size, scaled to fit the phone screen. Narrow screens get a
  // shorter track so the block, obstacles and text stay readable.
  let W = 640;
  const H = 260;
  const GROUND = H - 34;
  const GRAVITY = 2600; // px/s²
  const JUMP_V = -860; // px/s
  const START_SPEED = 330; // px/s
  const MAX_SPEED = 760;
  const ACCEL = 9; // px/s per second

  const GROUND_LABELS = ["NPE", "OOM", "Lint", "Gradle ✗", "R8 ✗"];
  const AIR_LABELS = ["ANR", "Crash"];
  const BEST_KEY = "ktRunnerBest";

  function readBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(v) {
    try {
      localStorage.setItem(BEST_KEY, String(v));
    } catch (e) {
      /* storage blocked: best score just won't persist */
    }
  }

  function css(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function mount(container) {
    container.innerHTML = "";
    container.classList.add("kt-runner");

    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute(
      "aria-label",
      "Ship It, a mini runner game. Press Space or tap Jump to jump over build errors, hold Down or Duck to slide under ANRs and crashes."
    );
    canvas.tabIndex = 0;
    container.appendChild(canvas);

    const controls = document.createElement("div");
    controls.className = "kt-runner-controls";
    controls.innerHTML =
      '<button type="button" class="kt-btn" data-act="duck" aria-label="Duck">↓ Duck</button>' +
      '<button type="button" class="kt-btn kt-btn-primary" data-act="jump" aria-label="Jump">↑ Jump</button>';
    container.appendChild(controls);

    const ctx = canvas.getContext("2d");
    W = (container.clientWidth || 640) < 480 ? 420 : 640;
    let colors = {};
    let colorClock = 0;

    function refreshColors() {
      colors = {
        bg: css("--surface", "#ffffff"),
        ink: css("--ink", "#16171a"),
        muted: css("--muted", "#686b73"),
        faint: css("--faint", "#9a9da4"),
        line: css("--line", "#e6e4de"),
        purple: css("--purple", "#7f52ff"),
        orange: css("--orange", "#ff7a59"),
        onInk: css("--on-ink", "#ffffff"),
        mono: css("--font-mono", "monospace"),
        display: css("--font-display", "sans-serif"),
      };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || W;
      const cssH = (cssW * H) / W;
      canvas.style.height = cssH + "px";
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    }

    // ---------- game state ----------
    let state = "ready"; // ready | running | over
    let player, obstacles, speed, distance, nextGap, best, hitLabel, t, ducking, clouds;

    function reset() {
      player = { x: 64, y: GROUND, vy: 0, onGround: true };
      obstacles = [];
      speed = START_SPEED;
      distance = 0;
      nextGap = 380;
      best = readBest();
      hitLabel = "";
      t = 0;
      ducking = false;
      clouds = [
        { x: W * 0.19, y: 48, w: 46 },
        { x: W * 0.6, y: 30, w: 64 },
        { x: W * 0.88, y: 70, w: 38 },
      ];
    }

    function score() {
      return Math.floor(distance / 12);
    }

    function playerBox() {
      const w = ducking && player.onGround ? 44 : 34;
      const h = ducking && player.onGround ? 20 : 34;
      return { x: player.x, y: player.y - h, w, h };
    }

    function spawn() {
      const airAllowed = score() > 120;
      if (airAllowed && Math.random() < 0.32) {
        const label = AIR_LABELS[Math.floor(Math.random() * AIR_LABELS.length)];
        // Bottom sits between a ducking (20px) and a standing (34px) player.
        const h = 22;
        const bottom = GROUND - 25;
        obstacles.push({ kind: "air", x: W + 10, y: bottom - h, w: 54, h, label });
      } else {
        const label = GROUND_LABELS[Math.floor(Math.random() * GROUND_LABELS.length)];
        const tall = Math.random() < 0.35;
        const w = label.length > 4 ? 58 : 34 + Math.random() * 10;
        const h = tall ? 44 : 30;
        obstacles.push({ kind: "ground", x: W + 10, y: GROUND - h, w, h, label });
      }
      // Gap grows with speed so the game stays fair.
      nextGap = 240 + speed * 0.55 + Math.random() * 220;
    }

    function jump() {
      if (state !== "running") return start();
      if (player.onGround) {
        player.vy = JUMP_V;
        player.onGround = false;
      }
    }

    function setDuck(on) {
      if (state !== "running") return;
      ducking = on;
      // Ducking in the air pulls the block down faster.
      if (on && !player.onGround) player.vy = Math.max(player.vy, 600);
    }

    function start() {
      reset();
      state = "running";
      last = performance.now();
      loop(last);
    }

    function gameOver(label) {
      state = "over";
      hitLabel = label;
      if (score() > best) {
        best = score();
        saveBest(best);
      }
      draw();
    }

    function update(dt) {
      t += dt;
      speed = Math.min(MAX_SPEED, speed + ACCEL * dt);
      distance += speed * dt;

      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y >= GROUND) {
        player.y = GROUND;
        player.vy = 0;
        player.onGround = true;
      }

      nextGap -= speed * dt;
      if (nextGap <= 0) spawn();

      for (const o of obstacles) o.x -= speed * dt;
      obstacles = obstacles.filter((o) => o.x + o.w > -20);
      for (const c of clouds) {
        c.x -= speed * 0.15 * dt;
        if (c.x + c.w < 0) c.x = W + Math.random() * 120;
      }

      const p = playerBox();
      const pad = 4;
      for (const o of obstacles) {
        if (
          p.x + pad < o.x + o.w &&
          p.x + p.w - pad > o.x &&
          p.y + pad < o.y + o.h &&
          p.y + p.h - pad > o.y
        ) {
          gameOver(o.label);
          return;
        }
      }
    }

    // ---------- drawing ----------
    function drawPlayer() {
      const p = playerBox();
      ctx.fillStyle = colors.purple;
      roundRect(ctx, p.x, p.y, p.w, p.h, 7);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${ducking && player.onGround ? 10 : 12}px ${colors.mono}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(".kt", p.x + p.w / 2, p.y + p.h / 2 + 1);

      // Little running legs; tucked while jumping or ducking.
      if (player.onGround && !ducking && state === "running") {
        const phase = Math.floor(t * 14) % 2;
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x + 10, p.y + p.h);
        ctx.lineTo(p.x + 10 + (phase ? 4 : -2), p.y + p.h + 5);
        ctx.moveTo(p.x + p.w - 10, p.y + p.h);
        ctx.lineTo(p.x + p.w - 10 + (phase ? -2 : 4), p.y + p.h + 5);
        ctx.stroke();
      }
    }

    function drawObstacle(o) {
      if (o.kind === "ground") {
        ctx.fillStyle = colors.ink;
        roundRect(ctx, o.x, o.y, o.w, o.h, 6);
        ctx.fill();
        ctx.fillStyle = colors.onInk;
      } else {
        // Flying error with tiny flapping wings
        const flap = Math.floor(t * 8) % 2 ? -5 : 4;
        ctx.strokeStyle = colors.orange;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(o.x + 14, o.y + o.h / 2);
        ctx.lineTo(o.x + 6, o.y + o.h / 2 + flap);
        ctx.moveTo(o.x + o.w - 14, o.y + o.h / 2);
        ctx.lineTo(o.x + o.w - 6, o.y + o.h / 2 + flap);
        ctx.stroke();
        ctx.fillStyle = colors.orange;
        roundRect(ctx, o.x + 8, o.y, o.w - 16, o.h, 11);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
      }
      ctx.font = `700 10px ${colors.mono}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 1);
    }

    function draw() {
      colorClock -= 1;
      if (colorClock <= 0) {
        refreshColors(); // follows the light/dark theme
        colorClock = 30;
      }

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      // clouds = faint code comments drifting by
      ctx.fillStyle = colors.line;
      for (const c of clouds) {
        roundRect(ctx, c.x, c.y, c.w, 10, 5);
        ctx.fill();
      }

      // ground line with dashed "track"
      ctx.strokeStyle = colors.faint;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 0.5);
      ctx.lineTo(W, GROUND + 0.5);
      ctx.stroke();
      ctx.strokeStyle = colors.line;
      ctx.setLineDash([6, 14]);
      ctx.lineDashOffset = distance % 20;
      ctx.beginPath();
      ctx.moveTo(0, GROUND + 12);
      ctx.lineTo(W, GROUND + 12);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const o of obstacles) drawObstacle(o);
      drawPlayer();

      // HUD
      ctx.textBaseline = "top";
      ctx.textAlign = "right";
      ctx.font = `500 12px ${colors.mono}`;
      ctx.fillStyle = colors.muted;
      ctx.fillText(`best ${String(best).padStart(4, "0")}`, W - 16, 14);
      ctx.fillStyle = colors.ink;
      ctx.fillText(`builds shipped ${String(score()).padStart(4, "0")}`, W - 16, 32);

      if (state !== "running") {
        ctx.fillStyle = colors.bg;
        ctx.globalAlpha = 0.86;
        ctx.fillRect(0, 70, W, 96);
        ctx.globalAlpha = 1;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (state === "ready") {
          ctx.fillStyle = colors.ink;
          ctx.font = `700 22px ${colors.display}`;
          ctx.fillText("Ship It!", W / 2, 100);
          ctx.fillStyle = colors.muted;
          ctx.font = `500 12px ${colors.mono}`;
          ctx.fillText("Space / tap Jump to start · ↓ to duck", W / 2, 132);
        } else {
          ctx.fillStyle = colors.orange;
          ctx.font = `700 13px ${colors.mono}`;
          ctx.fillText(`BUILD FAILED: ${hitLabel}`, W / 2, 96);
          ctx.fillStyle = colors.ink;
          ctx.font = `700 20px ${colors.display}`;
          ctx.fillText(`${score()} builds shipped`, W / 2, 122);
          ctx.fillStyle = colors.muted;
          ctx.font = `500 12px ${colors.mono}`;
          ctx.fillText("Space / tap Jump to rebuild", W / 2, 148);
        }
      }
    }

    // ---------- loop ----------
    let raf = 0;
    let last = 0;
    let visible = true;

    function loop(now) {
      cancelAnimationFrame(raf);
      if (state !== "running" || !visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 1 / 30); // clamp after tab switches
      last = now;
      update(dt);
      draw();
      if (state === "running") raf = requestAnimationFrame(loop);
    }

    function resume() {
      if (state === "running") {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    }

    // ---------- input ----------
    function onKey(e) {
      // Only react while the game is actually on screen (e.g. the dialog is open).
      if (!container.isConnected || !container.getClientRects().length) return;
      const k = e.key;
      if (k === " " || k === "ArrowUp" || k === "w" || k === "W") {
        e.preventDefault();
        if (e.type === "keydown" && !e.repeat) jump();
      } else if (k === "ArrowDown" || k === "s" || k === "S") {
        e.preventDefault();
        setDuck(e.type === "keydown");
      }
    }

    function onPointer(e) {
      const act = e.target.closest("[data-act]");
      if (!act) return;
      e.preventDefault();
      if (act.dataset.act === "jump" && e.type === "pointerdown") jump();
      if (act.dataset.act === "duck") setDuck(e.type === "pointerdown");
    }

    // Tapping the canvas itself also jumps.
    function onCanvasTap(e) {
      e.preventDefault();
      jump();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    controls.addEventListener("pointerdown", onPointer);
    controls.addEventListener("pointerup", onPointer);
    controls.addEventListener("pointerleave", onPointer);
    canvas.addEventListener("pointerdown", onCanvasTap);

    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : resume());
    document.addEventListener("visibilitychange", onVisibility);

    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) resume();
            else cancelAnimationFrame(raf);
          })
        : null;
    if (io) io.observe(canvas);

    const onResize = () => {
      resize();
      draw();
    };
    window.addEventListener("resize", onResize);

    reset();
    refreshColors();
    resize();
    draw();

    return {
      start,
      pause() {
        cancelAnimationFrame(raf);
        if (state === "running") {
          state = "ready";
          draw();
        }
      },
      focus() {
        canvas.focus({ preventScroll: true });
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("keyup", onKey);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        if (io) io.disconnect();
        container.innerHTML = "";
      },
    };
  }

  window.KtRunner = { mount };
})();
