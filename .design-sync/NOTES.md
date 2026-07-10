# design-sync notes — 6signal

- This repo is a **Next.js site, not a component library**. The sync is deliberately **brand-layer only** (tokens-only mode): tokens + compiled class vocabulary + guidelines. Zero React components ship.
- **Entry is a stub**: `.design-sync/ds-entry.mjs` (`export {}`) passed via `--entry`. All `app/components/*` are welded to Next internals (next/link, router hooks, Typeform) and would render broken outside Next — do not sync them as-is.
- **Component candidates for a future re-sync**: the chart primitives (Radar, Ring, LineChart, Donut, Sparkline, SignalBars) living inline in `app/dashboard/page.tsx`. Syncing them requires first extracting them into an importable module (real refactor — touches the live dashboard; user deferred on 2026-07-09).
- **cssEntry is GENERATED** (`.design-sync/.cache/ds.css`, gitignored). Regenerate before every re-sync:
  ```sh
  grep -v '@import "@typeform' app/globals.css > .design-sync/.cache/globals-input.css
  npx tailwindcss -c tailwind.config.ts -i .design-sync/.cache/globals-input.css -o .design-sync/.cache/globals-compiled.css
  { echo '@import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");'; cat .design-sync/.cache/globals-compiled.css; } > .design-sync/.cache/ds.css
  ```
  (Tailwind v3 CLI; the `@typeform` import is dropped on purpose — node_modules CSS irrelevant to designs.)
- Fonts are **Google-hosted remote** (`@import` in cssEntry) → `[FONT_REMOTE]` is expected, not a problem.

## Known render warns
- `[RENDER_SKIPPED]` — accepted while the DS is tokens-only (0 previews exist; nothing to render). Install playwright + chromium the day components are added.

## Re-sync risks
- `ds.css` is a **compiled snapshot** — a re-sync without regenerating it (command above) uploads stale styling silently.
- `conventions.md` class names validated against the compiled CSS on 2026-07-09 (`.wrap .btn .btn-primary .btn-ghost .idx .display .sec-head .rule .hero .faq-item .pricing-core .included .p-number` + `--accent*` tokens). Re-validate after any big `globals.css` refactor; note `.card`/`.eyebrow`/`.mono` do NOT exist as classes.
- The dashboard (`/dashboard`) styles via **inline styles**, not the class vocabulary — conventions describe the marketing-site idiom, which is the correct one for new designs.

## Re-sync command
```sh
cp -r <skill-base-dir>/{package-build.mjs,package-validate.mjs,package-capture.mjs,resync.mjs,lib,storybook} .ds-sync/
# regenerate ds.css (block above), fetch remote _ds_sync.json → .design-sync/.cache/remote-sync.json, then:
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules \
  --entry .design-sync/ds-entry.mjs --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
```
