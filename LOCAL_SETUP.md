# Local Development Setup Guide

## 🚀 Quick Start for Local Development

### ⚡ IMPORTANT: Default URLs (No Config Needed!)
- **Backend API**: `http://localhost:5001` ✅ (default, works without .env)
- **ML Backend**: `http://localhost:8000` ✅ (default, works without .env)  
- **Frontend**: `http://localhost:3000` ✅ (default, works without .env)

**You can run everything without .env files if using default ports!**

### Prerequisites
- Node.js 16+ installed
- Python 3.9+ installed (for ML backend)
- MongoDB (local or Atlas connection string)

### Step 1: Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create `.env` file (OPTIONAL - defaults work for local dev):**
   ```bash
   # On Windows
   copy .env.example .env
   
   # On Linux/Mac
   cp .env.example .env
   ```
   
   **Note**: If you don't create `.env`, the backend will:
   - Use `http://localhost:8000/submit` for ML API (default)
   - Use `http://localhost:3000` for CORS (default)
   - Use port 5001 (default)

3. **If creating `.env`, update with your configuration:**
   - `ML_API_URL=http://localhost:8000/submit` (optional - already default)
   - `CORS_ORIGIN=http://localhost:3000` (optional - already default)
   - Update MongoDB URI if needed
   - Update Cloudinary credentials if needed

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start backend server:**
   ```bash
   npm start
   # Backend will run on http://localhost:5001
   ```

### Step 2: ML Backend Setup

1. **Navigate to ML backend directory:**
   ```bash
   cd ml-backend-with-image
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv .venv
   
   # On Windows
   .venv\Scripts\activate
   
   # On Linux/Mac
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start ML backend:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   # ML Backend will run on http://localhost:8000
   ```

### Step 3: Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Create `.env` file (OPTIONAL - defaults work for local dev):**
   ```bash
   # On Windows
   copy .env.example .env
   
   # On Linux/Mac
   cp .env.example .env
   ```
   
   **Note**: If you don't create `.env`, the frontend will:
   - Use `http://localhost:5001/api` for backend (default)
   - Use `http://localhost:8000` for ML backend (default)

3. **If creating `.env`, it should have:**
   ```env
   REACT_APP_API_BASE=http://localhost:5001/api
   REACT_APP_ML_BASE=http://localhost:8000
   ```
   (These are already the defaults, so .env is optional!)

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start frontend:**
   ```bash
   npm start
   # Frontend will run on http://localhost:3000
   ```

## 📋 Port Configuration

- **Backend API**: `http://localhost:5001`
- **ML Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:3000`

## ✅ Verification

1. **Backend Health Check:**
   ```
   GET http://localhost:5001/health
   ```

2. **ML Backend Health Check:**
   ```
   GET http://localhost:8000/health
   ```

3. **Frontend:**
   - Open browser: `http://localhost:3000`
   - Should load the application

## 🔧 Environment Variables Summary

### Backend (.env)
- `PORT=5001` - Backend port
- `ML_API_URL=http://localhost:8000/submit` - ML backend URL
- `CORS_ORIGIN=http://localhost:3000,http://localhost:3001` - Allowed origins
- `MONGODB_URI=...` - MongoDB connection string

### Frontend (.env)
- `REACT_APP_API_BASE=http://localhost:5001/api` - Backend API URL
- `REACT_APP_ML_BASE=http://localhost:8000` - ML Backend URL

### ML Backend
- No .env needed for local development
- Runs on port 8000 by default

## 🐛 Troubleshooting

### Port Already in Use
- Change port in respective `.env` files
- Or kill the process using the port

### CORS Errors
- Make sure backend CORS_ORIGIN includes `http://localhost:3000`
- Check backend is running on correct port

### ML Backend Not Responding
- Check ML backend is running: `http://localhost:8000/health`
- Verify port 8000 is not blocked
- Check ML backend logs for errors

### Frontend Can't Connect
- Verify backend is running: `http://localhost:5001/health`
- Check `.env` file has correct URLs
- Restart frontend after changing `.env`

