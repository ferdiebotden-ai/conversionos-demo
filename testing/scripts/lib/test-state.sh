#!/usr/bin/env bash
# Test State Management Library
# Manages test-state.json via jq

set -euo pipefail

_STATE_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="${_STATE_LIB_DIR}/../test-state.json"

# Read a value from state
state_get() {
  local path="$1"
  jq -r "$path" "$STATE_FILE"
}

# Write a value to state
state_set() {
  local path="$1"
  local value="$2"
  local tmp
  tmp=$(mktemp)
  jq "$path = $value" "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

# Set pipeline status
pipeline_set_status() {
  local status="$1"
  state_set '.pipeline.status' "\"$status\""
}

# Set pipeline target URL
pipeline_set_target() {
  local url="$1"
  state_set '.pipeline.targetUrl' "\"$url\""
}

# Mark pipeline started
pipeline_start() {
  local url="$1"
  local now
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local tmp
  tmp=$(mktemp)
  jq --arg url "$url" --arg now "$now" '
    .pipeline.status = "running" |
    .pipeline.startedAt = $now |
    .pipeline.completedAt = null |
    .pipeline.targetUrl = $url |
    .pipeline.completedUnits = 0 |
    .pipeline.failedUnits = 0 |
    .pipeline.skippedUnits = 0
  ' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

# Mark pipeline completed
pipeline_complete() {
  local now
  now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  state_set '.pipeline.completedAt' "\"$now\""
  pipeline_set_status "complete"
}

# Get unit status
unit_get_status() {
  local unit_id="$1"
  state_get ".units[\"$unit_id\"].status"
}

# Set unit status
unit_set_status() {
  local unit_id="$1"
  local status="$2"
  state_set ".units[\"$unit_id\"].status" "\"$status\""
}

# Update unit results
unit_set_results() {
  local unit_id="$1"
  local tests="$2"
  local passed="$3"
  local failed="$4"
  local skipped="$5"
  local duration="$6"
  local tmp
  tmp=$(mktemp)
  jq --arg id "$unit_id" \
     --argjson tests "$tests" \
     --argjson passed "$passed" \
     --argjson failed "$failed" \
     --argjson skipped "$skipped" \
     --arg duration "$duration" '
    .units[$id].tests = $tests |
    .units[$id].passed = $passed |
    .units[$id].failed = $failed |
    .units[$id].skipped = $skipped |
    .units[$id].duration = $duration |
    .units[$id].status = (if $failed > 0 then "failed" else "complete" end)
  ' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

# Mark unit as running with session ID
unit_start() {
  local unit_id="$1"
  local session_id="${2:-}"
  local tmp
  tmp=$(mktemp)
  jq --arg id "$unit_id" --arg session "$session_id" '
    .units[$id].status = "running" |
    .units[$id].session = $session
  ' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

# Increment completed/failed counters
pipeline_increment_completed() {
  local tmp
  tmp=$(mktemp)
  jq '.pipeline.completedUnits += 1' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

pipeline_increment_failed() {
  local tmp
  tmp=$(mktemp)
  jq '.pipeline.failedUnits += 1' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

# Get next pending unit
get_next_pending_unit() {
  jq -r '[.units | to_entries[] | select(.value.status == "pending")] | first | .key // empty' "$STATE_FILE"
}

# Get summary
get_summary() {
  jq '{
    status: .pipeline.status,
    target: .pipeline.targetUrl,
    total: .pipeline.totalUnits,
    completed: .pipeline.completedUnits,
    failed: .pipeline.failedUnits,
    units: [.units | to_entries[] | {id: .key, name: .value.name, status: .value.status, tests: .value.tests, passed: .value.passed, failed: .value.failed}]
  }' "$STATE_FILE"
}

# Reset all units to pending
reset_state() {
  local tmp
  tmp=$(mktemp)
  jq '
    .pipeline.status = "idle" |
    .pipeline.startedAt = null |
    .pipeline.completedAt = null |
    .pipeline.completedUnits = 0 |
    .pipeline.failedUnits = 0 |
    .pipeline.skippedUnits = 0 |
    .units |= with_entries(
      .value.status = "pending" |
      .value.tests = 0 |
      .value.passed = 0 |
      .value.failed = 0 |
      .value.skipped = 0 |
      .value.duration = null |
      .value.session = null
    )
  ' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}
