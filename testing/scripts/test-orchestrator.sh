#!/usr/bin/env bash
# ConversionOS Autonomous Test Orchestrator
# Chains Claude Code sessions to run 18 test units sequentially
#
# Usage:
#   TEST_TARGET_URL=https://ai-reno-demo.vercel.app ./test-orchestrator.sh
#   ./test-orchestrator.sh --dry-run
#   ./test-orchestrator.sh --status
#   ./test-orchestrator.sh --reset
#   ./test-orchestrator.sh --max-sessions 3

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TESTING_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROMPTS_DIR="$SCRIPT_DIR/prompts"
LOGS_DIR="$SCRIPT_DIR/logs"
REPORTS_DIR="$TESTING_ROOT/reports"

# Source libraries
source "$SCRIPT_DIR/lib/test-state.sh"
source "$SCRIPT_DIR/lib/health-check.sh"
source "$SCRIPT_DIR/lib/telegram.sh"

# Configuration
TARGET_URL="${TEST_TARGET_URL:-http://localhost:3000}"
MAX_SESSIONS="${MAX_SESSIONS:-18}"
MAX_RETRIES=1
SESSION_TIMEOUT=1800  # 30 minutes per session

# Unit order (sequential)
UNIT_ORDER=(
  "T-01" "T-02" "T-03" "T-04"
  "T-05" "T-06"
  "T-07" "T-08" "T-09"
  "T-10" "T-11" "T-12" "T-13" "T-14"
  "T-15" "T-16" "T-17" "T-18"
)

# Map unit IDs to prompt files (function instead of associative array for bash 3 compat)
get_prompt_file() {
  case "$1" in
    T-01) echo "unit-01-link-crawl-public.md" ;;
    T-02) echo "unit-02-link-crawl-admin.md" ;;
    T-03) echo "unit-03-visual-public.md" ;;
    T-04) echo "unit-04-visual-admin.md" ;;
    T-05) echo "unit-05-homeowner-journey.md" ;;
    T-06) echo "unit-06-contractor-journey.md" ;;
    T-07) echo "unit-07-ai-chat.md" ;;
    T-08) echo "unit-08-ai-visualizer.md" ;;
    T-09) echo "unit-09-ai-receptionist.md" ;;
    T-10) echo "unit-10-leads-crud.md" ;;
    T-11) echo "unit-11-quotes-workflow.md" ;;
    T-12) echo "unit-12-invoices-workflow.md" ;;
    T-13) echo "unit-13-drawings-cad.md" ;;
    T-14) echo "unit-14-admin-settings.md" ;;
    T-15) echo "unit-15-pricing-calculations.md" ;;
    T-16) echo "unit-16-accessibility.md" ;;
    T-17) echo "unit-17-performance.md" ;;
    T-18) echo "unit-18-security-routes.md" ;;
    *)    echo "" ;;
  esac
}

# Print usage
usage() {
  cat <<EOF
ConversionOS Autonomous Test Orchestrator

Usage:
  TEST_TARGET_URL=<url> $0 [options]

Options:
  --dry-run         Show plan without executing
  --status          Show current pipeline status
  --reset           Reset all units to pending
  --max-sessions N  Limit number of sessions (default: 18)
  --unit T-XX       Run a single unit only
  --from T-XX       Start from a specific unit
  --help            Show this help

Environment:
  TEST_TARGET_URL   Target URL to test (default: http://localhost:3000)
  TELEGRAM_BOT_TOKEN  Telegram bot token for notifications (optional)
  TELEGRAM_CHAT_ID    Telegram chat ID for notifications (optional)

Examples:
  TEST_TARGET_URL=https://ai-reno-demo.vercel.app $0
  TEST_TARGET_URL=https://ai-reno-demo.vercel.app $0 --max-sessions 3
  $0 --unit T-01
  $0 --status
EOF
}

# Parse arguments
DRY_RUN=false
SHOW_STATUS=false
RESET=false
SINGLE_UNIT=""
START_FROM=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)    DRY_RUN=true; shift ;;
    --status)     SHOW_STATUS=true; shift ;;
    --reset)      RESET=true; shift ;;
    --max-sessions) MAX_SESSIONS="$2"; shift 2 ;;
    --unit)       SINGLE_UNIT="$2"; shift 2 ;;
    --from)       START_FROM="$2"; shift 2 ;;
    --help|-h)    usage; exit 0 ;;
    *)            echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

# Handle --status
if [[ "$SHOW_STATUS" == "true" ]]; then
  get_summary
  exit 0
fi

# Handle --reset
if [[ "$RESET" == "true" ]]; then
  reset_state
  echo "Pipeline state reset."
  exit 0
fi

# Determine which units to run
units_to_run=()
if [[ -n "$SINGLE_UNIT" ]]; then
  units_to_run=("$SINGLE_UNIT")
elif [[ -n "$START_FROM" ]]; then
  started=false
  for unit in "${UNIT_ORDER[@]}"; do
    if [[ "$unit" == "$START_FROM" ]]; then
      started=true
    fi
    if [[ "$started" == "true" ]]; then
      units_to_run+=("$unit")
    fi
  done
else
  for unit in "${UNIT_ORDER[@]}"; do
    status=$(unit_get_status "$unit")
    if [[ "$status" == "pending" ]] || [[ "$status" == "failed" ]]; then
      units_to_run+=("$unit")
    fi
  done
fi

