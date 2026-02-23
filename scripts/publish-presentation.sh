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

mapfile -t changed_files < <(git show --pretty=format: --name-only "$COMMIT_SHA" | sed '/^$/d')
if [[ "${#changed_files[@]}" -eq 0 ]]; then
  echo "Error: commit '$COMMIT_SHA' has no file changes."
  exit 1
fi

blocked_hits=()
for file in "${changed_files[@]}"; do
  for blocked in "${BLOCKED_PATHS[@]}"; do
    if [[ "$blocked" == */ ]]; then
      if [[ "$file" == "$blocked"* ]]; then
        blocked_hits+=("$file")
      fi
    else
      if [[ "$file" == "$blocked" ]]; then
        blocked_hits+=("$file")
      fi
    fi
  done
done

if [[ "${#blocked_hits[@]}" -gt 0 ]]; then
  echo "Error: commit '$COMMIT_SHA' contains dev-only paths and will not be published:"
  printf '  - %s\n' "${blocked_hits[@]}" | sort -u
  exit 1
fi

echo "Publishing commit '$COMMIT_SHA' to '$PRESENTATION_BRANCH'..."
git switch "$PRESENTATION_BRANCH"
git cherry-pick "$COMMIT_SHA"
git push "$PRESENTATION_REMOTE" "$PRESENTATION_BRANCH"
git switch "$DEV_BRANCH"

echo "Publish complete: $COMMIT_SHA -> $PRESENTATION_REMOTE/$PRESENTATION_BRANCH"
