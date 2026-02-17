#!/usr/bin/env bash
# Telegram Notification Library
# Sends notifications to Telegram (optional)

set -euo pipefail

TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# Send a telegram message
telegram_send() {
  local message="$1"

  if [[ -z "$TELEGRAM_BOT_TOKEN" ]] || [[ -z "$TELEGRAM_CHAT_ID" ]]; then
    # Silent skip if not configured
    return 0
  fi

  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${message}" \
    -d "parse_mode=Markdown" \
    >/dev/null 2>&1 || true
}

# Notify pipeline start
notify_pipeline_start() {
  local target="$1"
  local units="$2"
  telegram_send "🧪 *Testing Pipeline Started*
Target: \`$target\`
Units: $units"
}

# Notify unit complete
notify_unit_complete() {
  local unit_id="$1"
  local unit_name="$2"
  local passed="$3"
  local failed="$4"
  local emoji=$([[ "$failed" -eq 0 ]] && echo "✅" || echo "❌")
  telegram_send "$emoji *$unit_id: $unit_name*
Passed: $passed | Failed: $failed"
}

# Notify pipeline complete
notify_pipeline_complete() {
  local completed="$1"
  local failed="$2"
  local total="$3"
  local emoji=$([[ "$failed" -eq 0 ]] && echo "🎉" || echo "⚠️")
  telegram_send "$emoji *Testing Pipeline Complete*
Completed: $completed/$total
Failed: $failed"
}
