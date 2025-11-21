# Guardian UI (Pixel Pitch)

Next.js 14 (App Router) frontend for the Guardian mobile security cockpit. It provides a polished landing page, login/register flow, and a live upload dashboard that talks to the backend scanner (FastAPI) to submit APKs, poll run status, and render verdicts.

## Features
- Landing page with workflow walkthrough, live stats band, and upload CTA.
- Auth pages for register/login that hit `/auth/register` and `/auth/login`, persisting a session in `localStorage` (`guardian:user`) to unlock uploads.
- Drag-and-drop uploader that posts to `/scan`, then polls `/scan/{scan_id}` with optional `guardian-key` header; shows run steps, logs, external IDs, and raw JSON results.
- Outcome highlights (heuristic score, family guess, YARA/IOC counts, storefront/EDR hints) derived from scan responses.
- Light/dark theme toggle, glassmorphism styling, and animated UI using Framer Motion.

## Stack
- Next.js 14, React 18, TypeScript
- Tailwind CSS (+ tailwind-merge, class-variance-authority) and `lucide-react`
- `next-themes` for theming, `sonner` for toasts, `framer-motion` for motion

## Getting started
Prereqs: Node 18+ and pnpm (recommended) or npm.

```bash
pnpm install
```

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000   # FastAPI backend
NEXT_PUBLIC_GUARDIAN_KEY=your-optional-shared-key
```

Run the dev server:

```bash
pnpm dev
```

Other scripts:
- `pnpm build` – production build
- `pnpm start` – run the built app
- `pnpm lint` – lint the project

## API expectations
- `POST /auth/register` with `{ username, password }`
- `POST /auth/login` returns `{ token, expires_at }`
- `POST /scan` multipart with `file`; responds with `{ scan_id }`
- `GET /scan/{scan_id}` returns `status`, `steps`, `logs`, and `result`
- `GET /stats` for totals/flagged/average duration
- Optional `guardian-key` header is sent when `NEXT_PUBLIC_GUARDIAN_KEY` is set.

## Notable paths
- `app/page.tsx` – marketing/overview page with pipeline steps and stats band.
- `app/upload/page.tsx` – full upload + live run dashboard.
- `app/auth/login/page.tsx` and `app/auth/register/page.tsx` – mock session flows.
- `components/` – UI building blocks (theme toggle, stats band, run steps, result panel, log console, upload card).

## Notes
- Session data is stored client-side only for demo (`localStorage`).
- Styling uses Tailwind with a small set of custom utilities in `app/globals.css`.
