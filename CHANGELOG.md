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

### Visualisations and Apple-style scrollytelling
- **Stack evolution matrix** (home, under Skills): a dot matrix of 13 technologies across the four projects, oldest first. It shows the move from XML, LiveData, callbacks, and hand-written factories to Compose, Flow, Hilt, Room, multi-module, unit tests, and CI. Built as a real `<table>` with screen-reader labels, and "partly" uses a different shape, not just a different colour. Dots pop in column by column, the hovered project's column is highlighted, and each dot has a tooltip on hover, tap, or keyboard focus. On phones it fits the screen without sideways scrolling.
- **Xporter Camera "A closer look"**: the screens grid is now a scrollytelling section. A phone stays pinned while four steps scroll past, and the screen changes with the active step. On tablets and phones, each step shows its own screen instead.
- **USB vs Wi-Fi bar chart** in the Xporter research section: 20.6 vs 0.71 MB/s with direct labels, a tooltip with the time for a 17.5 MB JPEG, and an "≈29× faster" callout. The bars grow in when they scroll into view.
- All new motion turns off with *reduce motion*. Hidden tooltips no longer take up space, so they can't widen a scroll area.

### Xporter Camera
- New **Xporter Camera** project card (second, after U by Prodia): a Fujifilm photo transfer app over USB and Wi-Fi with PTP/PTP-IP written in Kotlin, read-only by design, multi-module with CI. Its banner (`assets/xporter.jpg`) combines the connect screen, a photo's detail, and a recipe card on an amber background. No GitHub link, because the repository is private.
- New case study `projects/xporter.html`: problem, 4-step flow, the protocol research and measured USB vs Wi-Fi numbers from the X-T3 spike, a module architecture diagram, 4 key decisions (read-only allowlist, one repository for USB and Wi-Fi, streaming geotag, resumable Wi-Fi exports), the engineering process, and known limits.
- Case study **Screens** section: connect, photo detail, exposure frame, and polaroid (status bar and debug button cropped out), shown as a grid on desktop and a swipeable carousel on mobile, plus a showcase of the exported recipe card. The old app name on the card was covered, and screenshots showing the office or coworkers were left out.
- Every number and claim was checked against the repository (16 modules, 32 test files, 38 pull requests, allowlists in `PtpSession` and `FujiProperty`, `GpsTaggingSink`, foreground `ExportService`).
- Skills: added Multi-module, Gradle convention plugins, Room, DataStore, Coil, Navigation 3, USB Host and PTP/IP, GitHub Actions CI, JUnit and Turbine, Spotless and ktlint, and LeakCanary.
- Case studies now link in a loop: Xporter → Qurbanku → Tips n Trip → Xporter.

### Tips n Trip case study
- New page `projects/tipsntrip.html`: problem, guest vs signed-in flow, architecture from the Android client to the team's API and ML model, 4 key decisions (generic `ExplorePagingSource<V>`, OkHttp auth interceptor with debug-only logging, guest-first explore, on-device validation of budget and trip length), the cross-disciplinary teamwork, and a retrospective.
- Claims checked against the Tips n Trip source and history (Reza authored the initial ~8,200-line app commit).
- Linked from the Tips n Trip project card. The two case studies link to each other.
- Added the Tips n Trip demo video: a button and an embedded player in the case study, plus a Demo link on the project card.

### Qurbanku case study
- New page `projects/qurbanku.html`: problem, a 4-step flow between committee and congregants, an architecture diagram (UI → ViewModel → Repository → Firebase), 4 key technical decisions, the embedded demo video, and a retrospective on what I'd change today.
- Every technical claim was checked against the Qurbanku source code (seat reservation via `arrayUnion` on approval, image compression under 1 MB, Geocoder, role check at login, `SingleLiveEvent`).
- Diagrams are built with HTML/CSS, so they follow the light/dark theme and reflow on mobile.
- The Qurbanku card on the home page now links to the case study.
- `script.js` works on pages without the hamburger menu or nav sections.

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
