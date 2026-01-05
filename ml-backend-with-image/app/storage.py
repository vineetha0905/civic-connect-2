from PIL import Image
import imagehash
import requests
import io
import json
from pathlib import Path
from math import radians, cos, sin, asin, sqrt

# Import dataset module to access the dataset file
from app import dataset

def _load_accepted_reports():
    """Load all accepted reports from dataset.jsonl."""
    try:
        if not dataset.DATA_FILE.exists():
            return []
        
        accepted_reports = []
        with dataset.DATA_FILE.open("r", encoding="utf8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    report = json.loads(line)
                    # Only include accepted reports
                    if report.get("status") == "accepted" and report.get("accept") is True:
                        accepted_reports.append(report)
                except json.JSONDecodeError:
                    continue  # Skip invalid JSON lines
        
        return accepted_reports
    except Exception as e:
        print(f"[ERROR] Failed to load accepted reports from dataset: {str(e)}")
        return []


def is_duplicate(user_id: str, description: str, category: str, store: bool = True) -> bool:
    """
    Check if this exact report has been submitted before by checking dataset.jsonl.
    Only returns True for exact matches (same user, same description, same category).
    Only checks ACCEPTED reports from dataset.jsonl.
    Set store=False to check without storing (for validation before acceptance).
    Note: store parameter is kept for compatibility but doesn't do anything (data is stored via dataset.save_report).
    """
    try:
        # Normalize the description - remove extra whitespace
        normalized_desc = " ".join(description.strip().lower().split())
        user_id_normalized = (user_id or "anon").lower()
        category_normalized = category.lower()
        
        # Load all accepted reports from dataset
        accepted_reports = _load_accepted_reports()
        
        # Check each accepted report
        for report in accepted_reports:
            report_user_id = (report.get("user_id") or "anon").lower()
            report_desc = " ".join((report.get("description") or "").strip().lower().split())
            report_category = (report.get("category") or "").lower()
            
            # Check for exact match
            if (report_user_id == user_id_normalized and 
                report_desc == normalized_desc and 
                report_category == category_normalized):
                print(f"[DEBUG] Text duplicate found in dataset: user_id={user_id_normalized}, category={category}")
                return True
        
        return False
    except Exception as e:
        print(f"[ERROR] Text duplicate check failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False  # On error, don't block submission

def is_duplicate_image(image_url: str, threshold: int = 0, store: bool = True) -> bool:
    """Check if an image is a duplicate using URL first, then perceptual hash (pHash).
    Checks ACCEPTED reports from dataset.jsonl.
    threshold = maximum Hamming distance allowed to consider images equal.
    threshold=0 means EXACT hash match only (most strict).
    Set store=False to check without storing (for validation before acceptance).
    DEPRECATED: Use is_duplicate_image_from_bytes instead.
    Note: store parameter is kept for compatibility but doesn't do anything (data is stored via dataset.save_report).
    """
    if not image_url:
        return False
    
    try:
        # Step 1: Quick URL-based check (exact match) - check dataset for image URLs
        try:
            from urllib.parse import urlparse, urlunparse
            parsed = urlparse(image_url)
            normalized_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))
            
            # Load accepted reports and check for URL match
            accepted_reports = _load_accepted_reports()
            for report in accepted_reports:
                # Check if report has image_url stored
                report_image_url = report.get("image_url")
                if report_image_url:
                    try:
                        report_parsed = urlparse(report_image_url)
                        report_normalized = urlunparse((report_parsed.scheme, report_parsed.netloc, report_parsed.path, '', '', ''))
                        if report_normalized == normalized_url:
                            print(f"[DEBUG] Duplicate detected: Exact URL match in dataset for {normalized_url}")
                            return True
                    except Exception:
                        continue
        except Exception as e:
            print(f"[WARNING] URL normalization failed: {str(e)}")
            # Continue with hash check
        
        # Step 2: Hash-based check (only for exact matches with threshold=0)
        try:
            resp = requests.get(image_url, timeout=10)
            resp.raise_for_status()
            img = Image.open(io.BytesIO(resp.content)).convert('RGB')
            img_hash = imagehash.phash(img)
            img_hash_int = int(str(img_hash), 16)

            # Load accepted reports and check for hash match
            accepted_reports = _load_accepted_reports()
            for report in accepted_reports:
                report_hash = report.get("image_hash")
                if report_hash is not None:
                    try:
                        if isinstance(report_hash, str):
                            report_hash_int = int(report_hash, 16)
                        else:
                            report_hash_int = int(report_hash)
                        
                        if abs(img_hash_int - report_hash_int) == 0:
                            print(f"[DEBUG] Duplicate detected: Exact hash match in dataset")
                            return True
                    except (ValueError, TypeError):
                        continue
            
            return False
        except Exception as e:
            # On any failure to fetch/process image, treat as non-duplicate
            print(f"[ERROR] Image hash check failed for {image_url}: {str(e)}")
            return False
    except Exception as e:
        print(f"[ERROR] Image duplicate check failed: {str(e)}")
        return False


