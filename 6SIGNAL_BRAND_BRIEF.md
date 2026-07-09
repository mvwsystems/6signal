# 6Signal — Complete Brand, Design & Messaging Brief
**For use with AI tools, dashboards, and any new 6Signal interface.**
Last updated: 2026-05-21

---

## SECTION 1 — WHO 6SIGNAL IS

### What 6Signal does
6Signal is an AI visibility and infrastructure practice for local service businesses and contractors. The core offer: helping businesses get found, trusted, and recommended across Google, AI search, voice search, Maps, answer engines, and directories before competitors fill that gap.

### The target customer
Local service businesses and residential/commercial contractors: HVAC, plumbing, roofing, electrical, remodeling, landscaping, pest control, foundation/concrete, garage doors, tree service, and similar trades. Also serves broader local service companies. Based in Dallas/Fort Worth.

### The core problem being solved
Customers no longer search and browse — they ask AI (ChatGPT, Gemini, Siri, Perplexity, Google AI Overviews) who to call. If a business isn't clearly structured, verified, and understood by these systems, it gets skipped. 6Signal fixes that infrastructure.

### The offer
- **Core retainer**: AI visibility + infrastructure — the "Six Signal" system across six visibility layers
- **Entry point**: The Visibility Audit — a free 30-minute readout showing exactly where the business appears or doesn't appear across all six layers
- **Additional capabilities**: Website builds, GBP optimization, review systems, lead capture, automation, advisory, Labs (TakeoffCopilot, BidForge)

### Positioning statement
> "The businesses that win next will have the clearest signals."
> 6Signal is not a general marketing agency. It is a specialized visibility practice. Visibility first, always.

### The six layers (The Six Signals)
1. **Search Signal** — Google ranking and organic findability
2. **AI Signal** — ChatGPT, Gemini, Perplexity, Google AI Overviews citations
3. **Local Signal** — Maps, GBP, voice search, local packs
4. **Trust Signal** — Reviews, ratings, proof, third-party validation
5. **Content Signal** — FAQs, service pages, question-answering content
6. **Conversion Signal** — Website structure, CTA clarity, follow-up systems

---

## SECTION 2 — VOICE AND TONE

### The voice
Direct. Tactical. Intelligent. Premium. Calm urgency without hype.

It reads like an intelligence briefing or field report — not like a marketing agency pitch. It is confident without being arrogant. It explains clearly without being condescending. It treats the reader as a capable owner, not a lead to manipulate.

### Tone modifiers
- **Serious** — This is about a real business problem with real financial consequences
- **Precise** — Use specific language. Vague marketing language is actively wrong for this brand
- **Economical** — Short sentences. No padding. No throat-clearing
- **Grounded** — Never hype, never fake urgency, never "AI bro" enthusiasm

### What 6Signal sounds like (correct examples)
- "Search used to send customers to options. AI sends customers to conclusions."
- "You may not be losing leads because your service is worse. You may be losing because AI does not understand why it should recommend you."
- "The companies that are already clear become more visible. The companies that are unclear become easier to skip."
- "In the old world, being online was enough. In the new world, being understood is the advantage."
- "Most owners will ignore this until the phone slows down."

### What 6Signal does NOT sound like (incorrect examples)
- ❌ "Supercharge your online presence with cutting-edge AI!"
- ❌ "We help businesses like yours dominate local search."
- ❌ "Our proven system guarantees results."
- ❌ "In today's digital landscape, visibility has never been more important."
- ❌ "Let's take your business to the next level."
- ❌ Emojis, exclamation points used for emphasis, or casual filler phrases

### CTA language rules — EXACT
- Primary CTA: **"Book the Visibility Audit"** — this exact phrase, every time
- Secondary CTA: **"See What We Check"** — if a secondary action is needed
- Navigation CTA: **"Book the audit →"** — shorter version for nav bar only
- NEVER use: "Get started", "Learn more", "Book a call", "Schedule a demo", "Sign up", "Request a check", "Book a Visibility Audit" (wrong article), "Get the AI Visibility Check"

### Section label language
Section labels (eyebrows, index labels) should be short, tactical, caps or small-caps, in JetBrains Mono. Examples:
- THE SHIFT / THE RISK / THE CHECK / THE SIX / THE WORK
- 01 / 02 / 03 (numbered)
- SIGNAL ACTIVE / SIGNAL WEAK
- R&D / ADVISORY / INFRASTRUCTURE

