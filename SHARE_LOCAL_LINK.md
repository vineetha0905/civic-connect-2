# How to Share Your Local Development Server Link

## Quick Steps

### 1. Find Your Local IP Address

**On macOS:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

**On Windows:**
```bash
ipconfig | findstr IPv4
```

**On Linux:**
```bash
hostname -I | awk '{print $1}'
```

### 2. Start Your Servers with Network Access

You have two options:

#### Option A: Use the Modified Start Script (Recommended)
```bash
./start-app-network.sh
```

#### Option B: Start Manually

**Frontend (React - Port 3000):**
```bash
cd frontend
HOST=0.0.0.0 npm start
```

**Backend (Node.js - Port 5001):**
```bash
cd backend
npm start
```

The backend should already accept connections from any IP if configured correctly.

### 3. Share the Link

Once you have your local IP (e.g., `192.168.1.100`), share:

```
http://YOUR_IP_ADDRESS:3000
```

**Example:**
```
http://192.168.1.100:3000
```

### 4. Important Notes

⚠️ **Firewall**: Make sure your firewall allows connections on ports 3000 and 5001

⚠️ **Same Network**: The device accessing the link must be on the same Wi-Fi/network

⚠️ **Backend API**: If the frontend can't connect to the backend, you may need to update the API URL in `frontend/src/services/api.js` or use environment variables.

### 5. Environment Variables (Optional)

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_BASE=http://YOUR_IP_ADDRESS:5001/api
REACT_APP_ML_BASE=http://YOUR_IP_ADDRESS:8000
```

Replace `YOUR_IP_ADDRESS` with your actual local IP.

### Troubleshooting

- **Can't access from another device?** 
  - Check firewall settings
  - Ensure both devices are on the same network
  - Verify the IP address is correct

- **Backend API not working?**
  - Update the API_BASE_URL in `frontend/src/services/api.js`
  - Or set environment variables before starting

- **Permission denied errors?**
  - On macOS, you may need to grant Terminal network access in System Preferences

