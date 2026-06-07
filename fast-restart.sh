#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=1024" node node_modules/.bin/next dev -p 3000 2>&1 | tee -a /tmp/fast-restart.log
  echo "[$(date)] Server died, restarting in 2s..." >> /tmp/fast-restart.log
  sleep 2
done
