# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning
follows [SemVer](https://semver.org/), with `-alpha.N` pre-release suffixes
while this is in friends-and-family testing.

## [0.1.0-alpha.1] - 2026-10-05

First alpha build shared for external testing.

### Added

- Project setup: grid width/height in stitches, gauge (stitches/rows per
  10 cm) with cm ↔ stitch conversion, multi-layer projects with optional
  linked gauge.
- Profiles with locally saved project collections (IndexedDB via Dexie).
- Color Studio: precise HSLA-slider swatch editing, project-scoped and
  global swatches, rename/rescope.
- Grid editor: paint, erase, fill, line, rectangle select, lasso select,
  stamp, and eyedropper tools, with undo/redo history.
- Onion skin mode for tracing another layer.
- Row annotations: per-row stitch symbol icons (from a lace/stitch symbol
  set) and free-text notes.
- Pattern Units: save a lasso/rect selection as a reusable, named stamp
  shared across all projects in a profile.
- Keyboard shortcuts for the full toolbar.
- Design-token based UI (spacing/type/colour/radius scales), Prettier
  formatting across the codebase, store split into Zustand slices.
