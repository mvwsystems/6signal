#!/usr/bin/env python3
"""Render a white paper cover PNG (2040x2640) in the 6 Signal series style.

The covers are a fixed layout — chevron + wordmark, paper number, field-of-study
rule, a two-line display title whose last line is accent italic, a mono standfirst,
one bespoke data figure, and a footer rule. Only the figure changes between papers,
so each entry below supplies its own inline SVG and everything else is shared.

Usage:  python3 scripts/make-wp-cover.py [slug ...]        (default: all)
Needs:  Google Chrome, and Chakra Petch + JetBrains Mono installed locally.
Output: public/papers/covers/<slug>.png
"""
import subprocess, sys, tempfile, pathlib, html

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT = pathlib.Path("public/papers/covers")
W, H = 2040, 2640

# ── The bespoke figure for each paper ────────────────────────────────────────
# Drawn at 1840x900 and dropped into the cover's figure slot. Same visual
# grammar as the in-article charts: one accent series, everything else gray.

DIRECTORY_COLLAPSE_FIG = """
<svg viewBox="0 0 1840 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#E6FF00" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#E6FF00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="900" cy="640" rx="700" ry="260" fill="url(#glow)"/>

  <text x="60" y="40" fill="#55554f" font-size="24" font-family="JetBrains Mono, monospace" letter-spacing="5">CITATIONS PER CHECK</text>
  <text x="1780" y="40" fill="#55554f" font-size="24" font-family="JetBrains Mono, monospace" letter-spacing="5" text-anchor="end">JUL &#8594; SEP 2026</text>
  <line x1="60" y1="72" x2="1780" y2="72" stroke="#232320" stroke-width="2"/>

  <text x="60" y="179" fill="#8a8a80" font-size="28" font-family="JetBrains Mono, monospace" letter-spacing="3">ANGI</text>
  <line x1="470" y1="144" x2="1180" y2="196" stroke="#4a4a44" stroke-width="4"/>
  <circle cx="470" cy="144" r="10" fill="#4a4a44"/><circle cx="1180" cy="196" r="10" fill="#4a4a44"/>
  <text x="1240" y="179" fill="#6a6a64" font-size="28" font-family="JetBrains Mono, monospace">1.27 &#8594; 0.57</text>
  <text x="60" y="294" fill="#8a8a80" font-size="28" font-family="JetBrains Mono, monospace" letter-spacing="3">YELP</text>
  <line x1="470" y1="259" x2="1180" y2="311" stroke="#4a4a44" stroke-width="4"/>
  <circle cx="470" cy="259" r="10" fill="#4a4a44"/><circle cx="1180" cy="311" r="10" fill="#4a4a44"/>
  <text x="1240" y="294" fill="#6a6a64" font-size="28" font-family="JetBrains Mono, monospace">1.03 &#8594; 0.48</text>
  <text x="60" y="409" fill="#8a8a80" font-size="28" font-family="JetBrains Mono, monospace" letter-spacing="3">BBB</text>
  <line x1="470" y1="374" x2="1180" y2="426" stroke="#4a4a44" stroke-width="4"/>
  <circle cx="470" cy="374" r="10" fill="#4a4a44"/><circle cx="1180" cy="426" r="10" fill="#4a4a44"/>
  <text x="1240" y="409" fill="#6a6a64" font-size="28" font-family="JetBrains Mono, monospace">1.06 &#8594; 0.72</text>
  <text x="60" y="589" fill="#E6FF00" font-size="28" font-family="JetBrains Mono, monospace" letter-spacing="3">LICENSE BOARD</text>
  <line x1="470" y1="606" x2="1180" y2="554" stroke="#E6FF00" stroke-width="5"/>
  <circle cx="470" cy="606" r="10" fill="#E6FF00"/><circle cx="1180" cy="554" r="12" fill="#E6FF00"/>
  <text x="1240" y="589" fill="#E6FF00" font-size="28" font-family="JetBrains Mono, monospace">1.56 &#8594; 1.89</text>
  <text x="60" y="709" fill="#E6FF00" font-size="28" font-family="JetBrains Mono, monospace" letter-spacing="3">CITY GOVERNMENT</text>
  <line x1="470" y1="726" x2="1180" y2="674" stroke="#E6FF00" stroke-width="5"/>
  <circle cx="470" cy="726" r="10" fill="#E6FF00"/><circle cx="1180" cy="674" r="12" fill="#E6FF00"/>
  <text x="1240" y="709" fill="#E6FF00" font-size="28" font-family="JetBrains Mono, monospace">0.38 &#8594; 0.68  &#43;79%</text>

  <line x1="60" y1="490" x2="1780" y2="490" stroke="#232320" stroke-width="2" stroke-dasharray="10 10"/>
  <text x="1780" y="474" fill="#3f3f3a" font-size="22" font-family="JetBrains Mono, monospace" letter-spacing="4" text-anchor="end">SOLD &#8595;  &#183;  KEPT &#8593;</text>

  <line x1="60" y1="800" x2="1780" y2="800" stroke="#232320" stroke-width="2"/>
  <text x="60" y="858" fill="#55554f" font-size="24" font-family="JetBrains Mono, monospace" letter-spacing="4">EVERYTHING FALLING HAS A SALES TEAM</text>
  <text x="1780" y="858" fill="#55554f" font-size="24" font-family="JetBrains Mono, monospace" letter-spacing="4" text-anchor="end">2,100 TRACKED CHECKS</text>
</svg>
"""

