import json
from pathlib import Path
import os

# Always resolve the dataset path relative to this file so that it works
# no matter where the application is started from (repo root, service dir, etc.)
BASE_DIR = Path(__file__).resolve().parent.parent  # points to ml-backend-with-image/
DATA_FILE = BASE_DIR / "data" / "dataset.jsonl"

# Ensure data directory exists and log path on module load
try:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    print(f"[INIT] Dataset file path: {DATA_FILE.absolute()}")
    print(f"[INIT] Dataset file exists: {DATA_FILE.exists()}")
    print(f"[INIT] Dataset directory writable: {os.access(DATA_FILE.parent, os.W_OK)}")
except Exception as e:
    print(f"[ERROR] Failed to create data directory: {str(e)}")


def save_report(report_dict: dict):
    """Append raw report to dataset.jsonl (build dataset dynamically)."""
    try:
        # Ensure directory exists
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        # Get absolute path for logging
        abs_path = DATA_FILE.absolute()
        
        # Clean report_dict - remove non-serializable data
        clean_report = {}
        for key, value in report_dict.items():
            # Skip image_bytes (can't serialize bytes to JSON)
            if key == "image_bytes":
                continue
            # Convert any other non-serializable types
            try:
                json.dumps(value)  # Test if serializable
                clean_report[key] = value
            except (TypeError, ValueError):
                # If not serializable, convert to string representation
                clean_report[key] = str(value)
                print(f"[WARNING] Converted non-serializable value for key '{key}' to string")
        
        # Write to file
        with DATA_FILE.open("a", encoding="utf8") as f:
            json_str = json.dumps(clean_report, ensure_ascii=False)
            f.write(json_str + "\n")
            f.flush()  # Force write to disk
            os.fsync(f.fileno())  # Ensure data is written to disk
        
        # Verify file was written
        if DATA_FILE.exists():
            file_size = DATA_FILE.stat().st_size
            print(f"[DEBUG] Report saved to dataset: {clean_report.get('report_id', 'unknown')}")
            print(f"[DEBUG] Dataset file: {abs_path} (size: {file_size} bytes)")
            print(f"[DEBUG] Report status: {clean_report.get('status', 'unknown')}, accept: {clean_report.get('accept', 'unknown')}")
        else:
            print(f"[ERROR] Dataset file does not exist after write: {abs_path}")
        
    except PermissionError as e:
        print(f"[ERROR] Permission denied writing to dataset file: {str(e)}")
        print(f"[ERROR] File path: {DATA_FILE.absolute()}")
        print(f"[ERROR] Directory writable: {os.access(DATA_FILE.parent, os.W_OK)}")
        raise
    except Exception as e:
        print(f"[ERROR] Failed to save report to dataset: {str(e)}")
        print(f"[ERROR] File path: {DATA_FILE.absolute()}")
        print(f"[ERROR] Report data keys: {list(report_dict.keys())}")
        print(f"[ERROR] Report ID: {report_dict.get('report_id', 'unknown')}")
        import traceback
        print(traceback.format_exc())
        raise
