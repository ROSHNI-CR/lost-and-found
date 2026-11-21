import pytest
from app.services.similarity_service import (
    calculate_category_similarity,
    calculate_color_similarity,
    calculate_brand_similarity,
    calculate_temporal_similarity,
    compute_overall_match
)
from app.utils.location_normalization import calculate_location_similarity, normalize_location_name

def test_category_similarity():
    # Exact match
    assert calculate_category_similarity("Electronics", "Electronics") == 1.0
    assert calculate_category_similarity("bottles", "bottles") == 1.0
    
    # Hierarchy/Synonym match: flask and water bottle both in bottles
    assert calculate_category_similarity("water bottle", "flask") == 0.75
    assert calculate_category_similarity("laptop", "electronics") == 0.75
    
    # Distinct categories
    assert calculate_category_similarity("bottles", "clothing") == 0.0

def test_color_similarity():
    # Identical color
    score, has_ev = calculate_color_similarity("black", "black")
    assert has_ev is True
    assert score == 1.0

    # Overlapping multiple colors
    score, has_ev = calculate_color_similarity(["black", "silver"], "black")
    assert has_ev is True
    assert 0.0 < score <= 1.0

    # Missing evidence
    score, has_ev = calculate_color_similarity(None, "blue")
    assert has_ev is False
    assert score == 0.5

def test_brand_similarity():
    # Exact match
    score, has_ev = calculate_brand_similarity("Apple", "apple")
    assert has_ev is True
    assert score == 1.0

    # Substring match (e.g., Apple MacBook vs Apple)
    score, has_ev = calculate_brand_similarity("Apple MacBook", "Apple")
    assert has_ev is True
    assert score >= 0.8

    # Missing / None
    score, has_ev = calculate_brand_similarity(None, "Milton")
    assert has_ev is False
    assert score == 0.5

def test_location_normalization():
    # Synonym resolution: 'main library' and 'central library' map to same canonical location
    sim = calculate_location_similarity("main library", "central library")
    assert sim == 1.0

    # Same zone (e.g. academic zone vs north campus)
    sim_zone = calculate_location_similarity("library 2nd floor", "library reading room")
    assert sim_zone >= 0.8

def test_temporal_proximity():
    # Same day
    score, has_ev = calculate_temporal_similarity("2026-11-20", "2026-11-20")
    assert has_ev is True
    assert score == 1.0

    # 2 days later (decay applies)
    score_2d, _ = calculate_temporal_similarity("2026-11-18", "2026-11-20")
    assert 0.5 < score_2d < 1.0

    # 30 days later (significant decay)
    score_30d, _ = calculate_temporal_similarity("2026-10-20", "2026-11-20")
    assert score_30d < 0.2

def test_overall_match_formula():
    """
    Test complete weighted formula:
    Final Score = 0.30*Semantic + 0.20*Category + 0.15*Color + 0.10*Brand + 0.15*Location + 0.10*Temporal
    """
    lost_item = {
        "title": "Black Milton Water Bottle",
        "category": "Bottles",
        "color": "black",
        "brand": "Milton",
        "location_lost": "Central Library",
        "approximate_date_lost": "2026-11-19"
    }
    
    found_item = {
        "title": "Dark Flask",
        "category": "Bottles",
        "color": "black",
        "brand": "Milton",
        "location_found": "Main Library",
        "date_found": "2026-11-20"
    }

    result = compute_overall_match(lost_item, found_item, semantic_similarity=0.88)
    assert result["final_score"] >= 80.0
    assert result["match_status"] == "high_potential"
    assert result["semantic_score"] == 0.88
    assert result["category_score"] == 1.0
    assert result["color_score"] == 1.0
    assert result["brand_score"] == 1.0
    assert result["location_score"] == 1.0
