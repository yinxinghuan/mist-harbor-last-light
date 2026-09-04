#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:8000}"
runs="${RUNS:-30}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

request() {
  curl --fail-with-body --silent --show-error "$@"
}

double_success=0
single_success=0
unexpected=0

for ((i = 0; i < runs; i += 1)); do
  session_id="mist_harbor_extension_race_${$}_${i}"

  request -X POST "$base_url/session/start?game_id=mist_harbor_last_light&session_id=$session_id&actor_id=actor_a&location=signal_station" >/dev/null
  request -X POST "$base_url/join?session_id=$session_id&actor_id=actor_b&location=signal_station" >/dev/null

  request -X POST -H 'Content-Type: application/json' \
    -d "{\"session_id\":\"$session_id\",\"actor_id\":\"actor_a\",\"action_id\":\"take_storm_lantern\"}" \
    "$base_url/game/action" >"$tmp_dir/a.json" &
  pid_a=$!
  request -X POST -H 'Content-Type: application/json' \
    -d "{\"session_id\":\"$session_id\",\"actor_id\":\"actor_b\",\"action_id\":\"take_storm_lantern\"}" \
    "$base_url/game/action" >"$tmp_dir/b.json" &
  pid_b=$!
  wait "$pid_a"
  wait "$pid_b"

  successes="$(rg -o '"accepted"\s*:\s*true' "$tmp_dir/a.json" "$tmp_dir/b.json" | wc -l | tr -d ' ')"
  case "$successes" in
    2) double_success=$((double_success + 1)) ;;
    1) single_success=$((single_success + 1)) ;;
    *) unexpected=$((unexpected + 1)) ;;
  esac
done

printf '{"runs":%s,"double_success":%s,"single_success":%s,"unexpected":%s}\n' \
  "$runs" "$double_success" "$single_success" "$unexpected"

test "$double_success" -eq 0
test "$single_success" -eq "$runs"
test "$unexpected" -eq 0
