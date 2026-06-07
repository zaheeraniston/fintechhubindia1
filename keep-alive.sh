#!/bin/bash
while true; do
  node node_modules/.bin/next dev -p 3000 &
  NEXT_PID=$!
  echo "Started Next.js with PID $NEXT_PID"
  
  # Wait for server to be ready
  for i in {1..30}; do
    if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
      echo "Server is ready"
      break
    fi
    sleep 1
  done
  
  # Keep checking if the process is alive
  while kill -0 $NEXT_PID 2>/dev/null; do
    sleep 5
  done
  
  echo "Server died, restarting in 2s..."
  sleep 2
done
