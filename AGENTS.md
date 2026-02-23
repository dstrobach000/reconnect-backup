# Agent Guardrails

This file defines non-optional implementation rules for autoplay video behavior.

## Scope

Applies to all agent edits in this repository.

## Autoplay Video Contract

1. Use `components/media/InlineAutoplayVideo.tsx` for all content videos.
2. Raw `<video>` tags are allowed only in:
   - `components/media/InlineAutoplayVideo.tsx`
   - `components/sections/HeroRadar.tsx`
3. Keep iOS/Safari autoplay-critical behavior intact:
   - muted inline autoplay (`autoplay`, `muted`, `playsInline`, `loop`)
   - no native controls (`controls={false}`, no `controls` attribute)
   - `disableRemotePlayback` and `disablePictureInPicture`
   - iOS hints: `webkit-playsinline`, `x-webkit-airplay="deny"`
   - first-gesture playback unlock fallback

## Required Validation Before Finishing

Run these commands after video-related changes:

```bash
npm run check:video-contract
npm run test:e2e:webkit
```

If `test:e2e:webkit` cannot run locally (missing WebKit runtime), state that explicitly in the handoff and do not claim success.

## Regression Prevention

- If you need a new raw `<video>` location, update:
  - `scripts/check-video-contract.sh` allowlist
  - `tests/e2e/video-autoplay.webkit.spec.ts`
  - `README.md` contract section
  - this file
- Do not bypass the guard script to merge a change.
