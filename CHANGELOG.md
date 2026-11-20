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

### Visual & motion package
- **Skills section** (`03_skills.kt`): four groups (Android UI, Architecture, Async & Data, Backend & Tools), with the main skills highlighted. It only lists tech verified in the project repos or confirmed by Reza.
- **Kotlin code card in the hero**: an editor-style `Reza.kt` snippet with IntelliJ-style syntax colours. It overlaps the photo on desktop and sits under the intro text on mobile.
- **Circular reveal theme switch**: the new theme grows as a circle from the toggle button, like Android's `createCircularReveal` (View Transitions API, with an instant switch as the fallback).
- **Closable code window**: the red traffic light closes the `Reza.kt` card (it shrinks and fades like a macOS window), and a small `▸ Reza.kt` button brings it back. Hovering the traffic lights shows the × − + glyphs. The card now sits lower, so it only covers the bottom third of the photo.
- **Direction-aware theme animation**: switching to light grows the light page out of the toggle icon, and switching to dark shrinks the light page back into the icon to reveal the dark theme underneath. Both directions use the standard easing curve over 600 ms. The finished reveal animation is cancelled after each switch, so it no longer clips the next transition (that left a blank page when switching dark → light).
- **Scroll progress bar**: a thin purple → orange bar under the navbar.
- **Staggered reveal**: cards in the Skills, Projects, and Certification grids appear one after another.
- Navbar: removed **Home** (the `reza.kt` logo already links to the top) to make room for **Skills**. No menu item is highlighted while the hero is on screen.
- Skills: added **Health Connect** and **Auth0**, plus a full-width **Firebase** group (Crashlytics, Remote Config, Cloud Messaging, Analytics, Performance Monitoring, App Distribution, A/B Testing, Authentication, Firestore, Cloud Storage), confirmed by Reza.
- U by Prodia card and Prodia experience: added the Health Connect, Auth0, and Firebase integrations.
- Section labels renumbered: `03_skills.kt`, `04_projects.kt`, `05_certification.kt`.
- Fix: revealed elements now drop the reveal classes, so card hover effects use their own fast transitions instead of the slow reveal timing.

### Projects section
- Every project card now has a **context line** (production / thesis / team project, plus the year), **3 highlight bullets** on what was built, and tech tags checked against each repository's `build.gradle` and source code.
- **Qurbanku**: describes the two role-based flows (committee and congregants), CameraX, and Google Maps + Fused Location. Removed the **Espresso** tag, because the repo only has the default example tests.
- **Tips n Trip**: removed the **GCP** and **Maps SDK** tags, which the Android app does not use. Added Retrofit, OkHttp, Paging 3, Navigation, and Glide, which it does use.
- **U by Prodia**: replaced the text placeholder with `assets/uprodia.jpg`, a banner made from the home feature menu and the Met-U screen (status bar, greeting, and personal health data left out). Added Hilt, Coroutines, Flow, and Retrofit (confirmed by Reza) and split the features into bullets.
- Project names use `<h3>` and cards use `<article>` for a better heading structure.

### Performance
- `assets/profile_image.jpg` resized from 2179×2179 to 640×640 — **436 KB → 40 KB**.
- Project screenshots use `loading="lazy"`; all images have `width`/`height` to prevent layout shift.
