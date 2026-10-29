# Earth Works — website rebuild (Phase 1: design system + homepage)

Static site, no build step. Built by 6 Signal (Matt Vincent Walker) for Earth Works, Lubbock, TX.

## Files
- `index.html` — homepage (one-page layout with anchor sections per service line, FAQ, estimate form, NAP footer, LocalBusiness + FAQPage JSON-LD)
- `styles.css` — design system. Tokens live in `:root` at the top: colors (`--caliche`, `--ink`, `--flag`), fonts (Archivo + IBM Plex Mono via Google Fonts), type scale.
- `script.js` — contour canvas in the hero, nav state + reading progress, scroll reveals, counters, grade-profile line draw, magnetic buttons, card spotlight, FAQ height animation, mobile menu.
- `thanks.html` — Netlify Forms success page. `netlify.toml`, `robots.txt`, `sitemap.xml`, `images/favicon.svg`.
- `employee-handbook.pdf` — the MKS Construction, LLC employee handbook (rev. 11/22/22), linked from the footer "Employee portal" (same as the current site's Employee Portal button).
- `images/` — `earth-works-logo.png` (extracted from the handbook PDF, transparent background) and job photos cropped from the current site: `aerial-jobsite-lubbock.jpg`, `commercial-slab-pour.jpg`, `grader-site-grading.jpg`, `slab-forms-concrete.jpg`. Ask the client for the originals at full resolution before launch; the grader and forms crops are low-res.

## Run locally
    npx serve .

## Edit cheatsheet
- Phone / email / address: search `722-0262`, `info@earthworkstx.com`, `5939 E Hwy 62` (they appear in the topbar, hero sheet, contact block, footer and JSON-LD).
- Accent color: change `--flag` and `--flag-deep` in `styles.css`.
- Hours: topbar, contact `.nap`, footer and the `openingHoursSpecification` block in `index.html`.
- Real photos: replace the `.about__photo` placeholder with an `<img>` (descriptive filename + alt text).

## Open questions for the client (also marked `<!-- TODO: confirm with client -->` in index.html)
1. Logo is the real one (from the handbook PDF); accent red `#C4090F` is sampled from it. The oval-plus-banner lockup ("CONCRETE • DIRT WORK") on the site is not in the PDF; ask for that file if they want it in the hero.
2. Fleet count (12 power units) and Earth Works Transport LLC / USDOT 3254331 — from the FMCSA record, confirm it should be published.
3. Energy scope (pipeline construction, right-of-way clearing, lease pads) — from directory listings, not the site.
4. Owner name for the About section (directories list Matt Schilling).
5. Exact service-area towns/counties.
6. Residential work: directories say commercial and residential; the site says commercial only.
7. Real Google reviews, licenses, and full-resolution photos.
8. Client logo files for the past-projects wall (names are listed from the current site's logo wall; the logos themselves belong to those clients).
9. Legal entity: footer says MKS Construction, LLC d.b.a. Earth Works per the handbook cover. Confirm it should appear publicly.

## Phase 2 (after owner review)
Service pages (`dirt-work.html`, `concrete.html`, `transportation.html`, `energy.html`), `about.html`, `contact.html`, each with Service + BreadcrumbList schema and 4–6 FAQs; OG image; 404 page; Lighthouse pass.
