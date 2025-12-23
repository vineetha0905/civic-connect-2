# Local Development Setup - ML Backend

## Quick Start

1. **Create virtual environment (recommended):**
   ```bash
   python -m venv .venv
   
   # On Windows
   .venv\Scripts\activate
   
   # On Linux/Mac
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the ML backend:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. **Verify it's running:**
   - Health check: http://localhost:8000/health
   - Root: http://localhost:8000/
   - Submit endpoint: http://localhost:8000/submit

## Port Configuration

- **Default port**: 8000
- **Change port**: `uvicorn app.main:app --reload --port 8080`

## CORS

The ML backend is configured to allow all origins (`allow_origins=["*"]`), so it will work with:
- http://localhost:3000 (frontend)
- http://localhost:5001 (if backend calls it)
- Any other localhost port

No CORS configuration needed for local development!

