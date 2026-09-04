#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:8000}"
token="${RULE_SERVICE_TOKEN:-loopback-qa-token-not-for-production-0000000000}"

status="$(curl --silent --output /dev/null --write-out '%{http_code}' "$base_url/health")"
test "$status" = '200'

for path in consult game/action session/start sessions; do
  status="$(curl --silent --output /dev/null --write-out '%{http_code}' "$base_url/$path")"
  test "$status" = '404'
done

request='{"request_id":"production-surface-check","game_id":"mist-harbor-last-light","session_id":"production-surface-session","actor_id":"production-surface-actor","ruleset_version":1,"action_id":"take-storm-lantern","state":{"location":"signal-station","stats":{"signal":1,"trust":1,"stamina":3},"facts":{},"inventory":[],"characters":[]}}'

status="$(curl --silent --output /dev/null --write-out '%{http_code}' \
  -X POST -H 'Content-Type: application/json' -d "$request" "$base_url/v1/resolve")"
test "$status" = '403'

response="$(curl --fail-with-body --silent --show-error \
  -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $token" \
  -d "$request" "$base_url/v1/resolve")"
rg -q '"status"\s*:\s*"accepted"' <<<"$response"

printf '%s\n' 'Production surface smoke test passed.'
