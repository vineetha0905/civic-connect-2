from fastapi import FastAPI, HTTPException, Request, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import traceback
import os
import sys
import json

# Initialize app first - this must work
app = FastAPI(title="Civic ML Backend API", version="1.0.0")

# Try to import ML modules - make them optional so app can start even if they fail
classify_report = None
ml_available = False

try:
    from app.pipeline import classify_report
    ml_available = True
    print("✅ ML modules loaded successfully")
except Exception as e:
    print(f"⚠️ ML modules not available (non-critical): {e}")
    print("⚠️ API will return default responses")

# Log startup information
print("=" * 50)
print("ML Backend API Starting...")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")
print(f"ML Available: {ml_available}")
print("=" * 50)

# CORS configuration - SIMPLIFIED AND RELIABLE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # CRITICAL: Must be False when using "*"
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight for 1 hour
)

print("=" * 50)
print("CORS Configuration:")
print("  allow_origins: ['*'] (all origins)")
print("  allow_credentials: False")
print("=" * 50)

@app.get("/")
def health():
    return {"status": "ML API running", "version": "1.0.0", "ml_available": ml_available}

@app.get("/health")
def health_check():
    """Health check endpoint for Render"""
    return {"status": "healthy", "service": "ML Backend", "ml_available": ml_available}

@app.options("/submit")
async def submit_options():
    """Handle CORS preflight requests"""
    return {"status": "ok"}

@app.post("/submit")
async def submit_report(
    report_id: str = Form(...),
    description: str = Form(...),
    user_id: Optional[str] = Form(None),
    latitude: Optional[str] = Form(None),
    longitude: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    """
    Submit a report for ML validation and classification.
    Accepts multipart/form-data with:
    - report_id (required)
    - description (required)
    - user_id (optional)
    - latitude (optional, as string, will be converted to float)
    - longitude (optional, as string, will be converted to float)
    - image (optional, as file bytes)
    """
    try:
        print(f"Received ML validation request: report_id={report_id}, description_length={len(description or '')}")
        
        # Validate required fields
        if not report_id or not description:
            raise HTTPException(
                status_code=400, 
                detail="Missing required fields: report_id and description are required"
            )
        
        # Convert latitude and longitude from string to float if provided
        latitude_float = None
        longitude_float = None
        if latitude:
            try:
                latitude_float = float(latitude)
            except (ValueError, TypeError):
                print(f"Warning: Invalid latitude value '{latitude}', ignoring")
        if longitude:
            try:
                longitude_float = float(longitude)
            except (ValueError, TypeError):
                print(f"Warning: Invalid longitude value '{longitude}', ignoring")
        
        # Check if ML is available
        if not ml_available or classify_report is None:
            print("⚠️ ML not available, returning default acceptance")
            # Return default acceptance if ML is not available
            return {
                "report_id": report_id,
                "accept": True,
                "status": "accepted",
                "category": "Other",
                "confidence": 0.0,
                "urgency": "low",
                "reason": "ML service unavailable, default acceptance"
            }
        
        # Read image bytes if provided
        image_bytes = None
        if image:
            try:
                image_bytes = await image.read()
                print(f"Received image: {len(image_bytes)} bytes")
            except Exception as e:
                print(f"Error reading image: {str(e)}")
                # Continue without image if read fails
        
        # Prepare report data
        report_data = {
            "report_id": report_id,
            "description": description,
            "user_id": user_id,
            "image_bytes": image_bytes,  # Changed from image_url to image_bytes
            "latitude": latitude_float,
            "longitude": longitude_float
        }
        
        # Classify the report using ML
        print("Starting ML classification...")
        print(f"Report data keys: {list(report_data.keys())}")
        print(f"Has image_bytes: {bool(report_data.get('image_bytes'))}")
        if report_data.get('image_bytes'):
            print(f"Image bytes size: {len(report_data.get('image_bytes'))} bytes")
        
        try:
            result = classify_report(report_data)
            print(f"ML classification complete: status={result.get('status')}, category={result.get('category')}, confidence={result.get('confidence')}")
            
            # Ensure result has all required fields
            if not isinstance(result, dict):
                raise ValueError(f"classify_report returned non-dict: {type(result)}")
            
            # Ensure result has required keys
            if 'report_id' not in result:
                result['report_id'] = report_id
            if 'accept' not in result:
                result['accept'] = False
            if 'status' not in result:
                result['status'] = 'error'
            if 'category' not in result:
                result['category'] = 'Other'
            if 'confidence' not in result:
                result['confidence'] = 0.0
            
            return result
        except Exception as ml_error:
            print(f"ERROR in classify_report: {str(ml_error)}")
            print(traceback.format_exc())
            # Return error response with 200 status (not 500) so frontend can handle it
            return {
                "report_id": report_id,
                "accept": False,
                "status": "error",
                "category": "Other",
                "confidence": 0.0,
                "reason": f"ML classification error: {str(ml_error)}"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in submit_report: {str(e)}")
        print(traceback.format_exc())
        # Return error response with 200 status (not 500) so frontend can handle it
        error_report_id = report_id if 'report_id' in locals() else "unknown"
        return {
            "report_id": error_report_id,
            "accept": False,
            "status": "error",
            "category": "Other",
            "confidence": 0.0,
            "reason": f"ML processing error: {str(e)}"
        }
