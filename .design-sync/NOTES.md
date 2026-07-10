# design-sync notes — 6signal

- This repo is a **Next.js site, not a component library**. The sync ships the **brand layer** (tokens + compiled class vocabulary + guidelines) **plus six chart primitives** extracted 2026-07-09 into [app/components/charts.tsx](../app/components/charts.tsx): Radar, Ring, SignalBars, LineChart, Donut, Sparkline. That module is dependency-free (hand-built SVG, inline styles) — safe outside Next. The rest of `app/components/*` stays welded to Next internals (next/link, router hooks, Typeform) — do not sync as-is.
- **Entry**: `.design-sync/ds-entry.mjs` re-exports the six charts + SIGNALS/scoreColor/tierOf from `app/components/charts` — passed via `--entry`.
- **Previews are hand-authored** in `.design-sync/previews/*.tsx`. Every cell must be wrapped in the dark `Ground` helper (`background:#060606`, inline-block, padding 20) — the app's preview card ground is light and the components' near-white text/gridlines wash out without it. Do not remove the wrapper on rebuilds.
- **cardMode overrides**: LineChart and SignalBars are wide → `overrides.{LineChart,SignalBars}.cardMode: "column"` in config.json fixes [GRID_OVERFLOW]. Keep them.
- **Sparkline [RENDER_THIN] is benign**: it's a 26px axis-less line by design. Triage as pass; don't iterate on it.
- **cssEntry is GENERATED** (`.design-sync/.cache/ds.css`, gitignored). Regenerate before every re-sync:
  ```sh
  grep -v '@import "@typeform' app/globals.css > .design-sync/.cache/globals-input.css
  npx tailwindcss -c tailwind.config.ts -i .design-sync/.cache/globals-input.css -o .design-sync/.cache/globals-compiled.css
  { echo '@import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap");'; cat .design-sync/.cache/globals-compiled.css; } > .design-sync/.cache/ds.css
  ```
  (Tailwind v3 CLI; the `@typeform` import is dropped on purpose — node_modules CSS irrelevant to designs.)
- Fonts are **Google-hosted remote** (`@import` in cssEntry) → `[FONT_REMOTE]` is expected, not a problem.

## Known render warns
- Playwright + chromium installed 2026-07-09 (user approved) — captures run for real now.
- `[RENDER_THIN]` on Sparkline — expected, see above.

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
