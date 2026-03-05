# Agent Guardrails

This file defines non-optional implementation rules for autoplay video behavior and animation builder rendering behavior.

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

## Animation Builder Rendering Contract

1. Keep render pipeline semantics stable:
   - preprocess stage is `Particles` and `Grain`, with order controlled only by the prepass order control
   - render stage is `Render Effect 1`, then `Render Effect 2`
2. `Grain` is an independent screen-space layer and must not be transformed by master or layer motion.
3. Master motion transforms symbol geometry (layers), not the entire canvas/postprocess output.
4. Render effects must remain independent from grain toggle/order behavior:
   - threshold and other effects must still function when grain is disabled
   - no implicit coupling where enabling grain is required for effects to work
5. Keep full-canvas effect coverage:
   - grain/particles/effects must cover the entire preview/export canvas, including text-only or tiny-geometry scenes
   - keep the SVG filtered chain coverage rect pattern that prevents filter region collapse
6. Text layer contract (MVP):
   - layer type `text` is supported with editable content and existing layer/master motions
   - `typewriter` motion reveals text per character over the layer cycle
   - when any enabled text layer is present, preview must use SVG renderer fallback (WebGL text rendering is out of scope)
7. `Master Stroke Width` must keep fine precision near zero (0.2 step), including visible intermediate states between `0` and `1`.
8. Keep Remotion export font loading isolated:
   - do not import `app/fonts.css` in the Remotion entry path
   - load only the export-required fonts explicitly inside the composition/export code

## Required Validation Before Finishing (Animation Changes)

Run this command after animation builder or renderer changes:

```bash
npm run build
```

If you changed video-related logic as well, also run the video validation commands listed above.
