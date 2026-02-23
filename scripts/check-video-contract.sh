#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ALLOWED_RAW_VIDEO_FILES=(
  "components/media/InlineAutoplayVideo.tsx"
  "components/sections/HeroRadar.tsx"
)

is_allowed_raw_video_file() {
  local file="$1"
  for allowed_file in "${ALLOWED_RAW_VIDEO_FILES[@]}"; do
    if [[ "$file" == "$allowed_file" ]]; then
      return 0
    fi
  done
  return 1
}

raw_video_hits="$(rg -n --glob '**/*.tsx' --glob '**/*.jsx' '<video\b' components app 2>/dev/null || true)"

if [[ -z "$raw_video_hits" ]]; then
  echo "No raw <video> tags found in components/ or app/."
  exit 0
fi

disallowed_hits=()

while IFS= read -r hit; do
  [[ -z "$hit" ]] && continue
  file_path="${hit%%:*}"
  if ! is_allowed_raw_video_file "$file_path"; then
    disallowed_hits+=("$hit")
  fi
done <<< "$raw_video_hits"

if (( ${#disallowed_hits[@]} > 0 )); then
  echo "Video autoplay contract violation."
  echo "Raw <video> is only allowed in:"
  for allowed_file in "${ALLOWED_RAW_VIDEO_FILES[@]}"; do
    echo "  - $allowed_file"
  done
  echo
  echo "Disallowed raw <video> usage:"
  for hit in "${disallowed_hits[@]}"; do
    echo "  - $hit"
  done
  echo
  echo "Use <InlineAutoplayVideo /> for content videos."
  exit 1
fi

echo "Video autoplay contract check passed."
