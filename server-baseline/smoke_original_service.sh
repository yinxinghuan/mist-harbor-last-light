#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:8000}"
session_id='alteru_baseline_20260904'
actor_id='alteru_user_a'

run() {
  local label="$1"
  shift
  printf '\n[%s]\n' "$label"
  curl --fail-with-body --silent --show-error "$@"
  printf '\n'
}

run 'sessions-before' "$base_url/sessions"
run 'start-session' -X POST "$base_url/session/start?game_id=zork1&session_id=$session_id&actor_id=$actor_id&location=west_of_house"
run 'exits-west-of-house' "$base_url/exits?session_id=$session_id&actor_id=$actor_id"
run 'actor-room-before' "$base_url/actor/room?session_id=$session_id&actor_id=$actor_id"
run 'open-mailbox' -X POST "$base_url/open?session_id=$session_id&actor_id=$actor_id&item_id=mailbox"
run 'take-advertisement' -X POST "$base_url/take?session_id=$session_id&actor_id=$actor_id&item_id=advertisement"
run 'read-advertisement' "$base_url/read?session_id=$session_id&actor_id=$actor_id&item_id=advertisement"
run 'inventory-after-take' "$base_url/room?session_id=$session_id&room_id=$actor_id"
run 'move-north' -X POST "$base_url/move?session_id=$session_id&actor_id=$actor_id&direction=north"
run 'actor-room-after-move' "$base_url/actor/room?session_id=$session_id&actor_id=$actor_id"
run 'sessions-after' "$base_url/sessions"
