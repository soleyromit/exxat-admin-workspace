#!/bin/zsh
#
# reap-stale-chromium — safety net for the recurring CPU leak.
#
# visual-check / audit-server runs launch headless Chromium (chrome-headless-shell)
# and are supposed to close them. When a scan/autofix throws (or the audit-server
# dashboard is left running) browsers get orphaned and pile up — 60-140 of them
# have driven machine load to 22-42 (see memory: leaked-playwright-first).
#
# THE ROOT CAUSE is the SPAWNER: tools/visual-check/audit-server.mjs (a :7332
# dashboard) keeps making new browsers. Killing only the browsers is a band-aid —
# the spawner immediately makes more. So this reaper now kills the spawner too,
# and emergency-reaps when a burst pileup appears (don't wait 15 min while the
# machine melts).
#
# Three mechanisms, safest-first:
#   1. EMERGENCY  — if browser count >= EMERGENCY_COUNT, a real run never has that
#                   many at once, so kill the spawner + ALL browsers NOW.
#   2. SPAWNER    — kill any audit-server alive longer than SPAWNER_THRESHOLD_SECS
#                   (a real audit is minutes; a multi-hour dashboard is abandoned)
#                   and force-clear its now-orphaned browsers.
#   3. ROUTINE    — reap individual browsers older than THRESHOLD_SECS. An ACTIVE
#                   run's browser is short-lived, so it is never touched.
#
# Run by launchd every 2 min (scripts/launchd/com.exxat.reap-stale-chromium.plist),
# or by hand:  REAP_THRESHOLD_SECS=600 tools/visual-check/reap-stale-chromium.sh
#
THRESHOLD_SECS=${REAP_THRESHOLD_SECS:-900}              # browsers older than this = stale (15 min)
SPAWNER_THRESHOLD_SECS=${REAP_SPAWNER_THRESHOLD_SECS:-1800}  # audit-server older than this = abandoned (30 min)
EMERGENCY_COUNT=${REAP_EMERGENCY_COUNT:-16}             # this many browsers at once = burst leak, kill all + spawner now

SPAWNER_PATTERN='tools/visual-check/audit-server'

ts() { date '+%Y-%m-%dT%H:%M:%S'; }

# etime → seconds. macOS ps emits [[dd-]hh:]mm:ss.
etime_to_secs() {
  awk -F'[-:]' '{
    n=NF
    s=$n
    m=(n>=2)?$(n-1):0
    h=(n>=3)?$(n-2):0
    d=(n>=4)?$(n-3):0
    print d*86400 + h*3600 + m*60 + s
  }'
}

proc_age_secs() {  # $1 = pid → age in seconds (nonzero exit if gone)
  local et
  et=$(ps -o etime= -p "$1" 2>/dev/null | tr -d ' ')
  [[ -z "$et" ]] && return 1
  print -r -- "$et" | etime_to_secs
}

# ── 1. EMERGENCY: a pileup is always a leak — kill the spawner + ALL browsers now ──
browser_pids=( ${(f)"$(pgrep -f chrome-headless-shell 2>/dev/null)"} )
count=${#browser_pids[@]}
if (( count >= EMERGENCY_COUNT )); then
  if pkill -9 -f "$SPAWNER_PATTERN" 2>/dev/null; then
    echo "$(ts) EMERGENCY: killed audit-server spawner (browser pileup=${count} >= ${EMERGENCY_COUNT})"
  fi
  pkill -9 -f chrome-headless-shell 2>/dev/null
  echo "$(ts) EMERGENCY: reaped all ${count} chromium"
  exit 0
fi

# ── 2. SPAWNER: kill audit-server abandoned past its threshold, clear its browsers ──
spawner_killed=0
for pid in ${(f)"$(pgrep -f "$SPAWNER_PATTERN" 2>/dev/null)"}; do
  [[ -z "$pid" ]] && continue
  secs=$(proc_age_secs "$pid") || continue
  if (( secs > SPAWNER_THRESHOLD_SECS )); then
    if kill -9 "$pid" 2>/dev/null; then
      echo "$(ts) reaped abandoned audit-server pid=${pid} alive=${secs}s (threshold=${SPAWNER_THRESHOLD_SECS}s)"
      spawner_killed=$((spawner_killed + 1))
    fi
  fi
done
if (( spawner_killed > 0 )); then
  # The spawner is gone; its browsers are now orphaned regardless of age.
  pkill -9 -f chrome-headless-shell 2>/dev/null
  echo "$(ts) cleared chromium orphaned by reaped audit-server"
  exit 0
fi

# ── 3. ROUTINE: reap individual stale browsers (active run = short-lived, untouched) ──
reaped=0
for pid in ${browser_pids[@]}; do
  [[ -z "$pid" ]] && continue
  secs=$(proc_age_secs "$pid") || continue
  if (( secs > THRESHOLD_SECS )); then
    if kill -9 "$pid" 2>/dev/null; then
      echo "$(ts) reaped chromium pid=${pid} alive=${secs}s (threshold=${THRESHOLD_SECS}s)"
      reaped=$((reaped + 1))
    fi
  fi
done

(( reaped > 0 )) && echo "$(ts) total reaped: ${reaped}"
exit 0
