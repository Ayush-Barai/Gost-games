# 👻 Ghost Games Arcade

**20 cursed mini games. One haunted arcade.**

A complete, fully playable browser arcade built with Next.js, TypeScript and Tailwind CSS. Every game has its own rules, controls, scoring and game-over flow. There is no backend, no login, no database and no paid API — only static files and `localStorage`.

![Next.js](https://img.shields.io/badge/Next.js-15-080812?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-080812?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-080812?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-080812?style=flat-square&logo=tailwindcss)
![Three.js](https://img.shields.io/badge/Three.js-R3F-080812?style=flat-square&logo=three.js)

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Production build

```bash
npm run build
```

The site exports to `out/`. Because the app uses `output: "export"`, there is no Node server requirement in production.

```bash
npx serve out
```

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Local development server                      |
| `npm run build`     | Typecheck, lint and export static site to `out` |
| `npm run typecheck` | TypeScript only (`tsc --noEmit`)              |
| `npm run lint`      | Next.js lint command (see note below)         |

> **Lint note:** ESLint is intentionally not installed in this project. `npm run build` performs the production compile and type validation. To use Next's linter, install `eslint` and `eslint-config-next` and add an ESLint config.

---

## The 20 games

| # | Game | Category | Difficulty | Controls |
| - | ---- | -------- | ---------- | -------- |
| 01 | Ghost Catcher | Arcade | Easy | Mouse / touch |
| 02 | Ghost Memory Match | Puzzle | Easy | Mouse / touch |
| 03 | Haunted Maze Escape | Adventure | Medium | Arrows / WASD |
| 04 | Ghost Jump | Arcade | Easy | Space / Arrow Up / tap |
| 05 | Pumpkin Dodge | Survival | Medium | Arrows / A D / drag |
| 06 | Ghost Flappy | Arcade | Medium | Space / click / tap |
| 07 | Haunted Word Scramble | Puzzle | Medium | Keyboard |
| 08 | Ghost Tic-Tac-Toe | Puzzle | Easy | Mouse / touch |
| 09 | Haunted Whack-a-Ghost | Arcade | Easy | Mouse / touch |
| 10 | Soul Collector | Arcade | Medium | Arrows / WASD |
| 11 | Ghost Runner | Arcade | Hard | Space / Arrow Down / tap zones |
| 12 | Haunted Number Puzzle | Puzzle | Medium | Mouse / touch |
| 13 | Ghost Detective | Adventure | Easy | Mouse / touch |
| 14 | Ghost Reaction Test | Arcade | Easy | Mouse / touch |
| 15 | Haunted Pong | Arcade | Medium | W / S / arrows / drag |
| 16 | Ghost Shooter | Survival | Hard | WASD + Space |
| 17 | Haunted Memory Quiz | Puzzle | Easy | Mouse / touch / A-D |
| 18 | Ghost Tower | Arcade | Medium | Space / click / tap |
| 19 | Haunted Treasure Hunt | Adventure | Medium | Arrows / WASD / swipe |
| 20 | The Last Ghost | Survival | Hard | Arrows / WASD / drag |

Every game is loaded lazily when opened. The 3D hero ghost is also loaded on demand.

### Game framework

All games share one shell (`components/GameShell.tsx`):

- start screen with rules, controls and personal best
- pause/resume (button, `P`, or `Esc`)
- automatic pause when the browser tab is hidden
- restart, exit, sound toggle
- live score, best score and optional timer
- animated game-over screen with new-best detection
- automatic persistence through Zustand + `localStorage`

Games talk to the shell through `useGameApi()`:

```ts
const { status, score, best, timeLeft, addScore, setScore, setTimeLeft, endGame } =
  useGameApi();
```

Canvas games additionally share `hooks/useGameCanvas.ts` (DPR-aware resizing + RAF loop that stops when paused) and drawing helpers in `lib/canvas.ts`.

---

## Features

- **20 unique playable games** — no placeholder cards, no external game embeds.
- **Procedural artwork** — every cover illustration and glyph is generated in SVG/CSS.
- **3D ghost hero** — React Three Fiber ghost with translucent material, glowing eyes, mouse follow, floating particles, stars and soft shadows.
- **GSAP motion** — hero entrance, scroll reveals, card lifts, counters, modal transitions and toast animations. All motion respects `prefers-reduced-motion`.
- **Synthesized audio** — Web Audio oscillators generate clicks, points, bombs, wins and achievement jingles. No audio files.
- **Local progress** — high scores, favorites, plays, completions, survival records and achievements persist in the browser.
- **Fully responsive** — 4 columns on desktop, 3 on tablet, 2 on mobile. Touch D-pads, taps, swipes and drag controls are provided.
- **Dark arcade design** — `#080812` void, spectral purple `#8B5CF6`, ectoplasm cyan `#22D3EE`, blood-moon pink `#F472B6`, glassmorphism, Cinzel + Sora + JetBrains Mono.
- **Static export** — deploy the `out/` directory to any static host.

---

## Achievements

Seven trophies are evaluated after each play/favorite:

| Achievement | Requirement |
| ----------- | ----------- |
| First Spirit | Play your first game |
| Ghost Hunter | Catch 50 ghosts across all games |
| Puzzle Master | Complete 5 puzzle games |
| Survivor | Survive 60 seconds in a single run |
| Arcade Legend | Play all 20 games at least once |
| High Roller | Set a best score of 1,000 or more |
| Soul Collector | Favorite 5 games |

Unlocks appear as animated toasts (top-right) with a synthesized chime.

---

## Local storage

Progress is stored under the key `ghost-games-arcade-v1` using Zustand's `persist` middleware. It contains:

```json
{
  "bestScores": { "ghost-catcher": 320 },
  "favorites": ["ghost-catcher", "haunted-maze"],
  "stats": {
    "gamesPlayed": 4,
    "gamesCompleted": 3,
    "ghostsCaught": 18,
    "puzzlesCompleted": 1,
    "longestSurvival": 42,
    "totalScore": 840,
    "playedGames": ["ghost-catcher", "haunted-maze"]
  },
  "achievements": ["first-spirit"],
  "soundOn": true
}
```

Hydration is deferred until after mount (`StoreHydrator`) to avoid SSR mismatches. The footer includes a **Reset progress** action.

Storage failures (private mode, disabled storage, quota) are caught silently — the arcade keeps playing without persistence.

---

## Project structure

```
app/
  layout.tsx        metadata, fonts, global chrome
  page.tsx          landing page composition
  globals.css       design system + game keyframes
components/
  GameShell.tsx     shared game runtime, HUD, pause, timer, persistence
  GameModal.tsx     full-screen animated game modal
  GameArt.tsx       procedural cover art and icons
  Hero.tsx          GSAP hero
  Ghost3D.tsx       React Three Fiber scene
  ...               cards, grid, stats, achievements, footer
games/
  registry.tsx      lazy-loaded game registry
  GhostCatcher.tsx  ... 20 game components
  shared/           TouchDpad, GhostSprite
hooks/
  useGameCanvas.ts  responsive canvas + RAF
  useKeyboardControls.ts
lib/
  games.ts          game metadata, rules, categories
  store.ts          Zustand progress store
  achievements.ts   achievement rules
  audio.ts          Web Audio sound engine
  canvas.ts         canvas drawing helpers
  uiStore.ts        active game + filters
```

---

## Deploying to Render

This project is ready for a **Render Static Site**.

### Option A — Render dashboard

1. Push the repository to GitHub/GitLab.
2. In Render, choose **New → Static Site** and connect the repository.
3. Use these settings:

   | Setting | Value |
   | ------- | ----- |
   | **Build Command** | `npm ci && npm run build` |
   | **Publish Directory** | `out` |
   | **Node Version** | `20` or newer |

4. Add no environment variables.
5. Deploy. Render serves the exported `out/` directory, including the client-side game modal and all lazy-loaded chunks.

### Option B — Blueprint

The included `render.yaml` defines the same static site:

```bash
# after pushing the repo
# Render dashboard → Blueprints → New Blueprint Instance
```

`render.yaml`:

```yaml
services:
  - type: web
    name: ghost-games-arcade
    runtime: static
    buildCommand: npm ci && npm run build
    staticPublishPath: out
    envVars:
      - key: NODE_VERSION
        value: "20"
    headers:
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

Because every route is statically exported and the app is a single landing page, the rewrite is only a safety net for unknown paths. Game state never touches the server.

### Any other static host

Upload the contents of `out/` to Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, nginx, etc. No redirects or server runtime are required.

---

## Browser support

- Modern evergreen browsers (Chrome, Edge, Firefox, Safari)
- Web Audio requires a user gesture before sound starts — clicking **Enter the Arcade** satisfies this
- WebGL is required for the 3D hero; if unavailable, the rest of the arcade still works
- `localStorage` is optional; the site degrades gracefully without it

---

## Accessibility & performance

- Keyboard play for every keyboard-capable game
- Visible focus rings and ARIA labels on interactive controls
- `prefers-reduced-motion` disables GSAP timelines, CSS animations and 3D motion
- Pause automatically on tab hide; animation loops stop while paused
- Games and the 3D scene are lazy-loaded to keep the first load small
- Static export — no API latency, no server costs

---

## License

MIT — see [LICENSE](./LICENSE). All artwork is generated in code; all audio is synthesized in the browser.
