#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_DISPATCH_TOKEN:?Set GITHUB_DISPATCH_TOKEN in the systemd EnvironmentFile. Do not store in Git.}"
# Experiment ends Nov 1 2026 at 23:59 Samara (19:59 UTC)
now=$(date -u +%s)
stop=$(date -u -d '2026-11-01 19:59:59 UTC' +%s)
if (( now > stop )); then
  echo "MacBook price monitoring period has ended; no dispatch."
  exit 0
fi
url="https://api.github.com/repos/Web-Usov/dashboard/actions/workflows/avito-monitor.yml/dispatches"
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
http=$(curl -sS --max-time 30 --retry 2 --retry-delay 2 --output "$tmp" --write-out '%{http_code}' \
  -X POST "$url" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Authorization: Bearer ${GITHUB_DISPATCH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"ref":"main"}')
if [[ "$http" == "204" ]]; then
  echo "$(date -u +'%FT%TZ') workflow_dispatch accepted (HTTP 204)"
else
  echo "workflow_dispatch failed: HTTP $http" >&2
  # Do not log request headers or the token.
  exit 1
fi
