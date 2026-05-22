#!/usr/bin/env bash
set -e

cleanup() {
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Stopped."
}
trap cleanup EXIT INT TERM

cd "$(dirname "$0")"

echo "Starting backend..."
(cd backend && npm run dev) &
BACKEND_PID=$!

echo "Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both."

wait
