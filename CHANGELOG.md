# Changelog

## [Unreleased] — branch `develop`

### Added
- **Dark mode** — follows the system setting by default, with a toggle button (moon/sun) in the navbar. The choice is saved in `localStorage` and applied before first paint, so there is no light flash on reload.
- **Active nav highlight** — the menu item for the section currently on screen is highlighted (with `aria-current`).
- **Education** link in the navbar (the section existed but had no menu entry).
- **GitHub link for Tips n Trip** → `Tips-n-Trip/Mobile-App`.
- **Favicon** (`favicon.svg`) in the site's purple/orange palette.
- **Open Graph & Twitter meta tags** so shared links on LinkedIn/WhatsApp show a title, description and photo; plus `canonical` and `theme-color`.
- **Skip to content** link for keyboard users and a visible `:focus-visible` outline.
- Footer year now updates automatically.

### Changed
- **Hamburger is now a real `<button>`** with `aria-expanded`/`aria-controls`, animates into an ✕ when open, and closes with `Esc`.
- **Mobile menu breakpoint raised to 900px** — with six menu items the desktop nav overflowed on tablet widths.
- **Resume button stays reachable on mobile** — it was hidden below 700px; it now appears inside the mobile menu.
- **Section labels renumbered** `01_experience.kt` … `04_certification.kt` (previously started at `02_`).
- **Icons load from Font Awesome Free on cdnjs** instead of a personal Font Awesome Kit, so they no longer depend on the kit staying active.
- All `target="_blank"` links now carry `rel="noopener noreferrer"`.
- Decorative icons marked `aria-hidden="true"`.
- **Experience timeline**: the connector line is now centred on the dots, and it stops at the last item instead of running past it.

### Projects section
- Every project card now has a **context line** (production / thesis / team project, plus the year), **3 highlight bullets** on what was built, and tech tags checked against each repository's `build.gradle` and source code.
- **Qurbanku**: describes the two role-based flows (committee and congregants), CameraX, and Google Maps + Fused Location. Removed the **Espresso** tag, because the repo only has the default example tests.
- **Tips n Trip**: removed the **GCP** and **Maps SDK** tags, which the Android app does not use. Added Retrofit, OkHttp, Paging 3, Navigation, and Glide, which it does use.
- **U by Prodia**: replaced the text placeholder with `assets/uprodia.jpg`, a banner made from the home feature menu and the Met-U screen (status bar, greeting, and personal health data left out). Added Hilt (as stated in the Experience section) and split the features into bullets.
- Project names use `<h3>` and cards use `<article>` for a better heading structure.

### Performance
- `assets/profile_image.jpg` resized from 2179×2179 to 640×640 — **436 KB → 40 KB**.
- Project screenshots use `loading="lazy"`; all images have `width`/`height` to prevent layout shift.