CONVERGENCE_FIG = """
<svg viewBox="0 0 1840 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#E6FF00" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#E6FF00" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="1380" cy="395" rx="300" ry="230" fill="url(#glow2)"/>

  <text x="60" y="40" fill="#55554f" font-size="24" font-family="JetBrains Mono, monospace" letter-spacing="5">MENTION RATE BY SURFACE</text>
  <text x="1780" y="40" fill="#55554f" font-size="24" font-family="JetBrains Mono, monospace" letter-spacing="5" text-anchor="end">JUL &#8594; OCT 2026</text>
  <line x1="60" y1="72" x2="1780" y2="72" stroke="#232320" stroke-width="2"/>

  <line x1="340" y1="166" x2="340" y2="546" stroke="#55554f" stroke-width="34" stroke-opacity="0.30"/>
  <line x1="1380" y1="325" x2="1380" y2="465" stroke="#E6FF00" stroke-width="34" stroke-opacity="0.22"/>

  <polyline points="340,166 700,359 1040,355 1380,329" fill="none" stroke="#8a8a80" stroke-width="5"/>
  <polyline points="340,272 700,396 1040,422 1380,387" fill="none" stroke="#6a6a64" stroke-width="4"/>
  <polyline points="340,301 700,424 1040,379 1380,325" fill="none" stroke="#9a9a90" stroke-width="4"/>
  <polyline points="340,546 700,591 1040,527 1380,465" fill="none" stroke="#E6FF00" stroke-width="5"/>
  <polyline points="1040,653 1380,419" fill="none" stroke="#c8dc00" stroke-width="4" stroke-dasharray="14 10"/>

  <circle cx="340" cy="166" r="11" fill="#8a8a80"/>
  <circle cx="340" cy="546" r="11" fill="#E6FF00"/>
  <circle cx="1380" cy="325" r="11" fill="#9a9a90"/>
  <circle cx="1380" cy="465" r="11" fill="#E6FF00"/>

  <text x="368" y="148" fill="#a8a8a3" font-size="25" font-family="JetBrains Mono, monospace">GEMINI 92.0%</text>
  <text x="368" y="526" fill="#E6FF00" font-size="25" font-family="JetBrains Mono, monospace">CLAUDE 26.5%</text>

  <text x="1420" y="327" fill="#a8a8a3" font-size="24" font-family="JetBrains Mono, monospace">PERPLEXITY 64.7 &#183; GEMINI 64.0</text>
  <text x="1420" y="395" fill="#8a8a80" font-size="24" font-family="JetBrains Mono, monospace">CHATGPT 54.0</text>
  <text x="1420" y="427" fill="#c8dc00" font-size="24" font-family="JetBrains Mono, monospace">AI OVERVIEWS 48.4</text>
  <text x="1420" y="475" fill="#E6FF00" font-size="24" font-family="JetBrains Mono, monospace">CLAUDE 40.5</text>

  <text x="340" y="760" fill="#8a8a80" font-size="27" font-family="JetBrains Mono, monospace" text-anchor="middle">65.5 PTS</text>
  <text x="340" y="792" fill="#55554f" font-size="22" font-family="JetBrains Mono, monospace" letter-spacing="3" text-anchor="middle">JULY SPREAD</text>
  <text x="1380" y="760" fill="#E6FF00" font-size="27" font-family="JetBrains Mono, monospace" text-anchor="middle">24.2 PTS</text>
  <text x="1380" y="792" fill="#8a8a80" font-size="22" font-family="JetBrains Mono, monospace" letter-spacing="3" text-anchor="middle">OCTOBER SPREAD</text>

  <line x1="60" y1="830" x2="1780" y2="830" stroke="#232320" stroke-width="2"/>
  <text x="60" y="880" fill="#55554f" font-size="24" font-family="JetBrains Mono, monospace" letter-spacing="4">SIX SURFACES, ONE CONTRACTOR, CLOSING</text>
  <text x="1780" y="880" fill="#55554f" font-size="24" font-family="JetBrains Mono, monospace" letter-spacing="4" text-anchor="end">2,871 TRACKED CHECKS</text>
</svg>
"""

