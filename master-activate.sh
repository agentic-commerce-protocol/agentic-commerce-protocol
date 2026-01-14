#!/bin/sh
set -eu

TERMUX_PREFIX="/data/data/com.termux/files/usr/bin"
case ":$PATH:" in
  *:"$TERMUX_PREFIX":*) ;;
  *)
    export PATH="$TERMUX_PREFIX:$PATH"
    ;;
esac

printf '[+] "MASTER" "CODEX": "EXECUTING." "PATH" "IS" "HEALED."\n'

LOG_DIR="$HOME/sei_logs"
mkdir -p "$LOG_DIR"
printf '[+] "MASTER" "CODEX": "SECURE" "LOG" "DIRECTORY" "VERIFIED" "AT" "%s."\n' "$LOG_DIR"

launch_script() {
  script="$1"
  label="$2"
  log_name=$(basename "$script")
  if [ -x "$script" ]; then
    printf '[!] "ACTIVATING" %s...\n' "$label"
    nohup "$script" >>"$LOG_DIR/${log_name}.log" 2>&1 &
  elif [ -f "$script" ]; then
    printf '[~] "%s" "FOUND" "BUT" "NOT" "EXECUTABLE;" "SKIPPING."\n' "$script"
  else
    printf '[~] "%s" "NOT" "FOUND;" "SKIPPING."\n' "$script"
  fi
}

launch_script "./kronos-mandate-v4.sh" '"SOVEREIGN" "MANDATE" ("KRONOS-MANDATE-V4")'
launch_script "./autonomous-shield-v5.sh" '"DEFENSIVE" "SHIELD" ("AUTONOMOUS-SHIELD-V5")'
launch_script "./argus-c2-shield.sh" '"KINETIC" "SHIELD" ("ARGUS-C2-SHIELD")'
launch_script "./ccr5-audit-v5.1.sh" '"AUDIT" "PROTOCOL" ("CCR5-AUDIT-V5.1")'
launch_script "./trident-shield-v3.sh" '"TRIDENT" "SHIELD" ("TRIDENT-SHIELD-V3")'
launch_script "./terrestrial-array-haarp.sh" '"TERRESTRIAL" "HARDWARE" ("HAARP" "ARRAY")'

printf '[+] "MASTER" "CODEX": "ACTIVATION" "COMPLETE."\n'
