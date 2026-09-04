#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:8000}"
session_id='mist_harbor_baseline_20260904'
actor_id='alteru_user_a'

run() {
  local label="$1"
  shift
  printf '\n[%s]\n' "$label"
  curl --fail-with-body --silent --show-error "$@"
  printf '\n'
}

run 'start-mist-harbor' -X POST "$base_url/session/start?game_id=mist_harbor_last_light&session_id=$session_id&actor_id=$actor_id&location=signal_station"
run 'signal-station' "$base_url/exits?session_id=$session_id&actor_id=$actor_id"
run 'visible-lin-rui' "$base_url/actor/others?session_id=$session_id&actor_id=$actor_id"
run 'read-control-console' "$base_url/read?session_id=$session_id&actor_id=$actor_id&item_id=control_console"
run 'open-relay-box' -X POST "$base_url/open?session_id=$session_id&actor_id=$actor_id&item_id=relay_box"
run 'take-relay-key' -X POST "$base_url/take?session_id=$session_id&actor_id=$actor_id&item_id=relay_key"
run 'take-storm-lantern' -X POST "$base_url/take?session_id=$session_id&actor_id=$actor_id&item_id=storm_lantern"
run 'enter-relay-room' -X POST "$base_url/move?session_id=$session_id&actor_id=$actor_id&direction=down"
run 'take-insulated-wire' -X POST "$base_url/take?session_id=$session_id&actor_id=$actor_id&item_id=insulated_wire"
run 'return-signal-station' -X POST "$base_url/move?session_id=$session_id&actor_id=$actor_id&direction=up"
run 'descend-lower-quay' -X POST "$base_url/move?session_id=$session_id&actor_id=$actor_id&direction=east"
run 'visible-anya' "$base_url/actor/others?session_id=$session_id&actor_id=$actor_id"
run 'speak-to-anya' -X POST -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"$session_id\",\"from\":\"$actor_id\",\"to\":\"anya\",\"message\":\"请带我确认镜片的位置。\"}" \
  "$base_url/speak"
run 'take-fresnel-fragment' -X POST "$base_url/take?session_id=$session_id&actor_id=$actor_id&item_id=fresnel_fragment"
run 'climb-lens-loft' -X POST "$base_url/move?session_id=$session_id&actor_id=$actor_id&direction=up"
run 'read-repair-guide' "$base_url/read?session_id=$session_id&actor_id=$actor_id&item_id=repair_guide"
run 'final-inventory' "$base_url/room?session_id=$session_id&room_id=$actor_id"
