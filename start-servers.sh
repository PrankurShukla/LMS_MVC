#!/bin/bash

# Start backend server
echo "Starting LMS application servers..." 
echo "Starting backend server..."
cd "$(dirname "$0")/backend" && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start frontend server
echo "Starting frontend server..."
cd "$(dirname "$0")/frontend" && npm run dev &
FRONTEND_PID=$!

echo "Servers started successfully!"
echo "- Backend: http://localhost:3001"
echo "- Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both servers."

# Handle Ctrl+C to shut down both servers
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait 