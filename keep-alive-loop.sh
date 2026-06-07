#!/bin/bash
cd /home/z/my-project

# Make sure build exists
if [ ! -f ".next/BUILD_ID" ]; then
  echo "[$(date)] Building..." >> /tmp/keep-alive.log
  NODE_OPTIONS="--max-old-space-size=1024" node node_modules/.bin/next build >> /tmp/keep-alive.log 2>&1
fi

while true; do
  # Kill existing server
  pkill -f "next start" 2>/dev/null
  pkill -f "next dev" 2>/dev/null
  sleep 2
  
  # Start production server  
  NODE_OPTIONS="--max-old-space-size=64" nohup node node_modules/.bin/next start -p 3000 > /tmp/next-keep.log 2>&1 &
  
  # Wait for server to be ready
  for i in $(seq 1 15); do
    if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
      echo "[$(date)] Server started" >> /tmp/keep-alive.log
      break
    fi
    sleep 1
  done
  
  # Wait 45 seconds then restart (before the container kills it at ~60-90s)
  sleep 45
done