---

## SECTION 3 — DESIGN SYSTEM

### Color palette

| Role | Value | Usage |
|---|---|---|
| Background (primary) | `#060606` | Page background, card backgrounds |
| Background (elevated) | `#0e0e0c` | Elevated surfaces, dropdowns, secondary cards |
| Background (alt section) | `#080808` | Alternate section backgrounds |
| Text (primary) | `#f5f5f3` | Headlines, primary copy |
| Text (secondary) | `#b8b8b5` | Subheadings, supporting copy |
| Text (tertiary/dim) | `#9a9a98` | Body copy, descriptions |
| Text (muted) | `#7a7a78` | Labels, metadata, captions |
| Text (faint) | `#555553` | Index labels, decorative text |
| Text (ghost) | `#444442` | Very dim labels |
| Text (invisible/structural) | `#333331` | Copyright, extreme background text |
| **Accent (electric yellow)** | `#E6FF00` | Primary CTA buttons, hover states, active indicators, key highlights |
| Accent soft | `rgba(230,255,0,0.12)` | Accent backgrounds, subtle fills |
| Accent line | `rgba(230,255,0,0.35)` | Accent borders |
| Accent glow | `rgba(230,255,0,0.22)` | Glow effects |
| Accent faint | `rgba(230,255,0,0.055)` | Very subtle accent areas |
| Border (standard) | `rgba(255,255,255,0.07)` | Section dividers, card borders |
| Border (light) | `rgba(255,255,255,0.05)` | Subtle row separators |
| Border (dim) | `rgba(255,255,255,0.1)` | Stronger borders, input outlines |

**CRITICAL: There are NO other brand colors.** No blues, no greens, no reds, no purples. The palette is black, near-white grays, and electric yellow (`#E6FF00`). Any other color is wrong.

### CSS custom properties
```css
:root {
  --accent:       #E6FF00;
  --accent-soft:  rgba(230, 255, 0, 0.12);
  --accent-line:  rgba(230, 255, 0, 0.35);
  --accent-glow:  rgba(230, 255, 0, 0.22);
  --accent-faint: rgba(230, 255, 0, 0.055);
}
```

### Typography

#### Font stack
```
Headlines/UI:   "Chakra Petch", monospace
Body copy:      "Inter", system-ui, sans-serif
Labels/Mono:    "JetBrains Mono", ui-monospace, monospace
```

#### Font loading (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

#### Type scale
| Element | Font | Weight | Size (clamp) | Letter-spacing | Notes |
|---|---|---|---|---|---|
| Hero H1 | Chakra Petch | 400 | `clamp(48px, 7.4vw, 108px)` | `-0.03em` | |
| Display H1 (inner pages) | Chakra Petch | 400 | `clamp(40px, 6vw, 82px)` | `-0.03em` | |
| Section H2 | Chakra Petch | 400 | `clamp(38px, 5.2vw, 72px)` | `-0.03em` | |
| H2 emphasis (em) | Chakra Petch | 200 | inherited | inherited | `font-style: italic; color: #b8b8b5` |
| Body large | Chakra Petch | 300 | `clamp(18px, 1.55vw, 21px)` | `-0.01em` | color: `#b8b8b5` |
| Body standard | Inter | 400 | 16px | normal | color: `#9a9a98` |
| Index label (idx) | JetBrains Mono | 500 | 10–11px | `0.22em` | uppercase, `#555553` |
| Button text | Chakra Petch | 500 | 13–15px | `0.02em` | |

#### Typography rules
- Headlines use Chakra Petch, always
- `em` in headlines = italic, weight 200, color `#b8b8b5` (not the browser default italic)
- Body paragraphs: Inter or Chakra Petch depending on context
- Labels, metadata, numbered indexes: JetBrains Mono, letter-spacing 0.2–0.28em, uppercase
- Line-height for headlines: 1.02–1.06
- Line-height for body: 1.5–1.7
- Letter-spacing for headlines: `-0.03em` (tight)
- **Never use Helvetica, Arial, Roboto, or system sans-serif for visible UI text**

---

## SECTION 4 — COMPONENT PATTERNS

### Buttons

