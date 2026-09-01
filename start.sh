#!/usr/bin/env bash
# Convenience launcher for the SentinelAI local stack.
# Starts the FastAPI backend in the background and the Next.js
# frontend in the foreground. Press Ctrl-C to stop both.

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "→ starting backend on http://127.0.0.1:8765"
( cd backend && [ -d .venv ] && source .venv/bin/activate; python -m uvicorn app.main:app --host 127.0.0.1 --port 8765 ) &
BACKEND_PID=$!
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT
sleep 2

echo "→ starting frontend on http://localhost:3000"
npm run dev
