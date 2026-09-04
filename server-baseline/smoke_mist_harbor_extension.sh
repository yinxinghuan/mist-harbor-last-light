#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:8000}"
session_id="mist_harbor_extension_${$}"
actor_id='alteru_user_a'

post_action() {
  local action_id="$1"
  curl --fail-with-body --silent --show-error \
    -X POST -H 'Content-Type: application/json' \
    -d "{\"session_id\":\"$session_id\",\"actor_id\":\"$actor_id\",\"action_id\":\"$action_id\"}" \
    "$base_url/game/action"
}

expect() {
  local label="$1"
  local response="$2"
  local pattern="$3"
  printf '\n[%s]\n%s\n' "$label" "$response"
  rg -q "$pattern" <<<"$response"
}

curl --fail-with-body --silent --show-error -X POST \
  "$base_url/session/start?game_id=mist_harbor_last_light&session_id=$session_id&actor_id=$actor_id&location=signal_station" >/dev/null

response="$(post_action enter_relay_room)"
expect 'reject-missing-key-and-lantern' "$response" '"accepted"\s*:\s*false'

response="$(post_action take_storm_lantern)"
expect 'take-lantern' "$response" 'storm_lantern'

response="$(post_action inspect_main_relay)"
expect 'inspect-relay' "$response" 'relay_inspected'

response="$(post_action earn_lin_trust)"
expect 'earn-lin-trust' "$response" '"trust"\s*:\s*2'

response="$(post_action enter_relay_room)"
expect 'enter-relay-room' "$response" '"location"\s*:\s*"relay_room"'

response="$(post_action take_insulated_wire)"
expect 'take-wire' "$response" 'insulated_wire'

response="$(post_action return_signal_station)"
expect 'return-station' "$response" '"location"\s*:\s*"signal_station"'

response="$(post_action descend_lower_quay)"
expect 'introduce-anya' "$response" 'anya_introduced'

response="$(post_action recover_lens_fragment)"
expect 'recover-lens' "$response" 'fresnel_fragment'

response="$(post_action climb_lens_loft)"
expect 'climb-lens-loft' "$response" '"location"\s*:\s*"lens_loft"'

response="$(post_action repair_main_signal)"
expect 'repair-main-signal' "$response" '"completed"\s*:\s*true'
expect 'signal-reaches-six' "$response" '"signal"\s*:\s*6'

response="$(post_action repair_main_signal)"
expect 'reject-duplicate-repair' "$response" '"accepted"\s*:\s*false'

response="$(curl --fail-with-body --silent --show-error "$base_url/game/state?session_id=$session_id&actor_id=$actor_id")"
expect 'final-state' "$response" '"inventory"\s*:\s*\[\s*"relay_key"\s*,\s*"storm_lantern"'

printf '\nExtension smoke test passed for session %s.\n' "$session_id"
