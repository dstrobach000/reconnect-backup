#!/usr/bin/env bash

set -euo pipefail

DEV_BRANCH="codex/dev-local"
MAIN_BRANCH="main"
BACKUP_REMOTE="backup"
PRESENTATION_REMOTE="origin"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M')"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: npm run agent:sync -- \"optional dev backup commit message\""
  echo "From codex/dev-local: commits local changes, pushes backup branch, then publishes presentation-safe diff to main."
  exit 0
fi

COMMIT_MESSAGE="${1:-chore(dev): automated backup ${TIMESTAMP}}"
current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "$DEV_BRANCH" ]]; then
  echo "Error: run this from '$DEV_BRANCH' (current: '$current_branch')."
  exit 1
fi

if ! git remote get-url "$BACKUP_REMOTE" >/dev/null 2>&1; then
  echo "Error: remote '$BACKUP_REMOTE' is not configured."
  exit 1
fi

if ! git remote get-url "$PRESENTATION_REMOTE" >/dev/null 2>&1; then
  echo "Error: remote '$PRESENTATION_REMOTE' is not configured."
  exit 1
fi

source_commit=""
if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "$COMMIT_MESSAGE"
  source_commit="$(git rev-parse HEAD)"
  echo "Created dev backup commit: ${source_commit:0:7}"
else
  source_commit="$(git rev-parse HEAD)"
  echo "No local changes to commit. Using latest commit: ${source_commit:0:7}"
fi

git push "$BACKUP_REMOTE" "$DEV_BRANCH"
echo "Backup pushed: $DEV_BRANCH -> $BACKUP_REMOTE"

if ! git rev-parse --verify "${source_commit}^" >/dev/null 2>&1; then
  echo "No parent commit found for source commit. Skipping presentation publish."
  exit 0
fi

changed_files_raw="$(git diff --name-only "${source_commit}^" "$source_commit" | sed '/^$/d')"
if [[ -z "$changed_files_raw" ]]; then
  echo "No file changes in source commit. Skipping presentation publish."
  exit 0
fi

BLOCKED_PATHS=(
  "app/dev/"
  "app/api/composer-export/"
  "app/api/composer-library/"
  "components/animation/"
  "components/sections/AnimationBuilderSection.tsx"
  "components/sections/ExportPanel.tsx"
  "components/sections/SectionStack.tsx"
  "components/sections/SiteMenu.tsx"
  "lib/exportService.ts"
  "lib/animationBuilder.ts"
  "lib/symbolComposer.ts"
  "lib/webgl/"
  "remotion/"
  "data/composer-library.json"
  "public/exports/"
  "next-env.d.ts"
  "tsconfig.tsbuildinfo"
)

allowed_files=()
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  blocked=0
  for blocked_path in "${BLOCKED_PATHS[@]}"; do
    if [[ "$blocked_path" == */ ]]; then
      if [[ "$file" == "$blocked_path"* ]]; then
        blocked=1
        break
      fi
    else
      if [[ "$file" == "$blocked_path" ]]; then
        blocked=1
        break
      fi
    fi
  done
  if [[ "$blocked" -eq 0 ]]; then
    allowed_files+=("$file")
  fi
done <<< "$changed_files_raw"

if [[ "${#allowed_files[@]}" -eq 0 ]]; then
  echo "No presentation-safe files in source commit. Skipping publish."
  exit 0
fi

temp_patch="$(mktemp)"
cleanup() {
  rm -f "$temp_patch"
}
trap cleanup EXIT

git diff "${source_commit}^" "$source_commit" -- "${allowed_files[@]}" >"$temp_patch"
if [[ ! -s "$temp_patch" ]]; then
  echo "No presentation patch generated. Skipping publish."
  exit 0
fi

git switch "$MAIN_BRANCH" >/dev/null

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: '$MAIN_BRANCH' is not clean. Resolve local changes and rerun."
  git switch "$DEV_BRANCH" >/dev/null
  exit 1
fi

if ! git apply -3 --index "$temp_patch"; then
  echo "Error: failed to apply presentation patch onto '$MAIN_BRANCH'."
  echo "Resolve on '$MAIN_BRANCH' or run 'git cherry-pick --abort' equivalent cleanup, then switch back to '$DEV_BRANCH'."
  exit 1
fi

if git diff --cached --quiet; then
  echo "No staged presentation changes to publish."
  git switch "$DEV_BRANCH" >/dev/null
  exit 0
fi

git commit -m "chore: publish presentation from ${source_commit:0:7}"
git push "$PRESENTATION_REMOTE" "$MAIN_BRANCH"
git switch "$DEV_BRANCH" >/dev/null

echo "Presentation published: ${source_commit:0:7} -> $PRESENTATION_REMOTE/$MAIN_BRANCH"
