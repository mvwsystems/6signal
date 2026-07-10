# 6 Signal — build conventions

**Identity:** an intelligence-briefing aesthetic for a contractor AI-visibility practice. Near-black ground, one electric accent, precise typography. Direct, technical, zero hype — no gradients, no stock photos, no exclamation points in copy.

## Ground rules
- Page background is always `#060606` (elevated surfaces `#0e0e0c`); body text `#f5f5f3`.
- ONE accent color: electric yellow via `var(--accent)` (#E6FF00). Soft washes: `var(--accent-soft)`, hairlines `var(--accent-line)`, glows `var(--accent-glow)`, faint fills `var(--accent-faint)`. Never introduce other hues; status colors only when data demands (#22c55e ok / #f97316 warn / #ef4444 danger).
- Corners are square: border-radius 0–2px everywhere. Borders are thin: `1px solid rgba(255,255,255,0.07)`.
- Fonts (loaded by `styles.css` from Google): **"Chakra Petch"** for display headings and buttons (700, uppercase feels native), **"Inter"** for body, **"JetBrains Mono"** for labels/eyebrows/numbers (letter-spacing 0.2em+, uppercase, 10–12px).

## Class vocabulary (from the shipped stylesheet — use these, don't invent)
- `.wrap` — page-width container (max-width + gutters). Wrap every section's content in it.
- `.btn` + `.btn-primary` — the yellow CTA (dark text on accent); `.btn` + `.btn-ghost` — outlined secondary.
- `.idx` — the mono eyebrow label ("§ 01 — THE SIGNALS" style) that opens sections.
- `.display` — the big Chakra Petch display heading; pair with `<em>` for the italicized line.
- `.sec-head` — section header row: `.left` holds `.idx` + `.display`, `.right` holds a short intro paragraph.
- `.rule` — section with a top hairline divider.
- `.hero` — full-height opener block.
- `.faq-item`, `.pricing-core`, `.included`, `.p-number` — FAQ rows and the pricing block family.

For anything the vocabulary doesn't cover, write inline styles or new CSS **using the tokens above** — dark panels are `background:#0e0e0c; border:1px solid rgba(255,255,255,0.07); border-radius:2px; padding:20-24px`. Numbers and metrics render in JetBrains Mono with a color that encodes meaning (accent or status).

## Where the truth lives
Read `styles.css` and its import `_ds_bundle.css` before styling — the full class vocabulary and every token definition is there. `guidelines/6SIGNAL_BRAND_BRIEF.md` carries the voice and layout language.

## Idiomatic snippet
```jsx
<section className="rule">
  <div className="wrap">
    <div className="sec-head">
      <div className="left">
        <span className="idx">§ 02 — The work</span>
        <h2 className="display">One sprint.<br /><em>Then you decide.</em></h2>
      </div>
      <div className="right">One bounded engagement. No tiers, no setup fees.</div>
    </div>
    <a className="btn btn-primary" href="#">Get the audit →</a>
  </div>
</section>
```
