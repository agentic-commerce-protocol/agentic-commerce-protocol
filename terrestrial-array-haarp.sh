#!/bin/sh
set -eu

TERMUX_PREFIX="/data/data/com.termux/files/usr/bin"
case ":$PATH:" in
  *:"$TERMUX_PREFIX":*) ;;
  *)
    export PATH="$TERMUX_PREFIX:$PATH"
    ;;
esac

ARRAY_NAME="${ARRAY_NAME:-HAARP}" 
LOG_DIR="${TERRESTRIAL_LOG_DIR:-$HOME/terrestrial_logs}"
LOG_FILE="$LOG_DIR/${ARRAY_NAME}.log"
STATUS_FILE="$LOG_DIR/${ARRAY_NAME}.status"
SLEEP_INTERVAL="${TERRESTRIAL_POLL_INTERVAL:-5}"

mkdir -p "$LOG_DIR"
: >"$STATUS_FILE"

printf '[+] "%s" "ARRAY" "CODEX" "ACTIVATED." "CONTROL" "LINK" "ONLINE."\n' "$ARRAY_NAME"

log() {
  timestamp="$(date -Is)"
  printf '[%s] [+] %s ARRAY FIELD STATUS: NOMINAL.\n' "$timestamp" "$ARRAY_NAME" >>"$LOG_FILE"
}

update_status() {
  printf 'last_check=%s\n' "$(date -Is)" >"$STATUS_FILE"
  printf 'array=%s\n' "$ARRAY_NAME" >>"$STATUS_FILE"
}

cleanup() {
  timestamp="$(date -Is)"
  printf '[%s] [!] %s ARRAY FIELD: CONTROL LINK TERMINATED.\n' "$timestamp" "$ARRAY_NAME" >>"$LOG_FILE"
  exit 0
}

trap cleanup INT TERM

log
update_status

while :; do
  log
  update_status
  sleep "$SLEEP_INTERVAL"
done