COVERS = {
    "the-directory-collapse-ai-citation-shift": dict(
        number="08 / 08",
        field="CITATION ANALYSIS &#215; AI VISIBILITY",
        read="18 MIN READ",
        title_white="THE DIRECTORY",
        title_accent="COLLAPSE.",
        standfirst="What 2,100 tracked AI checks in one Dallas&#8211;Fort Worth market reveal about "
                   "the collapse of directory citations &#8212; and the institutional records quietly "
                   "replacing them.",
        figure=DIRECTORY_COLLAPSE_FIG,
        strip_left="32.78&#176;N &#183; THE TRUST STACK, RE-WEIGHTED",
        strip_right="97.33&#176;W &#183; DFW",
        discipline="AI Visibility &#183; Citation Analysis",
        published="October 2026",
        url_line1="6signal.co/research/",
        url_line2="the-directory-collapse &#8594;",
    ),
    "the-convergence-ai-engines-agree": dict(
        number="09 / 09",
        field="ENGINE BEHAVIOR &#215; AI VISIBILITY",
        read="17 MIN READ",
        title_white="THE",
        title_accent="CONVERGENCE.",
        standfirst="Six AI engines used to disagree about one contractor by 65 percentage points. "
                   "Across 2,871 tracked checks, the spread closed to 24 &#8212; and Google&#8217;s "
                   "mainstream answer surface switched on.",
        figure=CONVERGENCE_FIG,
        strip_left="32.78&#176;N &#183; THE SPREAD, CLOSING",
        strip_right="97.33&#176;W &#183; DFW",
        discipline="AI Visibility &#183; Engine Behavior",
        published="November 2026",
        url_line1="6signal.co/research/",
        url_line2="the-convergence &#8594;",
    ),
}

