#!/bin/bash

# Get local IP address
echo "🔍 Detecting your local IP address..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # Try multiple methods on macOS
    IP=$(ipconfig getifaddr en0 2>/dev/null)
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1 2>/dev/null)
    fi
    if [ -z "$IP" ]; then
        IP=$(route get default 2>/dev/null | grep interface | awk '{print $2}' | xargs ipconfig getifaddr 2>/dev/null)
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    IP=$(ipconfig | grep "IPv4" | awk '{print $14}' | head -1)
fi

if [ -z "$IP" ]; then
    echo ""
    echo "⚠️  Could not automatically detect your IP address."
    echo ""
    echo "📋 Please find your IP manually:"
    echo "   • macOS: System Preferences > Network (or run: ifconfig | grep 'inet ')"
    echo "   • Windows: ipconfig (look for IPv4 Address)"
    echo "   • Linux: hostname -I"
    echo ""
    echo "🔗 Then use this format:"
    echo "   http://YOUR_IP_ADDRESS:3000"
    echo ""
    exit 1
fi

echo "✅ Found IP: $IP"
echo ""
echo "🌐 Your shareable link is:"
echo ""
echo "   👉 http://$IP:3000"
echo ""
echo "📱 To access from another device:"
echo "   1. Make sure both devices are on the same Wi-Fi/network"
echo "   2. Open browser on the other device"
echo "   3. Go to: http://$IP:3000"
echo ""
echo "⚠️  Note: Make sure your frontend is running with:"
echo "   HOST=0.0.0.0 npm start"
echo "   (or use ./start-app-network.sh)"
echo ""

