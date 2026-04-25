# 6 Signal — Landing Site

Marketing site for 6 Signal, a specialized AI visibility practice for roofing operators.

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Deployed on Netlify

## Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Build

```bash
npm run build
```

## Deployment to Netlify

1. Push this repo to GitHub.
2. In Netlify, click **Add new site → Import an existing project**.
3. Select your GitHub repo. Netlify auto-detects Next.js — no config changes needed.
4. Build command: `npm run build`
5. Publish directory: `.next`
6. Click **Deploy**.

The included `netlify.toml` and `@netlify/plugin-nextjs` (auto-installed) handle SSR routing.

## Custom domain

Once live, in Netlify: **Domain settings → Add custom domain → 6signal.co** (or whatever you register). Follow Netlify's DNS instructions.

## What's where

- `app/page.tsx` — the entire landing page
- `app/globals.css` — design system (Fraunces serif, Inter, JetBrains Mono, hairline rules)
- `app/layout.tsx` — root layout, font preloads, metadata
- `tailwind.config.ts` — design tokens

## Future routes

To add `/audit` (the paid audit purchase page) or `/book` (Calendly embed), create:

- `app/audit/page.tsx`
- `app/book/page.tsx`

Both will inherit the global styles and layout automatically.