# Apply max sessions limit
if [[ ${#units_to_run[@]} -gt $MAX_SESSIONS ]]; then
  units_to_run=("${units_to_run[@]:0:$MAX_SESSIONS}")
fi

# Handle --dry-run
if [[ "$DRY_RUN" == "true" ]]; then
  echo "=== Dry Run ==="
  echo "Target URL: $TARGET_URL"
  echo "Units to run: ${#units_to_run[@]}"
  echo ""
  for unit in "${units_to_run[@]}"; do
    local_name=$(state_get ".units[\"$unit\"].name")
    prompt_file=$(get_prompt_file "$unit")
    echo "  $unit: $local_name"
    echo "    Prompt: $PROMPTS_DIR/$prompt_file"
    if [[ -f "$PROMPTS_DIR/$prompt_file" ]]; then
      echo "    Status: prompt exists"
    else
      echo "    Status: MISSING PROMPT"
    fi
  done
  exit 0
fi

# Pre-flight checks
echo "ConversionOS Autonomous Test Pipeline"
echo "========================================="
echo "Target: $TARGET_URL"
echo "Units:  ${#units_to_run[@]}"
echo ""

preflight "$TARGET_URL" "$PROJECT_ROOT" || exit 1

# Initialize pipeline
pipeline_start "$TARGET_URL"
notify_pipeline_start "$TARGET_URL" "${#units_to_run[@]}"

mkdir -p "$LOGS_DIR"

session_count=0
for unit in "${units_to_run[@]}"; do
  session_count=$((session_count + 1))
  unit_name=$(state_get ".units[\"$unit\"].name")
  prompt_file=$(get_prompt_file "$unit")
  prompt_path="$PROMPTS_DIR/$prompt_file"
  log_file="$LOGS_DIR/${unit}-$(date +%Y%m%d-%H%M%S).log"
  session_id="session-${unit}-$(date +%s)"

  echo ""
  echo "----------------------------------------"
  echo "[$session_count/${#units_to_run[@]}] $unit: $unit_name"
  echo "----------------------------------------"

  if [[ ! -f "$prompt_path" ]]; then
    echo "WARNING: Prompt file missing: $prompt_path"
    unit_set_status "$unit" "skipped"
    continue
  fi

  unit_start "$unit" "$session_id"

  # Build the prompt with context
  prompt_content=$(cat "$prompt_path")
  full_prompt="You are running autonomous E2E tests for ConversionOS.

TARGET_URL: $TARGET_URL
UNIT_ID: $unit
UNIT_NAME: $unit_name
PROJECT_ROOT: $PROJECT_ROOT
TESTING_ROOT: $TESTING_ROOT

$prompt_content

IMPORTANT: When done, output exactly this line:
SUITE_STATUS=complete

If blocked and cannot proceed, output:
SUITE_STATUS=blocked"

  # Run Claude Code session
  start_time=$(date +%s)
  exit_code=0

  CLAUDECODE= timeout --foreground "$SESSION_TIMEOUT" claude -p "$full_prompt" \
    --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
    --dangerously-skip-permissions \
    > "$log_file" 2>&1 || exit_code=$?

  end_time=$(date +%s)
  duration=$((end_time - start_time))

  # Parse results from log (macOS-compatible grep, no -P flag)
  if grep -q "SUITE_STATUS=complete" "$log_file" 2>/dev/null; then
    echo "[OK] $unit complete (${duration}s)"

    # Extract test counts (macOS-compatible: use grep -oE instead of -oP)
    # Try standard Playwright format first ("N passed"), then Vitest formats
    tests=$(grep -oE '[0-9]+ passed' "$log_file" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo "0")
    if [ "$tests" = "0" ]; then
      # Try Vitest format: "Tests  X passed"
      tests=$(grep -oE 'Tests\s+[0-9]+ passed' "$log_file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    fi
    if [ "$tests" = "0" ]; then
      # Try "X tests passed" format
      tests=$(grep -oE '[0-9]+ tests? passed' "$log_file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    fi

    failed_count=$(grep -oE '[0-9]+ failed' "$log_file" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo "0")
    if [ "$failed_count" = "0" ]; then
      failed_count=$(grep -oE 'Tests\s+[0-9]+ failed' "$log_file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    fi
    if [ "$failed_count" = "0" ]; then
      failed_count=$(grep -oE '[0-9]+ tests? failed' "$log_file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    fi

    skipped_count=$(grep -oE '[0-9]+ skipped' "$log_file" 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo "0")
    if [ "$skipped_count" = "0" ]; then
      skipped_count=$(grep -oE 'Tests\s+[0-9]+ skipped' "$log_file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    fi
    if [ "$skipped_count" = "0" ]; then
      skipped_count=$(grep -oE '[0-9]+ tests? skipped' "$log_file" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    fi

    unit_set_results "$unit" "$((tests + failed_count + skipped_count))" "$tests" "$failed_count" "$skipped_count" "${duration}s"
    pipeline_increment_completed
    notify_unit_complete "$unit" "$unit_name" "$tests" "$failed_count"

  elif grep -q "SUITE_STATUS=blocked" "$log_file" 2>/dev/null; then
    echo "[BLOCKED] $unit blocked (${duration}s)"
    unit_set_status "$unit" "blocked"
    pipeline_increment_failed

  else
    echo "[FAIL] $unit failed or timed out (exit=$exit_code, ${duration}s)"
    unit_set_status "$unit" "failed"
    pipeline_increment_failed
    notify_unit_complete "$unit" "$unit_name" "0" "1"
  fi
done

# Pipeline complete
pipeline_complete
echo ""
echo "========================================="
echo "Pipeline Complete"
echo "========================================="
get_summary

# Generate report
"$SCRIPT_DIR/generate-report.sh" 2>/dev/null || echo "(Report generation skipped)"

notify_pipeline_complete \
  "$(state_get '.pipeline.completedUnits')" \
  "$(state_get '.pipeline.failedUnits')" \
  "$(state_get '.pipeline.totalUnits')"

echo ""
echo "TESTING_STATUS=complete"
