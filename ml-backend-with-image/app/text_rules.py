def normalize(text: str) -> str:
    return text.lower().strip()


ABUSIVE_WORDS = [
    "fuck", "shit", "bitch", "asshole", "idiot", "bastard"
]


CATEGORY_KEYWORDS = {
    "Road & Traffic": [
        "pothole", "road", "traffic", "accident",
        "signal", "junction", "speed breaker", "footpath"
    ],
    "Garbage & Sanitation": [
        "garbage", "trash", "waste", "dirty",
        "dustbin", "sanitation", "sewage"
    ],
    "Water & Drainage": [
        "water", "leak", "pipe", "drain",
        "drainage", "flood"
    ],
    "Electricity": [
        "electric", "power", "wire", "pole",
        "outage", "transformer"
    ],
    "Street Lighting": [
        "streetlight", "street light", "lamp",
        "light", "dark"
    ],
    "Public Safety": [
        "fire", "collapse", "crime", "hazard", "gas"
    ],
    "Parks & Recreation": [
        "park", "bench", "playground", "garden",
        "tree", "lawn", "maintenance"
    ]
}


URGENCY_KEYWORDS = {
    "high": [
        "fire", "accident", "collapse",
        "electrocution", "gas leak"
    ],
    "medium": [
        "broken", "leak", "overflow",
        "not working", "damaged"
    ]
}


def is_abusive(description: str) -> bool:
    text = normalize(description)
    return any(word in text for word in ABUSIVE_WORDS)


def detect_category(description: str) -> str:
    text = normalize(description)
    best_category = "Other"
    max_score = 0

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > max_score:
            max_score = score
            best_category = category

    return best_category


def detect_urgency(description: str) -> str:
    text = normalize(description)

    for kw in URGENCY_KEYWORDS["high"]:
        if kw in text:
            return "high"

    for kw in URGENCY_KEYWORDS["medium"]:
        if kw in text:
            return "medium"

    return "low"

