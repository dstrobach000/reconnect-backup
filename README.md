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

## Animation Builder Notes

### Text Layer (MVP)

- New layer type: `Text`
- Default content: `RECONNECT:`
- Font: `var(--font-mekanikal), "Mekanikal Display", sans-serif`
- Text controls in Layer Editor:
  - `Text Content` (max 48 chars)
  - `Text Size` (`4..40`)
  - `Letter Spacing` (`-1..4`)
  - `Vertical Offset` (`-30..30`)

### Text Motion

- New motion mode: `Typewriter`
- Reveals text letter-by-letter over the layer motion cycle
- Works in both live preview and export (forced-time path)
- Uses existing `Motion Speed` + loop sync behavior

### Renderer Behavior

- WebGL preview path does **not** render text geometry yet.
- If any enabled layer is `Text`, preview automatically falls back to the SVG renderer.
- Exports already use SVG composition, so text/typewriter behavior matches export output.
- Remotion export entry must not import `app/fonts.css`; export-specific fonts should be loaded explicitly inside the composition to avoid webpack font-resolution failures during MP4 export.

### Randomizer Behavior

- `Text` is available in layer type dropdowns.
- Randomizer default shape pool excludes `Text` to avoid random text layers unless explicitly selected.

### Stroke Width Slider Precision

- `Master Stroke Width` now preserves fine steps (0.2 increments), including visible intermediate values below `1px`.

### Render Effects Coverage (SVG path)

- SVG render pipeline includes a transparent full-canvas coverage rect in the filtered chain to prevent small-geometry/text-only filter bbox collapse.
- This keeps grain/effects coverage consistent across the whole preview canvas.

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
