# Workflow Agent (Backup + Publish)

This project has a local workflow agent via scripts so you can run daily operations with simple commands.

## Commands

From `/Users/null/Documents/Web/reconnect`:

```bash
npm run backup:dev -- "your commit message"
npm run publish:presentation -- <commit-sha>
```

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
3. Validates the commit does **not** include dev-only paths
4. Switches to `main`
5. Cherry-picks the commit
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

## Typical daily flow

```bash
git switch codex/dev-local

# work + commit
git add -A
git commit -m "feat: ..."

# backup dev branch
npm run backup:dev -- "chore(dev): backup"

# publish a presentation commit
git log --oneline -n 10
npm run publish:presentation -- <sha>
```
