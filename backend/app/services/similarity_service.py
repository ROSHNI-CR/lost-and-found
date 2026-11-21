import math
from datetime import datetime
from typing import List, Union, Optional, Tuple, Dict, Any
from app.utils.location_normalization import calculate_location_similarity
from app.core.config import settings

# Category synonym and parent-child hierarchy
CATEGORY_RELATIONS = {
    "electronics": ["laptop", "phone", "tablet", "charger", "headphones", "earbuds", "smartwatch", "calculator"],
    "accessories": ["wallet", "watch", "glasses", "sunglasses", "belt", "ring", "chain", "bracelet", "keys"],
    "bags": ["backpack", "handbag", "purse", "duffel", "tote bag", "laptop bag", "pouch"],
    "bottles": ["water bottle", "flask", "thermos", "tumbler", "sipper", "bottle"],
    "stationery": ["notebook", "book", "pencil case", "pen", "folder", "id card", "binder"],
    "clothing": ["jacket", "hoodie", "sweater", "cap", "hat", "scarf", "umbrella", "coat"]
}

def parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parse various date string formats."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str[:10], fmt[:8] if len(fmt) == 8 else fmt)
        except ValueError:
            continue
    return None

def normalize_color_input(color: Union[str, List[str], None]) -> set:
    """Normalize color field into a set of lowercased color strings."""
    if not color:
        return set()
    if isinstance(color, list):
        return {c.strip().lower() for c in color if c.strip()}
    parts = [c.strip().lower() for c in color.replace(",", " ").split() if c.strip()]
    return set(parts)

def calculate_category_similarity(cat1: Optional[str], cat2: Optional[str]) -> float:
    """Compute category similarity (1.0 = exact, 0.7 = same parent family, 0.0 = mismatch)."""
    if not cat1 or not cat2:
        return 0.5
    c1, c2 = cat1.strip().lower(), cat2.strip().lower()
    if c1 == c2:
        return 1.0

    for parent, children in CATEGORY_RELATIONS.items():
        in_c1 = (c1 == parent or c1 in children)
        in_c2 = (c2 == parent or c2 in children)
        if in_c1 and in_c2:
            return 0.75

    return 0.0

def calculate_color_similarity(color1: Union[str, List[str], None], color2: Union[str, List[str], None]) -> Tuple[float, bool]:
    """Compute Jaccard similarity for colors. Returns (score, has_evidence)."""
    set1 = normalize_color_input(color1)
    set2 = normalize_color_input(color2)
    if not set1 or not set2:
        return 0.5, False  # Missing evidence

    intersection = set1.intersection(set2)
    union = set1.union(set2)
    score = len(intersection) / len(union) if union else 0.5
    return score, True

def calculate_brand_similarity(brand1: Optional[str], brand2: Optional[str]) -> Tuple[float, bool]:
    """Compute brand similarity. Returns (score, has_evidence)."""
    if not brand1 or not brand2:
        return 0.5, False
    b1, b2 = brand1.strip().lower(), brand2.strip().lower()
    if b1 in ("none", "unknown", "n/a", "") or b2 in ("none", "unknown", "n/a", ""):
        return 0.5, False
    if b1 == b2:
        return 1.0, True
    if b1 in b2 or b2 in b1:
        return 0.8, True
    return 0.0, True

def calculate_temporal_similarity(date_lost_str: Optional[str], date_found_str: Optional[str]) -> Tuple[float, bool]:
    """Compute temporal proximity with exponential decay. Returns (score, has_evidence)."""
    dt_lost = parse_date(date_lost_str)
    dt_found = parse_date(date_found_str)
    if not dt_lost or not dt_found:
        return 0.5, False

    diff_days = (dt_found - dt_lost).total_seconds() / 86400.0

    # A found item could be found same day or after losing it.
    # Allow 2-day margin of error for reporting date approximations.
    if diff_days < -3.0:
        return 0.1, True  # Found significantly before reported lost date

    abs_diff = max(0.0, diff_days)
    # Exponential decay with 7-day half parameter
    score = math.exp(-abs_diff / 7.0)
    return max(0.05, min(1.0, score)), True

def compute_overall_match(
    lost_item: Dict[str, Any],
    found_item: Dict[str, Any],
    semantic_similarity: float
) -> Dict[str, Any]:
    """
    Executes the multi-attribute matching formula with fair evidence normalization:
    Final Score = (sum(w_i * S_i) / sum(w_i)) * 100
    """
    # 1. Semantic score
    s_sem = max(0.0, min(1.0, semantic_similarity))
    
    # 2. Category score
    s_cat = calculate_category_similarity(
        lost_item.get("category"),
        found_item.get("category")
    )
    
    # 3. Color score
    s_col, has_col = calculate_color_similarity(
        lost_item.get("color"),
        found_item.get("color")
    )
    
    # 4. Brand score
    s_brd, has_brd = calculate_brand_similarity(
        lost_item.get("brand"),
        found_item.get("brand")
    )
    
    # 5. Location score
    loc_lost = lost_item.get("location_lost", "")
    loc_found = found_item.get("location_found", "")
    s_loc = calculate_location_similarity(loc_lost, loc_found)
    has_loc = bool(loc_lost and loc_found)
    
    # 6. Temporal score
    d_lost = lost_item.get("approximate_date_lost")
    d_found = found_item.get("date_found")
    s_tmp, has_tmp = calculate_temporal_similarity(d_lost, d_found)

    # Weighted Normalization over available evidence
    weights = [
        (settings.WEIGHT_SEMANTIC, s_sem, True),
        (settings.WEIGHT_CATEGORY, s_cat, True),
        (settings.WEIGHT_COLOR, s_col, has_col),
        (settings.WEIGHT_BRAND, s_brd, has_brd),
        (settings.WEIGHT_LOCATION, s_loc, has_loc),
        (settings.WEIGHT_TEMPORAL, s_tmp, has_tmp),
    ]

    weighted_sum = 0.0
    total_weight = 0.0

    for w, score, is_available in weights:
        if is_available:
            weighted_sum += w * score
            total_weight += w
        else:
            # Neutral evidence weight allocation
            weighted_sum += w * 0.5
            total_weight += w

    final_score = (weighted_sum / total_weight) * 100.0 if total_weight > 0 else 0.0
    final_score = round(final_score, 1)

    # Classification
    if final_score >= settings.MATCH_THRESHOLD_HIGH:
        match_status = "high_potential"
    elif final_score >= settings.MATCH_THRESHOLD_POSSIBLE:
        match_status = "possible_match"
    else:
        match_status = "low_confidence"

    return {
        "semantic_score": round(s_sem, 3),
        "category_score": round(s_cat, 3),
        "color_score": round(s_col, 3),
        "brand_score": round(s_brd, 3),
        "location_score": round(s_loc, 3),
        "temporal_score": round(s_tmp, 3),
        "final_score": final_score,
        "match_status": match_status
    }
