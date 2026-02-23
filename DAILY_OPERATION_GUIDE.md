# Daily Operation Guide (Dev vs Presentation)

This guide keeps your project split into:
- `main` = presentation branch (what goes live on Vercel)
- `codex/dev-local` = local dev/editor branch (`/dev`, complex tooling)

For one-command automation, see `WORKFLOW_AGENT.md`.

## 1) One-time setup

Create and switch to your dev branch (if not already created):

```bash
git switch -c codex/dev-local
```

Confirm branch:

```bash
git branch --show-current
```

Expected:
- `main` exists
- `codex/dev-local` exists

## 2) Core rule set

1. Work primarily on `codex/dev-local`.
2. Commit often on `codex/dev-local`.
3. Never merge `codex/dev-local` into `main`.
4. Move only presentation-safe commits to `main` using `cherry-pick`.
5. Push only `main` to deploy.

## 3) Daily workflow

Start work:

```bash
git switch codex/dev-local
```

Develop and commit local changes:

```bash
git add -A
git commit -m "feat: local dev progress"
```

Repeat throughout the day.

## 4) Publish presentation updates to production

When you want something live:

1. On `codex/dev-local`, ensure the live-ready change is committed.
2. Find commit SHA:

```bash
git log --oneline -n 10
```

3. Move only that commit to `main`:

```bash
git switch main
git cherry-pick <commit-sha>
```

4. Push live:

```bash
git push origin main
```

5. Return to dev:

```bash
git switch codex/dev-local
```

## 5) Hero (and future section settings) flow

- Use `/dev` to edit settings.
- Click Save to publish settings to tracked data files.
- Commit that data file commit on `codex/dev-local`.
- Cherry-pick that commit to `main`.
- Push `main`.

Current tracked settings handoff file:
- `data/hero-text-style.json`

## 6) Restore older version (local)

See history:

```bash
git log --oneline
```

Open a past snapshot safely in a new branch:

```bash
git switch -c restore-test <commit-sha>
```

Restore one file from old commit:

```bash
git restore --source <commit-sha> path/to/file
```

## 7) Remote backup options (important)

Commits on `codex/dev-local` are local until pushed.

If you want backup without deploying dev:

Option A (recommended): push `codex/dev-local` to a separate backup repo not connected to Vercel.

```bash
git remote add backup <backup-repo-url>
git push -u backup codex/dev-local
```

Then backup routinely:

```bash
git switch codex/dev-local
git push backup codex/dev-local
```

Option B: push `codex/dev-local` to origin only if your Vercel project is configured to deploy only `main`.

## 8) Pre-push safety

This repo has a pre-push guard that blocks pushes from `codex/dev-local`.

Emergency override:

```bash
ALLOW_DEV_PUSH=1 git push ...
```

Use override only when intentionally backing up dev branch.

## 9) Quick command cheat sheet

```bash
# Start day
git switch codex/dev-local

# Commit progress
git add -A
git commit -m "feat: progress"

# Publish a selected commit
git log --oneline -n 10
git switch main
git cherry-pick <sha>
git push origin main
git switch codex/dev-local
```
