import json
import logging
import re
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.schemas.item import AIExtractedAttributes
from app.schemas.chatbot import QueryInterpretation

logger = logging.getLogger("findit.gemini")

class GeminiService:
    def __init__(self):
        self._configured = False
        self._client = None

    def _ensure_configured(self):
        if not self._configured and settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")
                self._configured = True
                logger.info("Gemini API client configured successfully.")
            except Exception as e:
                logger.error(f"Failed to configure Gemini API: {e}")

    def is_available(self) -> bool:
        return bool(settings.GEMINI_API_KEY)

    async def analyze_image_and_extract(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        user_notes: Optional[str] = None
    ) -> AIExtractedAttributes:
        """
        Multimodal analysis: inspects item photograph and extracts structured attributes.
        Validates output with Pydantic model. Gracefully falls back on failure.
        """
        self._ensure_configured()
        
        if not self.is_available():
            logger.info("Gemini API key not configured; using rule-based attribute extraction fallback.")
            return self._fallback_extraction(user_notes)

        prompt = (
            "You are an expert lost-and-found AI analyst for a college campus. "
            "Analyze this uploaded photograph of a lost/found item along with any user notes.\n"
            f"User notes: '{user_notes or 'None provided'}'.\n\n"
            "Identify the physical object accurately. Return ONLY a valid JSON object with these exact keys:\n"
            "{\n"
            '  "object_name": "string (concise name, e.g. Water Bottle, Scientific Calculator)",\n'
            '  "category": "string (e.g. Electronics, Bags, Bottles, Accessories, Clothing, Stationery)",\n'
            '  "color": ["string (e.g. black, silver)"],\n'
            '  "brand": "string (brand ONLY if clearly visible, otherwise null)",\n'
            '  "visible_features": ["string (prominent visual traits, stickers, scratches, materials)"],\n'
            '  "estimated_object_type": "string (e.g. Insulated reusable bottle)",\n'
            '  "confidence": float (between 0.0 and 1.0),\n'
            '  "description": "string (detailed, objective paragraph describing the item)"\n'
            "}\n"
            "Rule: Do NOT invent serial numbers or unverified brand names. Return raw JSON with no markdown formatting."
        )

        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            
            image_part = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            
            response = model.generate_content([prompt, image_part])
            cleaned_json = self._extract_json_string(response.text)
            parsed = json.loads(cleaned_json)
            
            # Validate through Pydantic
            return AIExtractedAttributes(**parsed)
        except Exception as e:
            logger.error(f"Gemini image analysis failed: {e}. Utilizing fallback extractor.")
            return self._fallback_extraction(user_notes)

    async def generate_item_description(
        self,
        title: str,
        category: str,
        color: Any,
        features: Optional[str] = None,
        notes: Optional[str] = None
    ) -> str:
        """Generate a clean, standardized, comprehensive item description."""
        self._ensure_configured()
        if not self.is_available():
            color_str = ", ".join(color) if isinstance(color, list) else str(color or "")
            return f"A {color_str} {title} belonging to category {category}. {features or ''} {notes or ''}".strip()

        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            prompt = (
                f"Generate a clear, objective 2-sentence description for a campus lost-and-found report:\n"
                f"Item: {title}\nCategory: {category}\nColor: {color}\nFeatures: {features or 'None'}\nNotes: {notes or 'None'}"
            )
            res = model.generate_content(prompt)
            return res.text.strip()
        except Exception as e:
            logger.warning(f"Gemini description generation fallback: {e}")
            return f"{color} {title} ({category}). {features or ''}".strip()

    async def generate_match_explanation(
        self,
        lost_title: str,
        lost_desc: str,
        lost_loc: str,
        found_title: str,
        found_desc: str,
        found_loc: str,
        score: float
    ) -> str:
        """Generate an explainable AI justification grounded strictly in reported attributes."""
        self._ensure_configured()
        default_explanation = (
            f"Potential match identified with a score of {score}%. "
            f"The lost item '{lost_title}' (at {lost_loc}) aligns closely in type, attributes, "
            f"and reported campus location with found item '{found_title}' (at {found_loc})."
        )
        
        if not self.is_available():
            return default_explanation

        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            prompt = (
                "You are an objective campus lost & found verification assistant. "
                "Write a concise, 2-sentence explanation of why these two reports potentially match.\n"
                f"Lost Item: {lost_title} | Description: {lost_desc} | Location: {lost_loc}\n"
                f"Found Item: {found_title} | Description: {found_desc} | Location: {found_loc}\n"
                f"Match Score: {score}%\n"
                "Ground your explanation strictly on the facts provided above. Do not hallucinate."
            )
            res = model.generate_content(prompt)
            return res.text.strip()
        except Exception as e:
            logger.warning(f"Gemini match explanation fallback: {e}")
            return default_explanation

    async def interpret_search_query(self, query: str) -> QueryInterpretation:
        """Parse natural language query into structured filters."""
        self._ensure_configured()
        
        if not self.is_available():
            return self._fallback_query_interpretation(query)

        prompt = (
            "Extract structured lost-and-found search filters from this user query:\n"
            f"Query: \"{query}\"\n\n"
            "Return ONLY raw JSON with keys:\n"
            "{\n"
            '  "category": "string or null",\n'
            '  "color": "string or null",\n'
            '  "brand": "string or null",\n'
            '  "location": "string or null",\n'
            '  "date_range": "string or null",\n'
            '  "keywords": ["keyword1", "keyword2"],\n'
            '  "item_type": "lost or found or null"\n'
            "}"
        )

        try:
            import google.generativeai as genai
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            res = model.generate_content(prompt)
            data = json.loads(self._extract_json_string(res.text))
            return QueryInterpretation(**data)
        except Exception as e:
            logger.warning(f"Gemini query interpretation error: {e}")
            return self._fallback_query_interpretation(query)

    def _extract_json_string(self, text: str) -> str:
        """Extract JSON substring from potentially markdown-wrapped model output."""
        text = text.strip()
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if match:
            return match.group(1).strip()
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            return text[start:end+1]
        return text

    def _fallback_extraction(self, user_notes: Optional[str]) -> AIExtractedAttributes:
        """Deterministic fallback when Gemini is offline or unconfigured."""
        notes = (user_notes or "").lower()
        
        detected_cat = "Accessories"
        for cat in ["electronics", "bags", "bottles", "accessories", "clothing", "stationery"]:
            if cat in notes:
                detected_cat = cat.capitalize()
                break

        detected_colors = []
        for color in ["black", "blue", "red", "green", "silver", "white", "grey", "gray", "brown", "gold"]:
            if color in notes:
                detected_colors.append(color)

        return AIExtractedAttributes(
            object_name="Campus Belonging",
            category=detected_cat,
            color=detected_colors or ["unspecified"],
            brand=None,
            visible_features=["Clean item in standard condition"],
            estimated_object_type=detected_cat,
            confidence=0.5,
            description=user_notes or "Item submitted on campus."
        )

    def _fallback_query_interpretation(self, query: str) -> QueryInterpretation:
        q = query.lower()
        cat = None
        for c in ["electronics", "bottle", "bag", "wallet", "calculator", "phone", "keys", "umbrella"]:
            if c in q:
                cat = c.capitalize()
                break
        color = None
        for clr in ["black", "blue", "red", "silver", "white", "green"]:
            if clr in q:
                color = clr
                break
        loc = None
        for l in ["library", "canteen", "cafeteria", "lab", "auditorium", "gym", "hostel"]:
            if l in q:
                loc = l.capitalize()
                break

        return QueryInterpretation(
            category=cat,
            color=color,
            brand=None,
            location=loc,
            date_range=None,
            keywords=[w for w in q.split() if len(w) > 3],
            item_type="found" if "found" in q else ("lost" if "lost" in q else None)
        )

gemini_service = GeminiService()
