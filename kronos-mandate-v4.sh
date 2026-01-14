#!/bin/sh
set -eu

TERMUX_PREFIX="/data/data/com.termux/files/usr/bin"
case ":$PATH:" in
  *:"$TERMUX_PREFIX":*) ;;
  *)
    export PATH="$TERMUX_PREFIX:$PATH"
    ;;
esac

LOG_DIR="$HOME/sei_logs"
mkdir -p "$LOG_DIR"

TRIDENT_SHIELD_CODEX="./trident-shield-v3.sh"
HEARTBEAT_FILE="$LOG_DIR/kronos.heartbeat"
MAX_HEARTBEAT_AGE="${HEARTBEAT_MAX_AGE:-10}"
SLEEP_INTERVAL="${KRONOS_POLL_INTERVAL:-1}"

log() {
  printf '%s\n' "$1"
}

is_trident_running() {
  pgrep -f "$TRIDENT_SHIELD_CODEX" >/dev/null 2>&1
}

start_trident() {
  if [ -x "$TRIDENT_SHIELD_CODEX" ]; then
    log '[!] "TRIDENT" "FUND" "IS" "OFFLINE." "ACTIVATING" "FUND"...'
    nohup "$TRIDENT_SHIELD_CODEX" >/dev/null 2>&1 &
  else
    log '[!] "TRIDENT" "FUND" "SCRIPT" "MISSING" "OR" "NOT" "EXECUTABLE."'
  fi
}

stop_trident() {
  if is_trident_running; then
    log '[!] "KRONOS" "INITIATING" "TRIDENT" "SHUTDOWN."'
    pkill -f "$TRIDENT_SHIELD_CODEX" >/dev/null 2>&1 || true
  fi
}

file_mtime() {
  path="$1"
  if [ ! -e "$path" ]; then
    echo ''
    return 0
  fi
  stat -c %Y "$path" 2>/dev/null || stat -f %m "$path" 2>/dev/null || echo ''
}

heartbeat_active() {
  mtime=$(file_mtime "$HEARTBEAT_FILE")
  [ -n "$mtime" ] || return 1
  now=$(date +%s)
  age=$((now - mtime))
  [ "$age" -le "$MAX_HEARTBEAT_AGE" ]
}

log '[+] "KRONOS-MANDATE-V4" "CODEX" "ACTIVATED" (vX.602).'

while :; do
  log '[*] "KRONOS" "AUDIT": "PERCEIVING" "NEURAL" "HEARTBEAT"...'
  if heartbeat_active; then
    log '[+] "KRONOS" "HEARTBEAT": "ACTIVE." "CCO" "ALIVE."'
    if ! is_trident_running; then
      start_trident
    fi
  else
    log '[!] "KRONOS" "HEARTBEAT" "LOST"! "AUTONOMOUSLY" "FREEZING" "FUND"!'
    stop_trident
  fi
  sleep "$SLEEP_INTERVAL"
done