#### Primary button (yellow)
```css
background: #E6FF00;
color: #060606;
font-family: "Chakra Petch", monospace;
font-size: 13–15px;
font-weight: 500;
padding: 18–22px 28–34px;
border-radius: 2px;
border: 1px solid #E6FF00;
white-space: nowrap;
display: inline-flex;
align-items: center;
gap: 14px;
transition: background 0.3s, color 0.3s, border-color 0.3s;
```
Hover state:
```css
background: transparent;
color: #E6FF00;
border-color: #E6FF00;
transform: translateY(-1px);
```

#### Ghost/secondary button
```css
background: transparent;
color: #f5f5f3;
border: 1px solid rgba(255,255,255,0.14);
/* same font/padding as primary */
```
Hover:
```css
border-color: #f5f5f3;
background: rgba(255,255,255,0.025);
```

#### Button sizes
- Default: `padding: 18px 28px; font-size: 13px`
- Large (`btn-lg`): `padding: 22px 34px; font-size: 14px`
- XL (`btn-xl`): `padding: 20px 40px; font-size: 15px`

**Always include an arrow SVG `→` in CTA buttons:**
```jsx
<svg viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2" width="14" height="10">
  <path d="M0 5h14M10 1l4 4-4 4" />
</svg>
```

### Navigation bar
- `position: fixed; top: 0; left: 0; right: 0; z-index: 50`
- `background: rgba(6,6,6,0.72); backdrop-filter: blur(16px)`
- `border-bottom: 1px solid transparent` → on scroll: `rgba(255,255,255,0.07)`
- Nav links: Chakra Petch, 12–13px, `#b8b8b5`, letter-spacing `0.02em`
- Logo: `<img src="/6SIG_LOGO_FINAL_2.webp">` — do NOT recreate, do NOT use text
- CTA in nav: yellow primary button, text "Book the audit →"
- Mobile (≤860px): hide nav links, show mobile menu trigger (3 yellow dots)

### Cards
```css
/* Standard dark card */
background: #0e0e0c;
border: 1px solid rgba(255,255,255,0.07);
border-radius: 0; /* 6Signal uses 0 or 2px radius — never large radius */
padding: 28–48px;
```
- No box shadows used as primary styling (may use subtle glow for accent elements)
- No rounded corners beyond 2–3px
- No gradient card backgrounds
- Hover: subtle background lightening `rgba(255,255,255,0.018)`

### Data rows / table rows
```css
display: grid;
grid-template-columns: [num col] [name col] [body col];
padding: 28–40px 0;
border-bottom: 1px solid rgba(255,255,255,0.06);
border-top: 1px solid rgba(255,255,255,0.1); /* first row */
align-items: baseline;
```
Numbers/indexes in left column: JetBrains Mono, 11px, `#555553`, letter-spacing `0.2em`

### Index / eyebrow labels
```css
font-family: "JetBrains Mono", monospace;
font-size: 10–11px;
font-weight: 500;
letter-spacing: 0.22–0.28em;
text-transform: uppercase;
color: #555553;  /* or #E6FF00 for accent labels */
```

### Pull quotes / highlighted statements
```css
font-family: "Chakra Petch", monospace;
font-size: clamp(17px, 2vw, 26px);
font-weight: 300;
font-style: italic;
color: #b8b8b5;
border-left: 2px solid #E6FF00;
padding: 4px 0 4px 28px;
line-height: 1.55;
```

### Section dividers
- Use `border-top: 1px solid rgba(255,255,255,0.07)` between sections (the `rule` class)
- Never use `<hr>` or decorative dividers with color

### Accent dot / pulse indicator
```css
width: 6px; height: 6px;
border-radius: 50%;
background: #E6FF00;
box-shadow: 0 0 10px rgba(230,255,0,0.65);
animation: pulse 2.4s ease-in-out infinite;
```
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.65); }
}
```

### Grid layout
```css
/* Page wrapper */
.wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px; /* → 0 24px on mobile ≤800px */
}

