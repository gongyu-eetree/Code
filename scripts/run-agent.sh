#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[FPGA Selection Agent] 启动中..."
echo "- 项目目录: $ROOT_DIR"
echo "- 访问地址: http://localhost:3000"
echo "- 停止服务: Ctrl+C"

echo
node server.mjs
