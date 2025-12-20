from app import storage, dataset
from app import image_classifier as ic
from app.text_rules import is_abusive, detect_category, detect_urgency
import re

# Profanity detection
import warnings
# Suppress pkg_resources deprecation warnings globally (they're just warnings, not errors)
warnings.filterwarnings("ignore", category=UserWarning, message=".*pkg_resources.*")

PROFANITY_AVAILABLE = False
_profanity_predict = None
try:
    from profanity_check import predict as _profanity_predict
    # Test that it works with a known profane word
    _test_result = _profanity_predict(["fuck"])
    # Check if result is valid (should be numpy array or list with 1)
    if _test_result is not None:
        PROFANITY_AVAILABLE = True
except ImportError:
    # Library truly not installed
    pass  # Silently fall back to keyword-based detection
except Exception as e:
    # Any other import/runtime error - silently fall back
    PROFANITY_AVAILABLE = False
    _profanity_predict = None

# Category-scoped urgent keywords (same methodology as CATEGORY_KEYWORDS)
# Keep a Global bucket to preserve previous behavior while enabling per-category tuning
URGENT_KEYWORDS = {
    "Global": [
        # Road & Transport
        "accident", "collision", "roadblock", "traffic jam", "hit and run",
        "bridge collapse", "pothole accident", "road caved in",

        # Fire & Hazard
        "fire", "burning", "smoke", "blast", "explosion", "short circuit",
        "gas leak", "electric spark", "transformer burst",

        # Water & Flood
        "flood", "waterlogging", "sewage overflow", "pipe burst",
        "drain blocked", "heavy rain", "overflowing drain", "contaminated water",

        # Health & Sanitation
        "garbage overflow", "dead animal", "toxic smell", "mosquito breeding",
        "epidemic", "dengue outbreak", "cholera", "sanitation hazard","dead","death"

        # Safety & Security
        "violence", "crime", "theft", "fight", "robbery", "public hazard",
        "building collapse", "wall collapse", "tree fallen", "landslide",

        # Other Civic Emergencies
        "power outage", "electric shock", "streetlight sparks",
        "ambulance needed", "emergency help"
    ],
    # Per-category overrides/extensions (can be expanded as needed)
    "Road & Traffic": ["accident", "collision", "roadblock", "pothole"],
    "Water & Drainage": ["flood", "waterlogging", "sewage overflow", "pipe burst"],
    "Electricity": ["power outage", "short circuit", "electric shock"],
    "Garbage & Sanitation": ["garbage overflow", "toxic smell","dead","death"],
    "Street Lighting": ["streetlight sparks", "dark area"],
    "Public Safety": ["violence", "robbery", "fire"],
    "Parks & Recreation": ["tree fallen"],
    "Other": []
}


# optional model availability flags are handled inside image_classifier

def initialize_models():
    # initialize image classifier (CLIP) if available
    try:
        ic.initialize_clip()
    except Exception:
        pass

