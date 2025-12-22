from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import traceback
import os
import sys

# Add better error handling for imports
try:
    from app.pipeline import classify_report
    from app.models import ReportIn
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Python path: {sys.path}")
    raise

app = FastAPI(title="Civic ML Backend API", version="1.0.0")

# Log startup information
print("=" * 50)
print("ML Backend API Starting...")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"Python path: {sys.path}")
print("=" * 50)

# Note: Models are loaded lazily (on first use) to save memory
# CLIP model will be loaded when first image classification is needed

# CORS configuration - SIMPLIFIED AND RELIABLE
# The simplest approach: allow all origins with credentials=False
# This is safe because we don't use cookies or authentication headers
cors_origins_env = os.getenv("CORS_ORIGINS", "")

# Always use ["*"] for maximum compatibility - this works with allow_credentials=False
# FastAPI CORSMiddleware supports this combination
cors_origins = ["*"]

# Add CORS middleware - MUST be added before routes are defined
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # CRITICAL: Must be False when using "*"
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight for 1 hour
)

# Log CORS configuration
print("=" * 50)
print("CORS Configuration:")
print("  allow_origins: ['*'] (all origins)")
print("  allow_credentials: False")
print("  allow_methods: * (all methods)")
print("  allow_headers: * (all headers)")
print("  max_age: 3600")
print("=" * 50)

@app.get("/")
def health():
    return {"status": "ML API running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    """Health check endpoint for Render"""
    return {"status": "healthy", "service": "ML Backend"}

# Add explicit OPTIONS handler for CORS preflight
@app.options("/submit")
async def submit_options():
    """Handle CORS preflight requests"""
    return {"status": "ok"}

@app.post("/submit")
async def submit_report(data: ReportIn):
    """
    Submit a report for ML validation and classification.
    Accepts ReportIn model with required fields: report_id, description
    """
    try:
        print(f"Received ML validation request: report_id={data.report_id}, description_length={len(data.description or '')}")
        
        # Convert Pydantic model to dict for pipeline
        report_data = data.dict()
        
        # Validate required fields
        if not report_data.get("report_id") or not report_data.get("description"):
            print("Validation failed: Missing required fields")
            raise HTTPException(
                status_code=400, 
                detail="Missing required fields: report_id and description are required"
            )
        
        # Classify the report
        print("Starting ML classification...")
        result = classify_report(report_data)
        print(f"ML classification complete: status={result.get('status')}, category={result.get('category')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in submit_report: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
