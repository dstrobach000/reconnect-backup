#!/usr/bin/env bash

set -euo pipefail

DEV_BRANCH="codex/dev-local"
PRESENTATION_BRANCH="main"
PRESENTATION_REMOTE="origin"
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: npm run publish:presentation -- <commit-sha>"
  echo "Runs from codex/dev-local, validates commit paths, cherry-picks to main, pushes origin/main."
  exit 0
fi

COMMIT_SHA="${1:-HEAD}"

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

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "$DEV_BRANCH" ]]; then
  echo "Error: run this from '$DEV_BRANCH' (current: '$current_branch')."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash first."
  exit 1
fi

if ! git rev-parse --verify "$COMMIT_SHA^{commit}" >/dev/null 2>&1; then
  echo "Error: commit '$COMMIT_SHA' does not exist."
  exit 1
fi

changed_files_raw="$(git show --pretty=format: --name-only "$COMMIT_SHA" | sed '/^$/d')"
if [[ -z "$changed_files_raw" ]]; then
  echo "Error: commit '$COMMIT_SHA' has no file changes."
  exit 1
fi

blocked_hits=()
allowed_files=()
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  is_blocked=0
  for blocked in "${BLOCKED_PATHS[@]}"; do
    if [[ "$blocked" == */ ]]; then
      if [[ "$file" == "$blocked"* ]]; then
        blocked_hits+=("$file")
        is_blocked=1
      fi
    else
      if [[ "$file" == "$blocked" ]]; then
        blocked_hits+=("$file")
        is_blocked=1
      fi
    fi
  done
  if [[ "$is_blocked" -eq 0 ]]; then
    allowed_files+=("$file")
  fi
done <<< "$changed_files_raw"

if [[ "${#blocked_hits[@]}" -gt 0 ]]; then
  echo "Notice: commit '$COMMIT_SHA' contains dev-only paths. They will be excluded from publish:"
  printf '  - %s\n' "${blocked_hits[@]}" | sort -u
fi

if [[ "${#allowed_files[@]}" -eq 0 ]]; then
  echo "No presentation-safe files found in commit '$COMMIT_SHA'."
  exit 0
fi

tmp_patch="$(mktemp)"
cleanup() {
  rm -f "$tmp_patch"
}
trap cleanup EXIT

git show --pretty=format: --binary "$COMMIT_SHA" -- "${allowed_files[@]}" >"$tmp_patch"
if [[ ! -s "$tmp_patch" ]]; then
  echo "No presentation patch generated from commit '$COMMIT_SHA'."
  exit 0
fi

echo "Publishing presentation-safe changes from '$COMMIT_SHA' to '$PRESENTATION_BRANCH'..."
git switch "$PRESENTATION_BRANCH"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: '$PRESENTATION_BRANCH' has local changes. Clean it and rerun."
  git switch "$DEV_BRANCH"
  exit 1
fi

if ! git apply -3 --index "$tmp_patch"; then
  echo "Error: could not apply presentation patch on '$PRESENTATION_BRANCH'. Resolve manually, then switch back to '$DEV_BRANCH'."
  exit 1
fi

if git diff --cached --quiet; then
  echo "No staged presentation changes to commit."
  git switch "$DEV_BRANCH"
  exit 0
fi

git commit -m "chore: publish presentation from ${COMMIT_SHA:0:7}"
git push "$PRESENTATION_REMOTE" "$PRESENTATION_BRANCH"
git switch "$DEV_BRANCH"

echo "Publish complete: ${COMMIT_SHA:0:7} -> $PRESENTATION_REMOTE/$PRESENTATION_BRANCH"
