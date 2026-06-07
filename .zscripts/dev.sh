#!/bin/bash
cd /home/z/my-project

# Install dependencies if needed
[ ! -d "node_modules" ] && bun install

# Setup database
bun run db:push 2>/dev/null

# Build if needed  
if [ ! -f ".next/BUILD_ID" ]; then
  echo "[DEV] Building production app..."
  NODE_OPTIONS="--max-old-space-size=1024" node node_modules/.bin/next build 2>&1
fi

# Start production server as orphan of PID 1
# This prevents the container's process reaper from killing it
(
  NODE_OPTIONS="--max-old-space-size=64" node node_modules/.bin/next start -p 3000 > /tmp/next-prod.log 2>&1 &
)

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "[DEV] Server ready!"
    break
  fi
  sleep 1
done