def classify_report(report: dict):
    try:
        if not report:
            return {
                "report_id": "unknown",
                "status": "rejected",
                "reason": "Empty report data"
            }
        
        desc = (report.get("description") or "").strip()
        desc_lower = desc.lower()
        
        if not desc:
            return {
                "report_id": report.get("report_id", "unknown"),
                "accept": False,
                "status": "rejected",
                "reason": "Description is required"
            }
        
        # Auto-detect category from description
        cat = detect_category(desc)
        
        # Auto-reject if category is "Other"
        if cat == "Other":
            result = {
                "report_id": report.get("report_id", "unknown"),
                "accept": False,
                "status": "rejected",
                "category": cat,
                "department": cat,
                "reason": "Unable to determine issue category from description"
            }
            dataset.save_report({**report, **result})
            return result

        # 1. Reject if abusive (using text_rules + profanity-check library)
        # Use text_rules.is_abusive() as primary check
        is_profane_keywords = is_abusive(desc)
        
        # Also try ML model if available
        is_profane_ml = False
        if PROFANITY_AVAILABLE and _profanity_predict is not None:
            try:
                # profanity_check.predict returns a numpy array with 1 for profane, 0 for clean
                predictions = _profanity_predict([desc])
                # Handle numpy array, list, or scalar returns
                if hasattr(predictions, '__getitem__') and len(predictions) > 0:
                    is_profane_ml = bool(int(predictions[0]) == 1)
                elif hasattr(predictions, 'item'):
                    is_profane_ml = bool(int(predictions.item()) == 1)
                else:
                    is_profane_ml = bool(int(predictions) == 1)
            except Exception:
                # If profanity_check fails at runtime, just use keyword check
                pass
        
        # Reject if EITHER detection method finds profanity
        is_profane = is_profane_keywords or is_profane_ml
        
        if is_profane:
            result = {
                "report_id": report.get("report_id", "unknown"),
                "accept": False,
                "status": "rejected",
                "category": cat,
                "department": cat,
                "reason": "Abusive language detected"
            }
            dataset.save_report({**report, **result})
            return result

        # 2. Category is already auto-detected, no need for validation
        # (Category detection from text_rules is trusted)

        # Note: Duplicate detection is disabled for now to avoid false positives
        # The in-memory storage is causing false positives for legitimate reports
        # TODO: Implement a more robust duplicate detection system with database persistence
        # For now, we'll skip duplicate detection to ensure legitimate reports are not rejected
        
        # Only perform duplicate check if explicitly enabled via environment variable
        # This allows us to test and improve the duplicate detection without blocking users
        enable_duplicate_check = False  # Set to True to enable strict duplicate checking
        
        if enable_duplicate_check:
            user_id = report.get("user_id")
            lat = report.get("latitude")
            lon = report.get("longitude")
            
            # Only check for duplicates if we have a registered user and valid location
            if user_id and user_id != "anon" and lat is not None and lon is not None:
                # Check text duplicate (without storing)
                text_dup = storage.is_duplicate(user_id, desc, cat, store=False)
                
                if text_dup:
                    # Text matches - now check location (extremely strict: 1 meter)
                    loc_dup = storage.is_duplicate_location(lat, lon, desc, cat, threshold=1.0, store=False)
                    
                    if loc_dup:
                        # Text and location match - check image if provided
                        if image_url:
                            image_dup = storage.is_duplicate_image(image_url, threshold=0, store=False)  # threshold=0 means exact match
                            if image_dup:
                                result = {
                                    "report_id": report.get("report_id", "unknown"),
                                    "status": "rejected",
                                    "reason": "Duplicate spam (same user, text, location, and image)"
                                }
                                dataset.save_report({**report, **result})
                                return result
        
        # If we get here, it's not a duplicate (or duplicate check is disabled)
        # Store the data for future checks (only if duplicate check is enabled)
        if enable_duplicate_check:
            user_id = report.get("user_id")
            lat = report.get("latitude")
            lon = report.get("longitude")
            
            if user_id and user_id != "anon":
                storage.is_duplicate(user_id, desc, cat, store=True)
            if image_url:
                storage.is_duplicate_image(image_url, threshold=0, store=True)
            if lat is not None and lon is not None:
                storage.is_duplicate_location(lat, lon, desc, cat, threshold=1.0, store=True)

        # 4. Detect urgency using text_rules
        urgency = detect_urgency(desc)
        
        # Map urgency to priority (Issue model accepts: 'low', 'medium', 'high', 'urgent')
        urgency_map = {
            "high": "urgent",
            "medium": "medium",
            "low": "low"
        }
        priority = urgency_map.get(urgency, "medium")
        
        # 3. Image classification (optional, for future use)
        image_url = report.get("image_url")
        image_cat = None
        if image_url:
            try:
                image_cat = ic.classify_image(image_url)
            except Exception:
                pass  # Image classification is optional
        
        # Return accepted result with all required fields
        result = {
            "report_id": report.get("report_id", "unknown"),
            "accept": True,
            "status": "accepted",
            "category": cat,
            "department": cat,  # Department same as category for routing
            "urgency": urgency,
            "priority": priority,
            "reason": "Report accepted successfully"
        }
        dataset.save_report({**report, **result})
        return result
    except Exception as e:
        print(f"Error in classify_report: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {
            "report_id": report.get("report_id", "unknown"),
            "accept": False,
            "status": "rejected",
            "category": "Other",
            "department": "Other",
            "reason": f"Processing error: {str(e)}"
        }
