# Verdade ou Desafio 🎲

> **Do familiar ao extremo — tu decides.**
>
> Jogo social de festa em português europeu, construído como uma aplicação de página única estática em TypeScript + Vite. Quatro níveis de intensidade, desde o familiar ao explicitamente ousado. Implementável no GitHub Pages sem qualquer requisito de servidor.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Game Rules](#game-rules)
- [Architecture](#architecture)
- [Dataset](#dataset)
- [Deployment](#deployment)
- [Commit Convention](#commit-convention)
- [Licence](#licence)

---

## Features

- **4 Tier system** — from family-friendly to explicit adult content
- **Age-gating** — mandatory 18+ confirmation for Tiers 2–4
- **Adaptive player registration** — fields scale with the selected tier (name → gender → orientation → relationship status)
- **Orientation & relationship-aware matching engine** (Tiers 3–4) — ensures targets are mutually compatible
- **Anti-repetition card engine** — weighted scoring prevents recently seen cards from reappearing; couples share history
- **Drink/shot penalty system** — dismissible overlay on card refusal; can be disabled before starting
- **pt-PT gender agreement parser** — resolves `word/a` patterns (e.g. `sozinho/a`) based on the active player's gender
- **Persistent game state** — `localStorage` survives page refreshes; first visit uses OS dark/light preference; theme is persisted after the first manual change
- **Ambient background** — floating bokeh particles (tsParticles v2 via CDN) that smoothly re-colour to match the active palette when the theme changes
- **Liquid Glass dock** — physics-based floating glass toolbar (always visible) with a **Temas** button (colour palette + dark/light mode) and a **Definições** button (frosted glass toggle + in-game wiki)
- **Dark / light mode** — respects OS preference on first visit; toggle via the dock Temas menu without losing the chosen palette; persisted across sessions
- **10 vivid colour themes** — 5 palettes (Violeta, Oceano, Âmbar, Rosa, Floresta) × 2 modes (light / dark); all with saturated, vibrant tones and per-palette glass tokens
- **Liquid toggle switches** — all binary controls (dark mode, frosted glass, penalties, open-to-outside) use a morphing goo animation toggle whose colour follows the active theme
- **Frosted glass mode** — optional heavier blur/tint on all glass surfaces, toggled from the Definições menu
- **Mobile-first responsive design** — no vertical or horizontal scroll at the page level; content areas scroll internally where needed
- **Landscape optimisation** — wider containers and compact layouts on rotated devices
- **WCAG AA colour contrast** — all 10 themes verified for interactive element contrast

---

## Design

The UI uses a **Liquid Glass** design system — a physics-based refraction effect that simulates real optical glass through SVG displacement maps computed from Snell's law. Each glass surface (dock, menus, modals) has four stacked layers: a displacement+blur backdrop, a colour-mix tint, an inset edge-shine, and the interactive content. Toggle switches use a goo/morphing animation via SVG colour-matrix filters, and their hue automatically follows the active palette. All 10 themes (5 palettes × light/dark) are built with vibrant, saturated tones and a two-layer CSS cascade: a shared dark-base selector followed by per-palette variable overrides, maintaining WCAG AA contrast across all combinations. A tsParticles (v2) ambient background adds depth with soft bokeh particles that re-colour on every theme change.

Design reference: [kube.io/blog/liquid-glass-css-svg](https://kube.io/blog/liquid-glass-css-svg/)

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript 5.7 | Strict mode, `noUncheckedIndexedAccess`, `noImplicitOverride` |
| Bundler | Vite 6 | JSON imports, hot-module replacement, esbuild minification |
| UI | Vanilla DOM | No framework — pure TypeScript DOM manipulation |
| Styling | CSS Custom Properties | Mobile-first, tokenised design system, dark/light theming |
| State | Hand-rolled reactive store | Observer pattern, `localStorage` persistence |
| DX tooling | Husky + commitlint + Prettier | Pre-commit formatting, conventional commit enforcement |
| CI/CD | GitHub Actions | Automated build & GitHub Pages deployment on push to `main` |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
git clone https://github.com/<your-username>/truth-or-dare.git
cd truth-or-dare
npm install
./setup.sh   # initialises Husky git hooks — run once after cloning
```

### Development server

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot-module replacement.

### Production build

```bash
npm run build
```

Output goes to `dist/`. TypeScript is type-checked before bundling (`tsc --noEmit && vite build`).

### Preview production build locally

```bash
npm run preview
```

Opens at `http://localhost:4173`.

---

## Project Structure

```
.
├── scripts/
│   └── convert-dataset.mjs   # Converts dataset.md → src/data/dataset.json
├── src/
│   ├── data/
│   │   └── dataset.json       # 400 cards (bundled at build time)
│   ├── engine/
│   │   ├── glassDistortion.ts # Physics-based SVG displacement map (Liquid Glass)
│   │   ├── markdownParser.ts  # JSON loader + filterCards utility
│   │   ├── genderParser.ts    # pt-PT gender agreement & HTML formatter
│   │   ├── matchingEngine.ts  # Eligible target selection (levels 3–4)
│   │   └── repetitionEngine.ts# Anti-repetition weighted card selection
│   ├── state/
│   │   └── store.ts           # Reactive store, all Actions, localStorage persistence
│   ├── types/
│   │   └── index.ts           # All shared domain types
│   ├── ui/
│   │   ├── router.ts          # GamePhase → screen factory, focus management
│   │   ├── settingsPanel.ts   # Glass dock + settings platform-menu + wiki modal
│   │   └── screens/
│   │       ├── homeScreen.ts  # Tier selection grid
│   │       ├── ageGateScreen.ts # 18+ confirmation
│   │       ├── setupScreen.ts   # Adaptive player registration form
│   │       └── gameScreen.ts    # Truth/Dare selection + card reveal + penalty overlay
│   ├── styles/
│   │   └── main.css           # Full stylesheet — tokens, components, landscape queries
│   ├── main.ts                # Application entry point
│   └── vite-env.d.ts          # Vite type declarations
├── index.html                 # SPA shell
├── vite.config.ts             # Vite configuration (base path, esbuild target)
├── tsconfig.json              # TypeScript configuration (strict, ES2021)
├── tsconfig.node.json         # TypeScript config for vite.config.ts (Node context)
├── package.json
├── .commitlintrc.json         # Conventional Commits enforcement
├── .lintstagedrc.json         # Prettier on staged files
├── .prettierrc                # Prettier options
└── .github/
    └── workflows/
        └── deploy.yml         # GitHub Actions: build → deploy to GitHub Pages
```

---

## Game Rules

### The 4 Tiers

| Nível | Nome | Restrição de idade | Penalização shots | Descrição |
|------|---------|:-:|:-:|---|
| 1 | 🌟 Diversão Familiar | ✗ | ✗ | Perguntas leves e desafios divertidos — adequado a todas as idades |
| 2 | 🎉 Noite entre Amigos | 18+ | ✓ | Conteúdo mais picante sobre vida pessoal, segredos e momentos embaraosos |
| 3 | 🔥 Onde a Ousadia Começa | 18+ | ✓ | Conteúdo adulto físico e sensual; atribuição de alvos com orientação sexual |
| 4 | 💀 Extremo | 18+ | ✓ | Conteúdo explícito para grupos completamente à vontade entre si |

### Turn Flow

1. The current player's name is displayed.
2. They choose **VERDADE** (Truth) or **DESAFIO** (Dare).
3. A card is drawn and displayed. The target player (if any) is resolved automatically.
4. The player either completes the challenge (✅ Feito!) or refuses (❌ Recusar).
5. Refusing triggers a penalty overlay showing the number of shots to drink.
6. The turn passes to the next player in registration order.

### Penalty System

Each card in Tiers 2–4 carries a shot count (`[N shots]` in the source data). Refusing a card triggers a full-screen penalty overlay. The feature can be disabled in the setup screen before the game starts — useful for alcohol-free play.

### Matching Engine (Tiers 3–4)

When a card contains `[Target Player]`, the engine selects an eligible target by applying three constraints in sequence:

1. **Mutual orientation** — only pairs where both players are attracted to the other's gender are eligible.
2. **Relationship exclusivity** — players in a *closed relationship* interact exclusively with their registered partner.
3. **Open relationship gate** — players in an *open relationship* must have `openToOutside = true` to be eligible as targets for others.

If no eligible target exists, the active player performs the challenge alone.

### Anti-Repetition Engine

Before each card draw, every candidate card receives a penalty score:

| Factor | Score penalty |
|---|---|
| Appeared in active player's last 12 cards | +200 |
| Active player has ever seen this card | +30 |
| Partner saw it in their last 6 cards | +80 |
| Random jitter (fairness) | ±15 |

The card with the lowest total score is selected (from the top-5 lowest, with randomness).

### pt-PT Gender Agreement

Card text uses the pattern `word/a` (e.g. `sozinho/a`, `nu/a`) to encode gender variants. The parser resolves these at render time based on the active player's registered gender:

- **Masculine** → `sozinho`, `nu`
- **Feminine** → `sozinha`, `nua`

The `[Target Player]` placeholder is replaced with the target's `<strong>name</strong>` and all output is HTML-escaped to prevent XSS.

---

## Architecture

### State Management

`GameStore` is a hand-rolled reactive store using the observer pattern:

```
store.update(Actions.someAction(payload))
  └─► updater function returns new state
      └─► store notifies all subscribers
          └─► router re-renders the current screen
```

State is persisted to `localStorage` on every update. `allCards` (static bundle data) and `playerHistories` (contain `Set` objects) are serialised/deserialised specially.

### Screen Lifecycle

The router maps `GamePhase` values to screen factory functions:

```
home → age-gate → setup → game-selecting ↔ game-showing → home
```

Each screen is fully re-created on phase transitions (no DOM diffing). Focus is programmatically moved to the first interactive element after each render for accessibility.

### Layout

The app uses a fixed-height layout to prevent page-level scroll:

```
html / body (height: 100%, overflow: hidden)
  └─ #app (height: 100%, overflow: hidden)
      └─ .screen (height: 100%, overflow: hidden)
          ├─ header.app-header   ← sticky, always visible
          └─ .screen-body        ← flex: 1, overflow-y: auto (scrolls if needed)
```

---

## Dataset

Game content (questions and dares) lives in `src/data/dataset.json` — a flat array of 400 `Card` objects generated from the raw Markdown source.

### Card shape

```jsonc
{
  "id": 1,
  "type": "truth",         // "truth" | "dare"
  "tier": 2,               // 1 | 2 | 3 | 4
  "rawText": "Qual foi a pior mensagem...",
  "shots": 2,              // null when no penalty
  "hasTarget": false       // true when rawText contains "[Target Player]"
}
```

### Regenerating from Markdown

If you edit the raw source (`dataset.md`), regenerate the JSON with:

```bash
node scripts/convert-dataset.mjs
```

> `dataset.md` is listed in `.gitignore` and is not committed to the repository.

---

## Deployment

### GitHub Pages (automated)

Push to `main`. The GitHub Actions workflow in `.github/workflows/deploy.yml` will:

1. Install dependencies (`npm ci`)
2. Build the project (`npm run build`) with `BASE_URL=/TruthOrDare/`
3. Upload `dist/` as a GitHub Pages artefact
4. Deploy via the official `actions/deploy-pages` action

The live site will be available at: **<https://beatrizsaoliveira.github.io/TruthOrDare/>**

> Before the first deployment, go to **Settings → Pages → Source** and set it to **GitHub Actions**.

### Custom base path

The base path `/TruthOrDare/` is hardcoded in the workflow. If you ever rename the repository, update the `BASE_URL` value in `.github/workflows/deploy.yml` to match.

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<scope>): <short description>
```

Enforced by `commitlint` via the `commit-msg` Husky hook.

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `revert`

**Examples:**

```bash
feat(engine): add orientation-aware target filtering
fix(css): prevent horizontal scroll in landscape mode
docs(readme): add architecture section
chore(deps): upgrade vite to 6.4
```

---

## Licence

MIT © 2026 Beatriz Oliveira

---

> **Note on content:** Tiers 3 and 4 contain explicit adult content intended for consenting adults. Always play responsibly. Participation in any challenge must be fully voluntary — no one should ever feel pressured. Drinks can always be substituted with water or any non-alcoholic beverage.
