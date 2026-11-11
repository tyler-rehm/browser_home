#!/bin/sh
# Login launcher. Homebrew Cellar paths and nvm version directories move.
# Use the Node recorded at install while it still exists, then the stable
# Homebrew symlinks, then the newest nvm or Cellar install.
set -eu

base=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
lib=${BROWSER_HOME_LIB_ROOT:-}

try() {
  bin=$1
  shift
  if [ -n "$bin" ] && [ -x "$bin" ]; then
    exec "$bin" "$@"
  fi
}

version_gt() {
  a=$1
  b=$2
  while [ -n "$a" ] || [ -n "$b" ]; do
    aa=${a%%.*}
    bb=${b%%.*}
    case $a in
      *.*) a=${a#*.} ;;
      *) a= ;;
    esac
    case $b in
      *.*) b=${b#*.} ;;
      *) b= ;;
    esac
    aa=$(printf '%s' "$aa" | sed 's/[^0-9].*//')
    bb=$(printf '%s' "$bb" | sed 's/[^0-9].*//')
    aa=${aa:-0}
    bb=${bb:-0}
    if [ "$aa" -gt "$bb" ]; then
      return 0
    fi
    if [ "$aa" -lt "$bb" ]; then
      return 1
    fi
  done
  return 1
}

newest_in() {
  root=$1
  shift
  if [ ! -d "$root" ]; then
    return 0
  fi
  best=
  best_ver=
  for candidate in "$root"/*/bin/node "$root"/v*/bin/node; do
    if [ ! -x "$candidate" ]; then
      continue
    fi
    ver=$(basename "$(dirname "$(dirname "$candidate")")")
    ver=${ver#v}
    if [ -z "$best" ] || version_gt "$ver" "$best_ver"; then
      best=$candidate
      best_ver=$ver
    fi
  done
  try "$best" "$@"
}

if [ -f "$base/node-path" ]; then
  IFS= read -r hint < "$base/node-path" || hint=
  hint=${hint#"${hint%%[![:space:]]*}"}
  hint=${hint%"${hint##*[![:space:]]}"}
  try "$hint" "$@"
fi

if [ -n "${BROWSER_HOME_NODE:-}" ]; then
  try "$BROWSER_HOME_NODE" "$@"
fi

if [ -n "$lib" ]; then
  try "$lib/opt/homebrew/bin/node" "$@"
  try "$lib/usr/local/bin/node" "$@"
  newest_in "$lib/nvm/versions/node" "$@"
  newest_in "$lib/cellar-opt/node" "$@"
  newest_in "$lib/cellar-local/node" "$@"
else
  try /opt/homebrew/bin/node "$@"
  try /usr/local/bin/node "$@"
  if [ -n "${HOME:-}" ]; then
    newest_in "$HOME/.nvm/versions/node" "$@"
  fi
  newest_in /opt/homebrew/Cellar/node "$@"
  newest_in /usr/local/Cellar/node "$@"
fi

echo "browser-home: no Node executable found. Install Node 22.13 or newer, then run node scripts/home-service.js update." >&2
exit 78