/* Two-column section head */
.sec-head {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  padding: 120px 0 72px;
  align-items: end;
}
/* → 1fr on ≤900px */
```

### Dashboard-specific patterns
For a 6Signal dashboard, use these structural conventions:
- **Sidebar**: dark background `#0a0a08`, border-right `rgba(255,255,255,0.07)`, width 220–260px
- **Main area**: background `#060606`
- **Top bar**: same nav styling — dark, blurred, thin bottom border
- **Stat cards**: `#0e0e0c` background, `rgba(255,255,255,0.07)` border, 0px border-radius
- **Active nav item**: `color: #E6FF00; border-left: 2px solid #E6FF00`
- **Data values**: Chakra Petch, weight 200, large — same style as the pricing number
- **Charts/graphs**: use `#E6FF00` as the primary data color, `rgba(230,255,0,0.12)` as fills
- **Status indicators**: yellow dot (active), `#555553` dot (inactive), no red/green for status
- **Tables**: no background, row borders `rgba(255,255,255,0.05)`, headers in JetBrains Mono uppercase

---

## SECTION 5 — LAYOUT & SPACING

### Section padding
- Standard section: `padding: 100–120px 0`
- Hero section: `padding: 160–180px 0 100–120px`
- Small section: `padding: 60–80px 0`
- Mobile (≤800px): reduce to ~70% of desktop values

### Spacing scale (approximate)
| Use | Value |
|---|---|
| Between label and heading | 24–32px |
| Between heading and body | 28–36px |
| Between body and CTA | 40–56px |
| Between section head and content | 60–72px |
| Row gap in data lists | 0 (border-separated) |
| Card gap | 24–40px |
| Column gap | 60–80px |

### Breakpoints
| Breakpoint | Width | Change |
|---|---|---|
| Tablet | ≤900px | Two-column sections → single column |
| Mobile nav | ≤860px | Desktop nav → mobile nav (hamburger) |
| Mobile | ≤800px | Wrap padding 40px → 24px |
| Small mobile | ≤760px | Show sticky mobile CTA bar |
| Extra small | ≤700px | Stack remaining multi-column layouts |

---

## SECTION 6 — VISUAL LANGUAGE

### What to use
- **Thin borders** — `1px solid rgba(255,255,255,0.07)` everywhere
- **Concentric rings** — CSS circles at low opacity for decorative backgrounds
- **Chevron marks** — The brand mark: two stacked chevrons (`>`) in yellow/white/gray
- **Scanning/radar lines** — Rotating CSS animations for "signal" imagery
- **Grid lines** — Light structural lines at very low opacity
- **Noise texture** — `opacity: 0.028` SVG fractalNoise overlay on body (already in CSS)
- **Industrial typography** — Large, tight, heavy Chakra Petch for hero statements
- **Tactical labels** — Small JetBrains Mono labels positioned as overlays

### What NOT to use
- ❌ Stock photos of any kind
- ❌ Illustrations of AI robots, chatbots, or computer screens
- ❌ Pastel or "soft" color palettes
- ❌ Gradients (except very subtle dark-to-dark or accent glow effects)
- ❌ Large border-radius (>4px) — no "bubbly" UI
- ❌ Drop shadows as primary visual treatment
- ❌ Colorful icons (no blue info icons, green checkmarks, orange warnings)
- ❌ Any color other than the palette defined in Section 3
- ❌ Generic SaaS dashboard aesthetics (white backgrounds, blue primary colors)
- ❌ Charts with multiple colors — use shades of the yellow accent only
- ❌ Glassmorphism with colored tints

### The brand mark (chevrons)
The 6Signal logo consists of three stacked chevrons pointing right: yellow (`#E6FF00`), white (`#f0f0f0`), gray (`#707070`). Never recreate this in code — always use the image `/6SIG_LOGO_FINAL_2.webp`.

### Motion / animation
- Reveal animations: `opacity 0 → 1` + `translateY(20px) → translateY(0)`, `0.6s ease-out`
- Staggered: 55ms delay between sequential elements
- Button hover: `translateY(-1px)`, `0.4s cubic-bezier(0.2,0.8,0.2,1)`
- Arrow in button: `translateX(5px)` on hover
- Scanning line: `rotate(0 → 360deg)`, `5s linear infinite`
- Pulse dot: opacity + scale, `2.4s ease-in-out infinite`
- No bounce, no spring, no overshoot animations

---

## SECTION 7 — MESSAGING & COPY

### Tagline / core positioning
> "Be the contractor AI recommends."

### Primary value statements
- "Get found. Get trusted. Get chosen."
- "Visibility first."
- "Six signals. One practice."
- "The businesses that win next will have the clearest signals."
- "In the old world, being online was enough. In the new world, being understood is the advantage."

