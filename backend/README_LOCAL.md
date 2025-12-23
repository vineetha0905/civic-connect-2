# Local Development Setup - Backend

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file in backend directory:**
   ```env
   NODE_ENV=development
   PORT=5001
   
   # Database
   MONGODB_URI=mongodb+srv://mahantigunavardhan:Gunavardhanmongo@cluster0.vkfwu.mongodb.net/civicconnect?retryWrites=true&w=majority&appName=Cluster0
   
   # CORS - Allow localhost
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001
   
   # JWT
   JWT_SECRET=local-development-jwt-secret
   JWT_EXPIRE=7d
   
   # ML Backend - LOCAL DEVELOPMENT
   ML_API_URL=http://localhost:8000/submit
   
   # Cloudinary (optional for local dev)
   # CLOUDINARY_CLOUD_NAME=your-cloud-name
   # CLOUDINARY_API_KEY=your-api-key
   # CLOUDINARY_API_SECRET=your-api-secret
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

4. **Verify it's running:**
   - Backend: http://localhost:5001/health
   - API: http://localhost:5001/api

## Default ML Backend URL

If `ML_API_URL` is not set in `.env`, the backend will default to:
- `http://localhost:8000/submit` (for local development)

This means you can run the backend without setting ML_API_URL if your ML backend is on port 8000.

