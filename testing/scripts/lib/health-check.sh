#!/usr/bin/env bash
# Health Check Library
# Pre-flight and post-flight verification

set -euo pipefail

_HEALTH_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if target URL is reachable
check_target_url() {
  local url="$1"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "000")
  if [[ "$status" == "200" ]] || [[ "$status" == "304" ]]; then
    echo "OK: Target $url is reachable (HTTP $status)"
    return 0
  else
    echo "FAIL: Target $url returned HTTP $status"
    return 1
  fi
}

# Check required tools are installed
check_tools() {
  local missing=()
  for tool in jq curl npx node; do
    if ! command -v "$tool" &>/dev/null; then
      missing+=("$tool")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "FAIL: Missing required tools: ${missing[*]}"
    return 1
  fi
  echo "OK: All required tools present"
  return 0
}

# Check Playwright is installed
check_playwright() {
  local project_root="${1:-$(cd "$_HEALTH_LIB_DIR/../../.." && pwd)}"
  if [[ -d "$project_root/node_modules/@playwright/test" ]]; then
    echo "OK: Playwright installed"
    return 0
  else
    echo "FAIL: Playwright not installed. Run: npm install"
    return 1
  fi
}

# Check state file is valid JSON
check_state_file() {
  local state_file="$_HEALTH_LIB_DIR/../test-state.json"
  if jq empty "$state_file" 2>/dev/null; then
    echo "OK: State file is valid JSON"
    return 0
  else
    echo "FAIL: State file is invalid JSON"
    return 1
  fi
}

# Full pre-flight check
preflight() {
  local url="$1"
  local project_root="${2:-$(cd "$_HEALTH_LIB_DIR/../../.." && pwd)}"
  local failed=0

  echo "=== Pre-flight Checks ==="
  echo ""

  check_tools || ((failed++))
  check_state_file || ((failed++))
  check_playwright "$project_root" || ((failed++))
  check_target_url "$url" || ((failed++))

  echo ""
  if [[ $failed -gt 0 ]]; then
    echo "Pre-flight FAILED: $failed check(s) failed"
    return 1
  else
    echo "Pre-flight PASSED: All checks OK"
    return 0
  fi
}

# Post-flight summary
postflight() {
  source "$_HEALTH_LIB_DIR/test-state.sh"
  echo "=== Post-flight Summary ==="
  get_summary
}