### The problem statement
> "Customers are no longer just searching. They are asking ChatGPT, Google AI, Siri, Gemini, Perplexity, and voice assistants who to call. Most local businesses are invisible to these systems."

### The shift (short version)
> "Search used to send customers to options. AI sends customers to conclusions."

### What the Visibility Audit is
> "A free 30-minute readout. We run your company through all six visibility layers — AI tools, Maps, voice, answer engines, and directories — live on the call. The priority list is yours to keep regardless."

### Descriptor for 6Signal (how to describe the company)
- "A specialized AI visibility practice"
- "An AI visibility and infrastructure firm"
- "Not a marketing agency — a visibility practice"
- Based in Dallas/Fort Worth
- Serves residential and commercial contractors in DFW and select markets

### Service names (use exactly)
- The Visibility Audit (not "Visibility Audit" or "the audit" in formal contexts)
- The Six Signal System (or "The Six" in navigation)
- The Work (engagement/process)
- Capabilities (not "Services" — recently renamed)
- Research (content hub)
- AI Visibility Tools Index (tool at /research/ai-visibility-tools)

### What 6Signal is NOT
- Not a general digital marketing agency
- Not an SEO agency (SEO is one of six signals, not the whole offer)
- Not an ads agency
- Not a web design firm (though websites are a capability)
- Not a software product

---

## SECTION 8 — TECHNICAL STACK

### Framework
- **Next.js 15.5.18** — App Router, SSG/SSR
- **React** with TypeScript
- **Tailwind CSS** (used for base reset only — site uses custom CSS in `globals.css`)
- **Deployed on Netlify**

### Key files
| File | Purpose |
|---|---|
| `app/globals.css` | All CSS — single file, no modules |
| `app/layout.tsx` | Root layout with global metadata |
| `app/components/Nav.tsx` | Global navigation (client component) |
| `app/components/Footer.tsx` | Global footer |
| `app/components/AuditPopupButton.tsx` | Typeform popup CTA button |
| `app/lib/links.ts` | Typeform ID and other constants |
| `app/hooks/useMicroInteractions.ts` | Scroll reveal + FAQ toggle hook |

### CSS architecture
- All styles in `globals.css` — **no CSS modules, no Tailwind utility classes on components**
- `@layer base` — html/body/element resets
- `@layer components` — all component and page styles (lines 75–3445)
- Unlayered CSS at end of file — responsive overrides and additions (highest cascade priority)
- Class naming: semantic BEM-lite (`.nav-inner`, `.hero-deck`, `.sec-head`, etc.)
- New feature classes get a prefix (e.g., `.lp-` for landing pages, `.tindex-` for tools index)

### Component pattern
```tsx
"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import AuditPopupButton from "../components/AuditPopupButton";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

export default function PageName() {
  useMicroInteractions(); // enables scroll reveals + FAQ
  return (
    <>
      <Nav />
      {/* page content */}
      <Footer />
      <div className="mobile-cta">
        <AuditPopupButton>Book the Visibility Audit ...</AuditPopupButton>
      </div>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
    </>
  );
}
```

### Dashboard-specific implementation notes
- Dashboard pages should follow the same CSS variable system
- Use `#060606` or `#080808` as the base — never white or light gray backgrounds
- Sidebar active state: yellow left border + yellow text
- All data labels in JetBrains Mono uppercase
- All numeric values in Chakra Petch weight 200
- Status should use yellow dot (active) or gray dot (inactive) — not colored badges
- Import the same Google Fonts already loaded in the global layout
- Do not introduce new fonts, color systems, or shadow systems

---

## SECTION 9 — NAVIGATION STRUCTURE

### Main site navigation (exact links)
| Label | Route |
|---|---|
| The Six | `/#framework` |
| The Work | `/#engagement` |
| Retainer | `/#pricing` |
| FAQ | `/#faq` |
| Research | `/research` |

### Mobile overlay also includes:
| Label | Route |
|---|---|
| AI Visibility Tools | `/research/ai-visibility-tools` |
| Capabilities | `/capabilities` |

