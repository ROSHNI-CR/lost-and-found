import re
from typing import Dict, List, Tuple

# Canonical campus location taxonomy mapping for Heritage Institute of Technology, Kolkata (HITK)
CANONICAL_LOCATIONS: Dict[str, List[str]] = {
    "CENTRAL_BLOCK": [
        "central block", "cb", "main building", "cb 1st floor", "cb 2nd floor",
        "cb 3rd floor", "cb 4th floor", "cb ground floor", "cb-101", "cb-201",
        "central block seminar hall", "cb office"
    ],
    "ICT_BLOCK": [
        "ict block", "ict", "information technology block", "cse department",
        "it department", "ict lab", "ict-101", "ict-201", "computer lab",
        "cs lab", "it lab", "data center", "server room", "programming lab"
    ],
    "CME_BLOCK": [
        "cme block", "cme", "civil block", "mechanical block", "chemical block",
        "mechanical workshop", "cme lab", "drawing hall", "workshop"
    ],
    "LIBRARY": [
        "library", "central library", "main library", "reading room", 
        "digital library", "reference section", "stack room", "study hall",
        "swami vivekananda block", "sv block", "heritage library"
    ],
    "CAFETERIA": [
        "cafeteria", "canteen", "food court", "mess", "snack bar", 
        "cafe", "nescafe", "nescafe kiosk", "amul kiosk", "main canteen",
        "heritage canteen", "dining hall", "coffee shop"
    ],
    "AUDITORIUM": [
        "auditorium", "convocation hall", "seminar hall", "main stage", 
        "amphitheatre", "open air theatre", "oat", "assembly hall",
        "swami vivekananda auditorium"
    ],
    "SPORTS_COMPLEX": [
        "sports complex", "gymnasium", "gym", "football ground", 
        "basketball court", "badminton court", "cricket ground", 
        "tennis court", "heritage ground", "volleyball court"
    ],
    "ADMIN_BUILDING": [
        "admin block", "administrative block", "registrar", "dean office", 
        "principal office", "accounts section", "examination cell",
        "gate 1", "gate 2", "security desk", "campus security office", "reception"
    ],
    "HOSTEL": [
        "hostel", "boys hostel", "girls hostel", "dorm", "dormitory", 
        "heritage hostel", "hall of residence"
    ],
    "PARKING": [
        "parking", "bike stand", "car parking", "cycle stand", "gate 1 parking"
    ]
}

# Campus adjacency graph / relative proximity between canonical zones (0.0 to 1.0)
LOCATION_PROXIMITY_MATRIX: Dict[Tuple[str, str], float] = {
    ("CENTRAL_BLOCK", "ICT_BLOCK"): 0.85,
    ("CENTRAL_BLOCK", "CME_BLOCK"): 0.80,
    ("CENTRAL_BLOCK", "LIBRARY"): 0.85,
    ("ICT_BLOCK", "LIBRARY"): 0.80,
    ("ICT_BLOCK", "CME_BLOCK"): 0.75,
    ("CAFETERIA", "AUDITORIUM"): 0.80,
    ("CAFETERIA", "CENTRAL_BLOCK"): 0.75,
    ("CAFETERIA", "SPORTS_COMPLEX"): 0.70,
    ("HOSTEL", "SPORTS_COMPLEX"): 0.75,
    ("HOSTEL", "CAFETERIA"): 0.70,
    ("ADMIN_BUILDING", "CENTRAL_BLOCK"): 0.85,
    ("ADMIN_BUILDING", "LIBRARY"): 0.75,
}

def normalize_location_name(location_str: str) -> str:
    """Normalize input location string and return canonical location key, or uppercase cleaned string."""
    if not location_str:
        return "UNKNOWN"
    
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', location_str.lower()).strip()
    
    # Check for direct or substring matches with canonical aliases
    for canonical, aliases in CANONICAL_LOCATIONS.items():
        for alias in aliases:
            if alias in cleaned or cleaned in alias:
                return canonical
                
    return cleaned.upper()

def calculate_location_similarity(loc1: str, loc2: str) -> float:
    """
    Calculate similarity score between two locations:
    1.0: Exact canonical match
    0.5 - 0.85: Known adjacent campus zones
    0.0: Unrelated distant zones
    """
    if not loc1 or not loc2:
        return 0.5  # Neutral fallback for missing location evidence
        
    canon1 = normalize_location_name(loc1)
    canon2 = normalize_location_name(loc2)
    
    if canon1 == "UNKNOWN" or canon2 == "UNKNOWN":
        return 0.5
        
    if canon1 == canon2:
        return 1.0
        
    # Check proximity matrix
    key1 = (canon1, canon2)
    key2 = (canon2, canon1)
    if key1 in LOCATION_PROXIMITY_MATRIX:
        return LOCATION_PROXIMITY_MATRIX[key1]
    if key2 in LOCATION_PROXIMITY_MATRIX:
        return LOCATION_PROXIMITY_MATRIX[key2]
        
    return 0.2  # Baseline campus proximity
