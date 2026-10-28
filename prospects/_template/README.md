# Prospect report template

The client-facing "AI Visibility Findings & Growth Plan" report (first produced for OEM
Contracting, then Hard Rock Custom Countertops) is built from a single HTML file and
rendered to a Letter PDF with headless Chromium:

```
cp -r prospects/hard-rock-custom-countertops prospects/<new-client>
# edit prospects/<new-client>/report.html (the fonts/ folder is shared boilerplate)
NODE_PATH=$(npm root -g) node scripts/render-report-pdf.mjs prospects/<new-client>/report.html prospects/<new-client>/<Client>-AI-Visibility-Report.pdf
```

`phases-and-pricing.html` in this folder holds the house language for the plan table,
the pricing box, the market-rate comparison and the exclusivity line. Paste those blocks
into every new report unchanged, then edit only the client-specific phase descriptions.
Change the shared language here first, then in any report still being sold.

Locked lines (updated 2026-10-28):
- Foundation is a one-time $1,000 GBP build and **ships with a 52-week posting kit**
  (calendar, 52 market-tuned prompts, photo checklist, one-page routine). The build never
  promises ongoing posting.
- **GBP Autopilot is the only recurring line in the foundation, at $97/month**, optional,
  included during the 90-Day Sprint, month to month after. Do not sell it standalone until
  the posting job is running in the background worker (LocalPosts API or Ayrshare).
- The 90-Day Sprint stays $1,500/month, 90-day minimum, one business per market per trade,
  and folds in the $1,000 build at no extra cost.
- Front-office AI: $500 setup then $397/month. Scoped phases: $500 remote / $1,000 on-site
  scoping, credited in full against the build within thirty days.
- Photography and video are never included: "You shoot it, we do everything after."
