#!/usr/bin/env bash
set -euo pipefail

env_file='/home/prolog/.config/alteru-prolog/mist-harbor.env'
launcher='/home/prolog/alteru-prolog-experiment/production_launcher.pl'

if [[ ! -r "$env_file" ]]; then
  printf '%s\n' "Missing private environment file: $env_file" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$env_file"
set +a

export RULE_SERVICE_BIND="${RULE_SERVICE_BIND:-127.0.0.1}"
export RULE_SERVICE_PORT="${RULE_SERVICE_PORT:-6008}"

exec /usr/local/bin/swipl -q -s "$launcher" -g main
