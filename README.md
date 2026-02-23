# Reconnect

Starter Next.js repository with GSAP and Sanity dependencies installed.

## Start Here

- Daily workflow (dev vs presentation): `DAILY_OPERATION_GUIDE.md`
- One-command workflow agent: `WORKFLOW_AGENT.md`
- Run from project root: `npm run agent:sync -- "chore(dev): daily sync"`
## Requirements

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check:video-contract` - Fail if disallowed raw `<video>` tags are introduced
- `npm run test:e2e:webkit` - Run WebKit autoplay regression tests
- `npm run ci:video-autoplay` - Contract check + WebKit autoplay tests

## Project structure

- `app/` - Next.js App Router files
- `public/` - Static assets
- `public/fonts/` - Place local font files here
- `.env.example` - Copy to `.env.local` and set values

## Video Autoplay Contract (iOS/Safari)

This project has an enforced autoplay contract to reduce regressions on iPhone Safari/Chrome and desktop Safari.

Rules:

- Use `components/media/InlineAutoplayVideo.tsx` for content videos.
- Raw `<video>` usage is allowed only in:
  - `components/media/InlineAutoplayVideo.tsx`
  - `components/sections/HeroRadar.tsx`
- Required attributes and behavior are enforced by tests/scripts:
  - muted inline autoplay tags (`autoplay`, `muted`, `playsInline`, `loop`, `disableRemotePlayback`, no controls)
  - iOS inline hints (`webkit-playsinline`, `x-webkit-airplay="deny"`)
  - first-gesture playback unlock fallback

Verification:

```bash
npm run check:video-contract
npm run test:e2e:webkit
```

CI also runs these checks in `.github/workflows/video-autoplay-contract.yml`.

Important platform note:

- iOS Low Power Mode can still block autoplay by browser policy. The first-gesture fallback is expected behavior in that state.
