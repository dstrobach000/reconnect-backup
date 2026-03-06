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
7. Image layer contract (MVP):
   - layer type `image` is supported as a static canvas source for the render pipeline
   - accepted builder uploads are `png`, `jpg/jpeg`, and `webp`
   - image layers are fixed screen-space content and must not receive scene-fit scaling, master motion, or layer motion
   - image layers must still pass through prepass and render-effect stages exactly like other scene content
   - when any enabled image layer is present, preview must use SVG renderer fallback (WebGL image rendering is out of scope)
8. `Master Stroke Width` must keep fine precision near zero (0.2 step), including visible intermediate states between `0` and `1`.
9. Keep Remotion export font loading isolated:
   - load export-required fonts explicitly inside the composition/export code before rendering frames
   - if the font-loading strategy changes, update `README.md` and this file to match the real implementation
10. Export resolution contract:
   - standard square export presets are `512`, `720`, `1080`, and `1920`
   - `3508` is allowed for static `PNG` export only
   - if high-resolution export presets change, update the export UI, export-service validation, Remotion metadata clamps, and documentation together
11. Preview transport / still export contract:
   - builder preview supports play, pause, and reset controls
   - static `PNG` export must render from the current preview time, not a hardcoded midpoint frame
   - if preview clock behavior changes, update the export handoff so still exports stay frame-accurate

## Required Validation Before Finishing (Animation Changes)

Run this command after animation builder or renderer changes:

```bash
npm run build
```

If you changed video-related logic as well, also run the video validation commands listed above.