TEMPLATE = """<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page {{ size: {W}px {H}px; margin: 0; }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: {W}px; height: {H}px; background: #060606; overflow: hidden; }}
  body {{ padding: 128px 128px 96px; display: flex; flex-direction: column;
          font-family: "JetBrains Mono", monospace; -webkit-font-smoothing: antialiased; }}

  .top {{ display: flex; justify-content: space-between; align-items: center; }}
  .mark {{ display: flex; align-items: center; gap: 26px; }}
  .wordmark {{ font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: 58px;
               letter-spacing: 1px; color: #f5f5f3; }}
  .papernum {{ display: flex; align-items: center; gap: 24px; font-size: 30px; letter-spacing: 10px;
               color: #f5f5f3; }}
  .dot {{ width: 14px; height: 14px; border-radius: 50%; background: #E6FF00; }}

  .fieldrow {{ display: flex; align-items: center; gap: 36px; margin-top: 150px; }}
  .rule {{ width: 76px; height: 4px; background: #E6FF00; }}
  .field {{ font-size: 28px; letter-spacing: 9px; color: #c8c8c4; flex: 1; }}
  .read {{ font-size: 28px; letter-spacing: 9px; color: #c8c8c4; }}

  h1 {{ font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: 170px; line-height: 0.92;
        letter-spacing: -2px; color: #f5f5f3; margin-top: 56px; text-transform: uppercase; }}
  h1 .accent {{ color: #E6FF00; font-style: italic; }}

  .standfirst {{ font-size: 34px; line-height: 1.58; color: #c8c8c4; margin-top: 60px; max-width: 1640px; }}

  .figwrap {{ flex: 1; display: flex; align-items: center; margin-top: 40px; }}
  .figwrap svg {{ width: 100%; height: auto; }}

  .strip {{ display: flex; justify-content: space-between; border-top: 2px solid #1c1c19;
            padding-top: 26px; font-size: 24px; letter-spacing: 5px; color: #3f3f3a; }}

  footer {{ display: flex; justify-content: space-between; align-items: flex-end; margin-top: 56px; }}
  .lbl {{ font-size: 24px; letter-spacing: 8px; color: #55554f; margin-bottom: 18px; }}
  .author {{ font-family: "Chakra Petch", sans-serif; font-weight: 600; font-size: 40px; color: #f5f5f3; }}
  .disc {{ font-size: 26px; color: #6a6a64; margin-top: 10px; }}
  .pub {{ font-size: 34px; color: #f5f5f3; }}
  .url {{ font-size: 30px; color: #E6FF00; line-height: 1.5; text-align: right; }}
  .r {{ text-align: right; }}
</style></head><body>

  <div class="top">
    <div class="mark">
      <svg width="104" height="46" viewBox="0 0 104 46" fill="none">
        <path d="M2 2 L24 23 L2 44" stroke="#E6FF00" stroke-width="9" stroke-linecap="square"/>
        <path d="M36 2 L58 23 L36 44" stroke="#E6FF00" stroke-width="9" stroke-linecap="square" opacity="0.72"/>
        <path d="M70 2 L92 23 L70 44" stroke="#E6FF00" stroke-width="9" stroke-linecap="square" opacity="0.42"/>
      </svg>
      <div class="wordmark">SIXSIGNAL</div>
    </div>
    <div class="papernum"><span class="dot"></span>WHITE PAPER &#183; {number}</div>
  </div>

  <div class="fieldrow">
    <div class="rule"></div>
    <div class="field">{field}</div>
    <div class="read">{read}</div>
  </div>

  <h1>{title_white}<br><span class="accent">{title_accent}</span></h1>

  <div class="standfirst">{standfirst}</div>

  <div class="figwrap">{figure}</div>

  <div class="strip"><span>{strip_left}</span><span>{strip_right}</span></div>

  <footer>
    <div>
      <div class="lbl">AUTHOR</div>
      <div class="author">The 6 Signal Research Team</div>
      <div class="disc">{discipline}</div>
    </div>
    <div>
      <div class="lbl">PUBLISHED</div>
      <div class="pub">{published}</div>
    </div>
    <div class="r">
      <div class="lbl">READ</div>
      <div class="url">{url_line1}<br>{url_line2}</div>
    </div>
  </footer>

</body></html>
"""


def render(slug: str, spec: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    page = TEMPLATE.format(W=W, H=H, **spec)
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as fh:
        fh.write(page)
        src = fh.name
    dest = OUT / f"{slug}.png"
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
         f"--window-size={W},{H}", f"--screenshot={dest}",
         "--virtual-time-budget=8000", f"file://{src}"],
        check=True, capture_output=True,
    )
    print(f"wrote {dest}")
    pathlib.Path(src).unlink(missing_ok=True)


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(COVERS)
    for slug in wanted:
        if slug not in COVERS:
            sys.exit(f"unknown cover slug: {slug}")
        render(slug, COVERS[slug])
