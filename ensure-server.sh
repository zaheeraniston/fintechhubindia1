#!/bin/bash
cd /home/z/my-project

# Check if server is running
if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
  echo "Server is running"
  exit 0
fi

# Server is down - restart it
echo "Server is down, restarting..."
pkill -f "next" 2>/dev/null
sleep 2

# Start production server
NODE_OPTIONS="--max-old-space-size=64" nohup node node_modules/.bin/next start -p 3000 > /tmp/next-restart.log 2>&1 &
disown

# Wait for it to be ready
for i in $(seq 1 15); do
  if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "Server restarted successfully!"
    exit 0
  fi
  sleep 1
done

echo "Failed to restart server"
exit 1
