# Local Development Setup - Frontend

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file in frontend directory:**
   ```env
   NODE_ENV=development
   
   # API Base URL - LOCAL DEVELOPMENT
   REACT_APP_API_BASE=http://localhost:5001/api
   
   # ML Backend URL - LOCAL DEVELOPMENT
   REACT_APP_ML_BASE=http://localhost:8000
   
   # Enable source maps for debugging
   GENERATE_SOURCEMAP=true
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```

4. **Frontend will open at:**
   - http://localhost:3000

## Default URLs

The frontend already defaults to localhost URLs:
- **Backend API**: `http://localhost:5001/api` (if REACT_APP_API_BASE not set)
- **ML Backend**: `http://localhost:8000` (if REACT_APP_ML_BASE not set)

So you can run the frontend without a `.env` file if your services are on default ports!

