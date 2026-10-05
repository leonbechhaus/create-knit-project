# Create Knit Project

A pixel-grid knitting pattern designer — plan grids, gauge-accurate sizing,
precise HSLA colour swatches, a paint/erase/fill/line/lasso/stamp toolset,
row annotations (stitch symbols + notes), undo/redo, and reusable "Pattern
Units" you can stamp across projects.

Everything runs entirely in your browser. Projects, swatches, and pattern
units are stored locally per-profile in IndexedDB (via Dexie) — there is no
backend and no account system (yet).

## 🧪 Alpha testing

This is an early alpha built for friends-and-family testing. A few things to
know before you dive in:

- **Your data lives only in your browser.** Projects aren't synced anywhere.
  Clearing your browser's site data (or using a different browser/device)
  means a fresh start. Don't rely on it for anything you can't recreate yet.
- **Expect rough edges.** This is alpha software — bugs, missing polish, and
  occasional breaking changes between releases are expected.
- **Found a bug or have feedback?** Click the 🐛 icon at the right end of the
  toolbar — it opens a pre-filled GitHub issue tagged with the build version
  you're on. Or go straight to [Issues](https://github.com/leonbechhaus/create-knit-project/issues/new).

The live alpha build is deployed automatically from `main` — ask whoever
sent you here for the current URL.

## Getting started (local dev)

```bash
npm install
npm run dev
```

Open the printed `localhost` URL. Vite's dev server also exposes itself on
your LAN (`--host 0.0.0.0`), so you can test from a phone/tablet on the same
network.

## Scripts

| Script                 | What it does                                |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Start the dev server with HMR               |
| `npm run build`        | Type-check (`tsc -b`) then production build |
| `npm run preview`      | Serve the production build locally          |
| `npm run lint`         | Lint with oxlint                            |
| `npm run format`       | Format the repo with Prettier               |
| `npm run format:check` | Check formatting without writing            |

## Contributing / commit style

This repo uses [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `chore:`, `refactor:`, …), enforced locally via a Husky
`commit-msg` hook and in CI. A `pre-commit` hook also runs lint + format
checks before every commit.

## Architecture

- **React 19 + TypeScript + Vite**
- **Zustand**, split into composable slices under
  [`src/store/slices`](src/store/slices) (profile, project, swatches, pattern
  units, layers, tools, history/undo, grid mutations, row annotations) and
  combined in [`src/store/useKnittingStore.ts`](src/store/useKnittingStore.ts)
- **Dexie (IndexedDB)** for persistence — see [`src/db/knitDb.ts`](src/db/knitDb.ts)
- A small design-token system in [`src/styles/tokens.css`](src/styles/tokens.css)
  (spacing/type/colour/radius scales) backing a shared component library in
  [`src/components/ui`](src/components/ui)

## Release pipeline

- **CI** (`.github/workflows/ci.yml`) — type-checks, lints, format-checks,
  and builds on every push/PR to `main`.
- **Commit message linting** (`.github/workflows/commitlint.yml`) — validates
  Conventional Commits on PRs.
- **Deploy** (`.github/workflows/deploy.yml`) — on every push to `main`,
  builds with the GitHub Pages base path and deploys via GitHub Pages. This
  is the alpha channel: merging to `main` ships to testers immediately.
- Version bumps live in `package.json` (`0.1.0-alpha.N` during alpha); tag
  releases on GitHub as milestones mature (`v0.1.0`, `v0.2.0`, …). See
  [`CHANGELOG.md`](CHANGELOG.md).
