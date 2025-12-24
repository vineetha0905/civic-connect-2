from pydantic import BaseModel
from typing import Optional

class ReportIn(BaseModel):
    report_id: str
    description: str
    user_id: Optional[str] = None
    image_bytes: Optional[bytes] = None  # Changed from image_url to image_bytes
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ReportStatus(BaseModel):
    report_id: str
    accept: bool
    status: str
    category: str
    confidence: float  # Required confidence score
    urgency: Optional[str] = None  # Only if accepted
    reason: str
