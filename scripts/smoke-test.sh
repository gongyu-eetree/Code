#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

echo "[Smoke Test] GET $BASE_URL/api/devices"
curl -s "$BASE_URL/api/devices" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s); if(!Array.isArray(j)||j.length===0) process.exit(1); console.log('devices:', j.length, 'first:', j[0].part_number);})"

echo "[Smoke Test] POST $BASE_URL/api/selection/recommend"
curl -s -X POST "$BASE_URL/api/selection/recommend" \
  -H 'Content-Type: application/json' \
  -d '{"query":"低功耗 MIPI 双摄桥接模块，工业级，预算敏感","topN":2}' \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s); if(!j.results||!j.results.length) process.exit(1); console.log('top1:', j.results[0].device.part_number, 'application:', j.parsed.applicationId);})"

echo "[Smoke Test] PASS"
