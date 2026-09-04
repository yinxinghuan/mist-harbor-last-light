#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:8000}"
runs="${RUNS:-20}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

request() {
  curl --fail-with-body --silent --show-error "$@"
}

double_success=0
single_success=0
unexpected=0

for ((i = 0; i < runs; i += 1)); do
  session_id="mist_harbor_race_${$}_${i}"

  request -X POST "$base_url/session/start?game_id=mist_harbor_last_light&session_id=$session_id&actor_id=actor_a&location=signal_station" >/dev/null
  request -X POST "$base_url/join?session_id=$session_id&actor_id=actor_b&location=signal_station" >/dev/null
  request -X POST "$base_url/open?session_id=$session_id&actor_id=actor_a&item_id=relay_box" >/dev/null

  request -X POST "$base_url/take?session_id=$session_id&actor_id=actor_a&item_id=relay_key" >"$tmp_dir/a.json" &
  pid_a=$!
  request -X POST "$base_url/take?session_id=$session_id&actor_id=actor_b&item_id=relay_key" >"$tmp_dir/b.json" &
  pid_b=$!
  wait "$pid_a"
  wait "$pid_b"

  successes="$(rg -o '"status"\s*:\s*"success"' "$tmp_dir/a.json" "$tmp_dir/b.json" | wc -l | tr -d ' ')"
  case "$successes" in
    2) double_success=$((double_success + 1)) ;;
    1) single_success=$((single_success + 1)) ;;
    *) unexpected=$((unexpected + 1)) ;;
  esac
done

printf '{"runs":%s,"double_success":%s,"single_success":%s,"unexpected":%s}\n' \
  "$runs" "$double_success" "$single_success" "$unexpected"