def is_duplicate_image_from_bytes(image_bytes: bytes, threshold: int = 0, store: bool = True) -> bool:
    """Check if an image is a duplicate using perceptual hash (pHash) from bytes.
    Works with image bytes directly (no URL required).
    Checks ACCEPTED reports from dataset.jsonl for image hashes.
    threshold = maximum Hamming distance allowed to consider images equal.
    threshold=0 means EXACT hash match only (most strict).
    Set store=False to check without storing (for validation before acceptance).
    Note: store parameter is kept for compatibility but doesn't do anything (image hash is stored via dataset.save_report).
    """
    if not image_bytes:
        return False
    
    try:
        # Open image directly from bytes and compute hash
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img_hash = imagehash.phash(img)
        img_hash_str = str(img_hash)  # Keep as string for proper comparison

        # Load all accepted reports from dataset
        accepted_reports = _load_accepted_reports()
        
        print(f"[DEBUG] Checking image hash '{img_hash_str}' against {len(accepted_reports)} accepted reports")
        
        # Check each accepted report for image hash
        for report in accepted_reports:
            # Check if report has image_hash stored
            report_hash = report.get("image_hash")
            if report_hash is not None:
                try:
                    # Convert report_hash to string for comparison
                    report_hash_str = str(report_hash).strip()
                    
                    # For threshold=0, use exact string match (most reliable)
                    if threshold == 0:
                        if img_hash_str == report_hash_str:
                            print(f"[DEBUG] Image duplicate detected: Exact hash match '{img_hash_str}' == '{report_hash_str}'")
                            return True
                    else:
                        # For threshold > 0, use Hamming distance
                        try:
                            # Convert strings to ImageHash objects for Hamming distance
                            img_hash_obj = imagehash.hex_to_hash(img_hash_str)
                            report_hash_obj = imagehash.hex_to_hash(report_hash_str)
                            hamming_dist = img_hash_obj - report_hash_obj  # ImageHash objects support subtraction for Hamming distance
                            
                            if hamming_dist <= threshold:
                                print(f"[DEBUG] Image duplicate detected: Hamming distance {hamming_dist} <= threshold {threshold}")
                                return True
                        except (ValueError, TypeError) as hash_err:
                            # If Hamming distance calculation fails, try exact match as fallback
                            if img_hash_str == report_hash_str:
                                print(f"[DEBUG] Image duplicate detected: Exact hash match (fallback)")
                                return True
                            continue
                except (ValueError, TypeError) as e:
                    print(f"[DEBUG] Skipping invalid hash value in report: {e}")
                    continue  # Skip invalid hash values
        
        print(f"[DEBUG] Image hash '{img_hash_str}' is NOT a duplicate")
        return False
    except Exception as e:
        # On any failure to process image, treat as non-duplicate
        # Log the error for debugging but don't block submission
        print(f"[ERROR] Image hash check failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

def haversine(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance between two lat/lon points in meters."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1
    a = sin(delta_lat/2)**2 + cos(lat1) * cos(lat2) * sin(delta_lon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371000  # Earth radius in meters
    return c * r

def _calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculate simple semantic similarity between two texts using word overlap.
    Returns a similarity score between 0.0 and 1.0.
    """
    try:
        # Normalize texts
        text1_words = set(text1.lower().strip().split())
        text2_words = set(text2.lower().strip().split())
        
        # Remove common stop words for better matching
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
        text1_words = text1_words - stop_words
        text2_words = text2_words - stop_words
        
        if not text1_words and not text2_words:
            return 0.0
        if not text1_words or not text2_words:
            return 0.0
        
        # Calculate Jaccard similarity (intersection over union)
        intersection = len(text1_words & text2_words)
        union = len(text1_words | text2_words)
        
        if union == 0:
            return 0.0
        
        similarity = intersection / union
        
        # Also check for substring matches in key phrases (for cases like "pothole" vs "big pothole")
        text1_lower = text1.lower().strip()
        text2_lower = text2.lower().strip()
        
        # If one text contains the other (for short descriptions), boost similarity
        if len(text1_words) > 0 and len(text2_words) > 0:
            if text1_lower in text2_lower or text2_lower in text1_lower:
                similarity = max(similarity, 0.7)  # Boost if one contains the other
        
        return similarity
    except Exception as e:
        print(f"[WARNING] Text similarity calculation failed: {str(e)}")
        return 0.0


def is_duplicate_location(lat: float, lon: float, description: str, category: str, threshold: float = 10.0, store: bool = True) -> bool:
    """
    DEPRECATED: This function is kept for backward compatibility but should not be used.
    Use is_comprehensive_duplicate() instead for proper duplicate detection.
    
    Return True if an existing ACCEPTED report with same category exists within threshold meters.
    Checks dataset.jsonl for accepted reports with same category within threshold (default 10 meters).
    Set store=False to check without storing (for validation before acceptance).
    threshold can be a float for more precise control (e.g., 10.0 meters).
    Note: store parameter is kept for compatibility but doesn't do anything (location is stored via dataset.save_report).
    """
    try:
        # Load all accepted reports from dataset
        accepted_reports = _load_accepted_reports()
        
        category_normalized = category.lower()
        
        # Check each accepted report
        for report in accepted_reports:
            report_category = (report.get("category") or "").lower()
            
            # Check for same category
            if report_category == category_normalized:
                # Get location from report
                report_lat = report.get("latitude")
                report_lon = report.get("longitude")
                
                if report_lat is not None and report_lon is not None:
                    # Calculate distance
                    dist = haversine(lat, lon, float(report_lat), float(report_lon))
                    # Consider duplicate if same category within threshold meters
                    if dist <= threshold:
                        print(f"[DEBUG] Location duplicate found in dataset: ({lat}, {lon}) is {dist:.2f}m from ({report_lat}, {report_lon}) for category '{category}'")
                        return True
        
        return False
    except Exception as e:
        # On error, don't block submission - be permissive
        print(f"[ERROR] Location duplicate check failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False


def is_comprehensive_duplicate(image_bytes: bytes, description: str, category: str, lat: float = None, lon: float = None, image_threshold: int = 0, text_similarity_threshold: float = 0.6, location_threshold: float = 50.0) -> bool:
    """
    Comprehensive duplicate detection that requires BOTH image similarity AND semantic description similarity.
    Location is used only as a supporting signal to filter candidates.
    
    A report is considered a duplicate ONLY if:
    1. The image is the same/near-duplicate (same image hash), AND
    2. The description is semantically similar (text similarity > threshold), AND
    3. The category matches
    
    Location is used to filter candidate reports (only check reports within location_threshold meters),
    but location match alone is NOT sufficient for duplicate detection.
    
    Args:
        image_bytes: The image bytes to check
        description: The report description
        category: The report category
        lat: Latitude (optional, used for location filtering)
        lon: Longitude (optional, used for location filtering)
        image_threshold: Maximum Hamming distance for image hash (0 = exact match only)
        text_similarity_threshold: Minimum text similarity score (0.0-1.0, default 0.6)
        location_threshold: Maximum distance in meters for location filtering (default 50.0)
    
    Returns:
        True if duplicate detected (both image AND text similarity match), False otherwise
    """
    try:
        if not image_bytes:
            # If no image, fall back to text-only duplicate check (same user, same description, same category)
            print(f"[DEBUG] No image provided, skipping comprehensive duplicate check")
            return False
        
        # Load all accepted reports from dataset
        accepted_reports = _load_accepted_reports()
        
        if not accepted_reports:
            return False
        
        # Compute image hash for the new report
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img_hash = imagehash.phash(img)
        img_hash_str = str(img_hash)
        
        category_normalized = category.lower()
        normalized_desc = description.strip().lower()
        
        print(f"[DEBUG] Comprehensive duplicate check: image_hash='{img_hash_str}', category='{category}', description_length={len(description)}")
        
        # Filter candidates by location if coordinates provided (supporting signal)
        location_filtered_reports = accepted_reports
        if lat is not None and lon is not None:
            location_filtered_reports = []
            for report in accepted_reports:
                report_lat = report.get("latitude")
                report_lon = report.get("longitude")
                if report_lat is not None and report_lon is not None:
                    dist = haversine(lat, lon, float(report_lat), float(report_lon))
                    if dist <= location_threshold:
                        location_filtered_reports.append(report)
            
            print(f"[DEBUG] Location filter: {len(location_filtered_reports)} reports within {location_threshold}m (out of {len(accepted_reports)} total)")
        
        # Check each candidate report
        for report in location_filtered_reports:
            report_category = (report.get("category") or "").lower()
            
            # Must have same category
            if report_category != category_normalized:
                continue
            
            # Check 1: Image similarity (PRIMARY CONDITION)
            report_hash = report.get("image_hash")
            image_match = False
            if report_hash is not None:
                try:
                    report_hash_str = str(report_hash).strip()
                    
                    if image_threshold == 0:
                        # Exact hash match
                        if img_hash_str == report_hash_str:
                            image_match = True
                            print(f"[DEBUG] Image match found: exact hash match '{img_hash_str}' == '{report_hash_str}'")
                    else:
                        # Hamming distance match
                        try:
                            img_hash_obj = imagehash.hex_to_hash(img_hash_str)
                            report_hash_obj = imagehash.hex_to_hash(report_hash_str)
                            hamming_dist = img_hash_obj - report_hash_obj
                            
                            if hamming_dist <= image_threshold:
                                image_match = True
                                print(f"[DEBUG] Image match found: Hamming distance {hamming_dist} <= threshold {image_threshold}")
                        except (ValueError, TypeError):
                            # Fallback to exact match
                            if img_hash_str == report_hash_str:
                                image_match = True
                except (ValueError, TypeError) as e:
                    print(f"[DEBUG] Skipping invalid hash in report: {e}")
                    continue
            
            # If image doesn't match, skip this report (image match is REQUIRED)
            if not image_match:
                continue
            
            # Check 2: Text/semantic similarity (REQUIRED CONDITION)
            report_desc = (report.get("description") or "").strip().lower()
            text_similarity = _calculate_text_similarity(description, report_desc)
            
            print(f"[DEBUG] Text similarity check: similarity={text_similarity:.2f}, threshold={text_similarity_threshold}, report_desc='{report_desc[:50]}...'")
            
            # Both image AND text must match for duplicate
            if text_similarity >= text_similarity_threshold:
                print(f"[DEBUG] COMPREHENSIVE DUPLICATE DETECTED: image_match=True, text_similarity={text_similarity:.2f} >= {text_similarity_threshold}")
                return True
        
        print(f"[DEBUG] No comprehensive duplicate found: checked {len(location_filtered_reports)} reports")
        return False
        
    except Exception as e:
        # On error, don't block submission - be permissive
        print(f"[ERROR] Comprehensive duplicate check failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False
