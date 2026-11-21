import re
from typing import List, Dict, Any

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "what",
    "which", "this", "that", "these", "those", "then", "just", "so", "than",
    "such", "both", "through", "about", "for", "is", "of", "while", "during",
    "to", "from", "in", "out", "on", "off", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only",
    "own", "same", "so", "than", "too", "very", "can", "will", "just", "should", "now"
}

def normalize_text(text: str) -> str:
    """Lowercase, strip special characters, and normalize spaces."""
    if not text:
        return ""
    # Replace non-alphanumeric (except hyphens) with space
    text = re.sub(r'[^a-zA-Z0-9\-\s]', ' ', text.lower())
    # Collapse consecutive spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_keywords(text: str) -> List[str]:
    """Tokenize and filter out short terms and common stopwords."""
    normalized = normalize_text(text)
    tokens = normalized.split()
    return [t for t in tokens if len(t) > 2 and t not in STOPWORDS]

def build_searchable_representation(item: Dict[str, Any]) -> str:
    """
    Construct a dense semantic text representation from both user-submitted
    and AI-extracted attributes for Sentence Transformers embedding.
    """
    parts = []
    
    title = item.get("title", "")
    if title:
        parts.append(f"Item: {title}")
        
    category = item.get("category", "")
    if category:
        parts.append(f"Category: {category}")
        
    brand = item.get("brand", "")
    if brand and brand.lower() not in ["none", "unknown", "n/a"]:
        parts.append(f"Brand: {brand}")
        
    color = item.get("color", "")
    if isinstance(color, list):
        color_str = ", ".join(color)
    else:
        color_str = str(color or "")
    if color_str:
        parts.append(f"Color: {color_str}")
        
    location = item.get("location_lost") or item.get("location_found") or ""
    if location:
        parts.append(f"Location: {location}")
        
    identifying_features = item.get("identifying_features", "")
    if identifying_features:
        parts.append(f"Features: {identifying_features}")
        
    description = item.get("description", "")
    if description:
        parts.append(f"Description: {description}")
        
    ai_description = item.get("ai_generated_description", "")
    if ai_description and ai_description != description:
        parts.append(f"AI Details: {ai_description}")

    return " | ".join(parts)