### Footer columns
- **Site**: The Method, The Six Layers, The Audit, Retainer, FAQ, Visibility, Contact
- **Trades**: Roofers, Plumbers, HVAC, Electricians, Remodelers, Garage Doors, Landscaping, Tree Service, Pest Control, Foundation, Commercial
- **Audit**: Book the audit, Get in touch, Research, AI Visibility Tools, Capabilities

### Pages NOT in any navigation (hidden/direct traffic only)
- `/ai-visibility-check` — cold traffic landing page

### Pages that exist (full route map)
- `/` — Homepage
- `/audit` — Audit detail page
- `/method` — The Method page
- `/work` — Case work / portfolio
- `/contact` — Contact
- `/visibility` — Visibility explainer
- `/capabilities` — Service capabilities (formerly /services, 301 redirect in place)
- `/research` — Research hub
- `/research/[slug]` — Individual research posts (27 posts)
- `/research/ai-visibility-tools` — AI visibility tools index
- `/ai-visibility-check` — Hidden landing page
- Trade pages: `/roofers`, `/plumbers`, `/hvac`, `/electricians`, `/remodelers`, `/garage-doors`, `/landscaping`, `/tree-service`, `/pest-control`, `/foundation-concrete`, `/commercial-contractors`

---

## SECTION 10 — WHAT TO AVOID (COMMON AI MISTAKES)

These are the specific patterns that produce wrong results. Avoid all of them.

### Styling mistakes
- ❌ Using white or light gray as page background
- ❌ Using blue, green, or any color outside the defined palette
- ❌ Using `border-radius > 4px` on cards or buttons
- ❌ Using large drop shadows (`box-shadow: 0 10px 40px rgba(0,0,0,0.3)`) as card treatment
- ❌ Using system fonts (Arial, Helvetica) for visible UI text
- ❌ Using gradient backgrounds on sections or cards
- ❌ Using Tailwind utility classes like `bg-blue-500`, `text-gray-600` — use CSS custom properties
- ❌ Centering all text (only center in final CTA sections)
- ❌ Making buttons large, rounded, and shadowed (generic SaaS look)
- ❌ Adding divider lines with color or making them thick

### Messaging mistakes
- ❌ Calling the company "6 Signal Digital" or "6Signal Agency"
- ❌ Describing 6Signal as an "SEO company" or "digital marketing agency"
- ❌ Using the CTA "Book a Visibility Audit" (wrong article — must be "Book THE Visibility Audit")
- ❌ Using "Get started" or "Learn more" as CTAs
- ❌ Writing in first person plural "we help companies grow their..."
- ❌ Using buzzwords: "cutting-edge", "innovative", "leverage", "synergy", "holistic"
- ❌ Adding exclamation points anywhere in body copy
- ❌ Describing AI search as an "opportunity" in a cheery marketing tone
- ❌ Making the tone casual, friendly, or conversational — it is serious and precise

### Component mistakes
- ❌ Adding a "hero image" or background photo to any section
- ❌ Using stock photography
- ❌ Creating icon sets with colored icons (info = blue, warning = orange, etc.)
- ❌ Making the header non-sticky or transparent on scroll
- ❌ Adding breadcrumbs or pagination that looks like a generic CMS theme
- ❌ Using table stripes (alternating gray rows) — use border separation instead
- ❌ Using progress bars with color fills other than `#E6FF00`
- ❌ Making chart legends with multiple colors

---

## SECTION 11 — QUICK REFERENCE CHEATSHEET

```
Brand name:       6Signal (or SIXSIGNAL in all-caps contexts)
Legal/formal:     6 Signal (two words with space, as in logo)
Background:       #060606
Elevated bg:      #0e0e0c
Text primary:     #f5f5f3
Text secondary:   #b8b8b5
Text dim:         #9a9a98
Text label:       #555553
Accent:           #E6FF00
Border:           rgba(255,255,255,0.07)
Font headline:    Chakra Petch
Font body:        Inter
Font label:       JetBrains Mono
Border radius:    0–2px (never more than 4px)
Primary CTA text: "Book the Visibility Audit"
Secondary CTA:    "See What We Check"
Nav CTA:          "Book the audit →"
Arrow icon:       SVG path "M0 5h14M10 1l4 4-4 4" (14×10, stroke 1.2)
Logo file:        /6SIG_LOGO_FINAL_2.webp (do not recreate)
OG image:         /6SIG_SOCIAL_SHARE.png
Base URL:         https://6signal.co
```
