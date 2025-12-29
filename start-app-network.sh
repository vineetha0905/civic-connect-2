#!/bin/bash

# CivicConnect Network Access Startup Script
echo "🚀 Starting CivicConnect Application with Network Access..."

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash)
    LOCAL_IP=$(ipconfig | grep "IPv4" | awk '{print $14}' | head -1)
else
    LOCAL_IP="localhost"
fi

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="localhost"
    echo "⚠️  Could not detect IP address. Using localhost"
else
    echo "📍 Detected local IP: $LOCAL_IP"
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000,5001,8000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start Backend
echo "🔧 Starting Backend Server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -f http://localhost:5001/health > /dev/null 2>&1; then
    echo "✅ Backend started successfully!"
else
    echo "❌ Backend failed to start. Check the logs above."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start Frontend with network access
echo "🎨 Starting Frontend Server with network access..."
cd ../frontend
HOST=0.0.0.0 npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

echo ""
echo "🎉 CivicConnect is now running with network access!"
echo ""
echo "📍 Local Access:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5001"
echo ""
echo "🌐 Network Access (share this link):"
echo "   Frontend: http://$LOCAL_IP:3000"
echo "   Backend API: http://$LOCAL_IP:5001"
echo ""
echo "📱 To access from another device:"
echo "   1. Make sure both devices are on the same Wi-Fi/network"
echo "   2. Open browser on the other device"
echo "   3. Go to: http://$LOCAL_IP:3000"
echo ""
echo "🛑 To stop the servers, press Ctrl+C"
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped successfully!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait

