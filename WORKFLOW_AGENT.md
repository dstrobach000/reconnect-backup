# Workflow Agent (Backup + Publish)

This project has a local workflow agent via scripts so you can run daily operations with simple commands.

## Commands

From `/Users/null/Documents/Web/reconnect`:

```bash
npm run agent:sync -- "optional dev backup message"
npm run backup:dev -- "your commit message"
npm run publish:presentation -- <commit-sha>
```

## One-command mode (recommended)

### `agent:sync`

Script: `scripts/agent-sync.sh`

Run this from `codex/dev-local` to do both steps automatically:

1. Commit current changes on dev branch (if any)
2. Push dev branch backup to `backup`
3. Build a presentation-safe patch from the latest dev commit
4. Apply patch to `main`
5. Commit + push `origin/main` (deploy)
6. Switch back to `codex/dev-local`

If the latest dev commit only changes dev-only paths, it backs up but skips publish.

## What each command does

### `backup:dev`

Script: `scripts/backup-dev.sh`

1. Requires branch `codex/dev-local`
2. Stages all changes
3. Creates a commit (if there are changes)
4. Pushes `codex/dev-local` to `backup`

Use this for remote backup of local dev/editor work.

### `publish:presentation`

Script: `scripts/publish-presentation.sh`

1. Requires branch `codex/dev-local`
2. Requires clean working tree
3. Reads the specified commit and excludes dev-only paths automatically
4. Applies only presentation-safe changes to `main`
5. Creates a publish commit on `main`
6. Pushes `origin/main` (triggers Vercel production deploy)
7. Switches back to `codex/dev-local`

Use this to safely publish only presentation changes.

## Dev-only paths blocked from publish

- `app/dev/`
- `app/api/composer-export/`
- `app/api/composer-library/`
- `components/animation/`
- `components/sections/AnimationBuilderSection.tsx`
- `components/sections/ExportPanel.tsx`
- `components/sections/SectionStack.tsx`
- `components/sections/SiteMenu.tsx`
- `lib/exportService.ts`
- `lib/animationBuilder.ts`
- `lib/symbolComposer.ts`
- `lib/webgl/`
- `remotion/`
- `data/composer-library.json`
- `public/exports/`
- `next-env.d.ts`
- `tsconfig.tsbuildinfo`

## Typical daily flow

```bash
git switch codex/dev-local

# one command: backup + safe publish
npm run agent:sync -- "chore(dev): daily sync"
```
