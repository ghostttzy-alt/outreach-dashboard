#!/bin/bash
# Runs the autopilot in rounds until the time is up.
# Usage:  bash autopilot/run.sh 8      (hours to run, default 8)
# Stop it any time with Ctrl+C.

HOURS="${1:-8}"
ROUND_MINUTES=60
cd "$(dirname "$0")/.." || exit 1

CLAUDE="$(command -v claude || echo "$HOME/.local/bin/claude")"
if [ ! -x "$CLAUDE" ]; then
  echo "Can't find Claude Code. Install it with: curl -fsSL https://claude.ai/install.sh | bash"
  exit 1
fi

CHROME_FLAG=""
if "$CLAUDE" --help 2>/dev/null | grep -q -- "--chrome"; then
  CHROME_FLAG="--chrome"
fi

LOG_DIR="$HOME/autopilot-logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/$(date +%Y-%m-%d_%H%M).log"

# Keep the Mac awake for as long as this script runs.
caffeinate -dims -w $$ &

END=$(( $(date +%s) + HOURS * 3600 ))
ROUND=1
echo "Autopilot started for $HOURS hours. Log: $LOG"

while [ "$(date +%s)" -lt "$END" ]; do
  LEFT=$(( (END - $(date +%s)) / 60 ))
  echo ""
  echo "=== Round $ROUND · $(date '+%-I:%M %p') · about $LEFT minutes left ===" | tee -a "$LOG"

  GIT_TERMINAL_PROMPT=0 git pull --rebase -q >>"$LOG" 2>&1

  PROMPT="$(cat autopilot/prompt.md)

THIS IS ROUND $ROUND. About $LEFT minutes are left in this run, and this round should take about 45 minutes. Follow ROUND MODE: read hq-files/playbook.md, do the most valuable unfinished work in the PRIORITY ORDER, push, update the playbook, then stop."

  "$CLAUDE" -p "$PROMPT" $CHROME_FLAG --dangerously-skip-permissions >>"$LOG" 2>&1 &
  PID=$!

  # Stop a round that runs too long, so one stuck round can't eat the night.
  WAITED=0
  while kill -0 "$PID" 2>/dev/null; do
    sleep 30
    WAITED=$((WAITED + 30))
    if [ "$WAITED" -ge $((ROUND_MINUTES * 60)) ] || [ "$(date +%s)" -ge "$END" ]; then
      echo "Round $ROUND took too long, moving on." | tee -a "$LOG"
      kill "$PID" 2>/dev/null
      break
    fi
  done
  wait "$PID" 2>/dev/null

  tail -n 5 "$LOG"
  ROUND=$((ROUND + 1))
  sleep 20
done

echo "Autopilot finished. Check https://ghostzy.netlify.app/hq" | tee -a "$LOG"
