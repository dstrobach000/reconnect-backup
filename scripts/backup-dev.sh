#!/usr/bin/env bash

set -euo pipefail

DEV_BRANCH="codex/dev-local"
BACKUP_REMOTE="backup"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: npm run backup:dev -- \"commit message\""
  echo "Runs on codex/dev-local, commits all changes, pushes to backup remote."
  exit 0
fi

MESSAGE="${1:-chore(dev): backup snapshot ${TIMESTAMP}}"

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "$DEV_BRANCH" ]]; then
  echo "Error: run this from '$DEV_BRANCH' (current: '$current_branch')."
  exit 1
fi

if ! git remote get-url "$BACKUP_REMOTE" >/dev/null 2>&1; then
  echo "Error: remote '$BACKUP_REMOTE' is not configured."
  exit 1
fi

git add -A

if git diff --cached --quiet; then
  echo "No local changes to commit."
else
  git commit -m "$MESSAGE"
fi

git push "$BACKUP_REMOTE" "$DEV_BRANCH"
echo "Backup complete: $DEV_BRANCH -> $BACKUP_REMOTE"
