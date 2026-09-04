#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:8000}"
shared_session='alteru_baseline_20260904'
second_session='alteru_baseline_second_20260904'

run() {
  local label="$1"
  shift
  printf '\n[%s]\n' "$label"
  curl --fail-with-body --silent --show-error "$@"
  printf '\n'
}

run 'join-second-actor' -X POST "$base_url/join?session_id=$shared_session&actor_id=alteru_user_b&location=west_of_house"
run 'second-actor-room-shared-state' "$base_url/actor/room?session_id=$shared_session&actor_id=alteru_user_b"
run 'move-second-actor-south' -X POST "$base_url/move?session_id=$shared_session&actor_id=alteru_user_b&direction=south"
run 'first-actor-remains-north' "$base_url/exits?session_id=$shared_session&actor_id=alteru_user_a"
run 'second-actor-is-south' "$base_url/exits?session_id=$shared_session&actor_id=alteru_user_b"

run 'start-independent-session' -X POST "$base_url/session/start?game_id=zork1&session_id=$second_session&actor_id=alteru_user_c&location=west_of_house"
run 'independent-session-room' "$base_url/actor/room?session_id=$second_session&actor_id=alteru_user_c"
run 'all-sessions' "$base_url/sessions"
