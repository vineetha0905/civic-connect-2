# Lightweight CLIP-based image classifier with safe fallbacks.
from PIL import Image
import requests
import io
import threading

_clip_lock = threading.Lock()
_clip_model = None
_clip_processor = None
_available = False

def initialize_clip():
    global _clip_model, _clip_processor, _available
    try:
        from transformers import CLIPProcessor, CLIPModel
        _clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        _available = True
    except Exception as e:
        # Failed to load CLIP (no internet or packages). Continue with fallback.
        _available = False

def classify_image(image_url: str, candidate_labels=None) -> str:
    """Return best matching label from candidate_labels or 'other' on failure.
    CLIP model is loaded lazily (on first use) to save memory.
    DEPRECATED: Use classify_image_from_bytes instead.
    """
    # Lazy load CLIP model if not already loaded
    global _clip_model, _clip_processor, _available
    if not _available and _clip_model is None:
        with _clip_lock:
            if not _available and _clip_model is None:
                initialize_clip()
    
    if candidate_labels is None:
        candidate_labels = [
     "road", "pothole", "crack", "broken road", "damaged road",
        "road caved", "road sinking", "uneven road",
        "traffic", "traffic jam", "congestion",
        "signal", "traffic signal", "junction", "crossroad",
        "accident", "collision", "crash", "hit",
        "speed breaker", "speed bump", "divider",
        "footpath", "sidewalk", "zebra crossing", "pedestrian",

        "garbage", "trash", "waste", "dump", "dumping",
        "garbage pile", "waste pile",
        "dirty", "filthy", "unclean",
        "bad smell", "toxic smell", "foul smell",
        "dustbin", "overflowing bin",
        "sanitation", "sewage", "sewer", "manhole",

        # DEAD ANIMAL (strict & safe)
        "dead", "dead animal", "animal carcass",
        "dead dog", "dead cat", "dead cow",
        "dead body",

        "mosquito", "flies", "infection", "disease",

        "water", "no water", "low pressure",
        "drinking water", "contaminated water",
        "leak", "leakage", "pipe leak",
        "pipe burst", "broken pipe",
        "drain", "drainage", "blocked drain",
        "overflow", "overflowing drain",
        "flood", "waterlogging", "stagnant water",
        "sewage water", "rain water",

        "electricity", "electric", "power",
        "no power", "power cut", "power outage",
        "wire", "cable", "pole", "electric pole",
        "transformer", "meter",
        "short circuit", "spark",
        "electrocution", "electric shock",
        "live wire",

        "streetlight", "street light", "lamp",
        "lamp post", "pole light",
        "not working", "broken light",
        "flickering", "dim light",
        "dark", "dark area", "no lighting",

         "fire", "smoke", "burning",
        "gas", "gas leak", "cylinder leak",
        "collapse", "building collapse",
        "wall collapse", "roof falling",
        "crime", "theft", "robbery",
        "violence", "fight", "assault",
        "hazard", "danger", "unsafe",
        "emergency", "life risk",

        "park", "garden", "playground",
        "children park", "public park",
        "bench", "swing", "slide",
        "walking track",
        "tree", "fallen tree", "tree fallen",
        "lawn", "grass", "maintenance",
        "broken fence"
]


    if not image_url:
        return "other"

    # If CLIP not available, use heuristic keywords from URL
    if not _available:
        url = image_url.lower()
        for lbl in candidate_labels:
            if lbl in url:
                return lbl
        return "other"

    try:
        resp = requests.get(image_url, timeout=5)
        resp.raise_for_status()
        image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        inputs = _clip_processor(text=candidate_labels, images=image, return_tensors="pt", padding=True)
        outputs = _clip_model(**inputs)
        logits_per_image = outputs.logits_per_image  # shape (1, num_labels)
        probs = logits_per_image.softmax(dim=1)
        best = int(probs.argmax().item())
        return candidate_labels[best]
    except Exception:
        return "other"


def classify_image_from_bytes(image_bytes: bytes, candidate_labels=None) -> str:
    """Return best matching label from candidate_labels or 'other' on failure.
    Works with image bytes directly (no URL required).
    CLIP model is loaded lazily (on first use) to save memory.
    """
    # Lazy load CLIP model if not already loaded
    global _clip_model, _clip_processor, _available
    if not _available and _clip_model is None:
        with _clip_lock:
            if not _available and _clip_model is None:
                initialize_clip()
    
    if candidate_labels is None:
        candidate_labels = [
            "road", "pothole", "crack", "broken road", "damaged road",
            "road caved", "road sinking", "uneven road",
            "traffic", "traffic jam", "congestion",
            "signal", "traffic signal", "junction", "crossroad",
            "accident", "collision", "crash", "hit",
            "speed breaker", "speed bump", "divider",
            "footpath", "sidewalk", "zebra crossing", "pedestrian",
            "garbage", "trash", "waste", "dump", "dumping",
            "garbage pile", "waste pile",
            "dirty", "filthy", "unclean",
            "bad smell", "toxic smell", "foul smell",
            "dustbin", "overflowing bin",
            "sanitation", "sewage", "sewer", "manhole",
            "dead", "dead animal", "animal carcass",
            "dead dog", "dead cat", "dead cow",
            "dead body",
            "mosquito", "flies", "infection", "disease",
            "water", "no water", "low pressure",
            "drinking water", "contaminated water",
            "leak", "leakage", "pipe leak",
            "pipe burst", "broken pipe",
            "drain", "drainage", "blocked drain",
            "overflow", "overflowing drain",
            "flood", "waterlogging", "stagnant water",
            "sewage water", "rain water",
            "electricity", "electric", "power",
            "no power", "power cut", "power outage",
            "wire", "cable", "pole", "electric pole",
            "transformer", "meter",
            "short circuit", "spark",
            "electrocution", "electric shock",
            "live wire",
            "streetlight", "street light", "lamp",
            "lamp post", "pole light",
            "not working", "broken light",
            "flickering", "dim light",
            "dark", "dark area", "no lighting",
            "fire", "smoke", "burning",
            "gas", "gas leak", "cylinder leak",
            "collapse", "building collapse",
            "wall collapse", "roof falling",
            "crime", "theft", "robbery",
            "violence", "fight", "assault",
            "hazard", "danger", "unsafe",
            "emergency", "life risk",
            "park", "garden", "playground",
            "children park", "public park",
            "bench", "swing", "slide",
            "walking track",
            "tree", "fallen tree", "tree fallen",
            "lawn", "grass", "maintenance",
            "broken fence"
        ]

    if not image_bytes:
        return "other"

    # If CLIP not available, cannot classify from bytes (no URL to parse)
    if not _available:
        return "other"

    try:
        # Open image directly from bytes
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = _clip_processor(text=candidate_labels, images=image, return_tensors="pt", padding=True)
        outputs = _clip_model(**inputs)
        logits_per_image = outputs.logits_per_image  # shape (1, num_labels)
        probs = logits_per_image.softmax(dim=1)
        best = int(probs.argmax().item())
        return candidate_labels[best]
    except Exception as e:
        print(f"[ERROR] Image classification failed: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return "other"
