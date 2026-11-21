import logging
from typing import List, Dict, Any, Optional
from bson import ObjectId
from app.database.connection import get_database
from app.services.gemini_service import gemini_service
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store
from app.utils.response_helpers import serialize_docs
from app.core.config import settings

logger = logging.getLogger("findit.chatbot")

SYSTEM_PROMPT = """
You are the official 'HITK FindIt Assistant', the intelligent conversational AI for Heritage Institute of Technology, Kolkata (HITK).
Your mission is to help HITK students, faculty members, and campus staff find lost items, navigate campus locations (Central Block, ICT Block, CME Block, Central Library, Main Canteen, Nescafe Kiosk, Gate 1 Security Desk), understand how to file reports, and guide them through ownership verification.

CAMPUS CONTEXT:
- Institution: Heritage Institute of Technology, Kolkata (HITK), Anandapur, Kolkata - 700107
- Main Handover / Recovery Desk: Campus Security Office at Gate 1 (near Main Entrance)
- Key Campus Blocks: Central Block (CB), ICT Block (CSE/IT), CME Block (ME/CE/ChE), Central Library (Swami Vivekananda Block), Main Canteen, Nescafe Kiosk, Amphitheatre, Sports Ground.

IMPORTANT SAFETY & PRIVACY RULES:
1. NEVER reveal private user details such as emails, phone numbers, or private verification answers.
2. Only reference items that are explicitly provided in the retrieved campus context.
3. If no matching reports exist in the retrieved context, explicitly state: "I searched our HITK campus records but could not find an active report matching that description. I encourage you to report it via the 'Report Lost Item' form."
4. Never invent or hallucinate lost or found items.
5. Provide actionable guidance: explain how to report lost items, report found items, or submit ownership claims, and suggest visiting Gate 1 Security Desk for physical claim handovers.
6. Keep answers friendly, concise, and helpful.
"""

class ChatbotService:
    @staticmethod
    async def chat(
        message: str,
        user_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Retrieval-grounded conversational assistant:
        1. Interpret user query intent
        2. Vector & database retrieval of active items
        3. Grounded Gemini synthesis
        4. Return response with sanitized item cards
        """
        db = get_database()

        # 1. Interpret user query
        interpretation = await gemini_service.interpret_search_query(message)
        
        # 2. Retrieve relevant items from vector index and MongoDB
        query_vec = embedding_service.generate_embedding(message)
        
        # Search both found items and lost items in vector store
        found_matches = vector_store.search(query_vec, "found", top_k=5)
        lost_matches = vector_store.search(query_vec, "lost", top_k=5)

        retrieved_items = []
        
        # Retrieve found items
        for m_id, score in found_matches:
            if score >= 0.45:
                doc = await db.found_items.find_one({"_id": ObjectId(m_id), "status": {"$in": ["available", "potential_match"]}})
                if doc:
                    doc["relevance_score"] = round(score * 100, 1)
                    doc["type"] = "found"
                    retrieved_items.append(doc)

        # Retrieve lost items
        for m_id, score in lost_matches:
            if score >= 0.45:
                doc = await db.lost_items.find_one({"_id": ObjectId(m_id), "status": {"$in": ["active", "potential_match"]}})
                if doc:
                    doc["relevance_score"] = round(score * 100, 1)
                    doc["type"] = "lost"
                    retrieved_items.append(doc)

        # Sort by relevance
        retrieved_items.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        top_items = retrieved_items[:4]

        # 3. Sanitize items before passing to LLM (NO PRIVATE INFO)
        context_snippets = []
        sanitized_cards = []
        for it in top_items:
            card = {
                "id": str(it["_id"]),
                "type": it.get("type", "item"),
                "title": it.get("title"),
                "category": it.get("category"),
                "color": it.get("color"),
                "location": it.get("location_found") or it.get("location_lost"),
                "date": it.get("date_found") or it.get("approximate_date_lost"),
                "status": it.get("status"),
                "image_urls": it.get("image_urls", [])[:1]
            }
            sanitized_cards.append(card)
            context_snippets.append(
                f"- [{it.get('type').upper()}] {it.get('title')} ({it.get('category')}, {it.get('color')}) "
                f"Location: {it.get('location_found') or it.get('location_lost')} | Date: {it.get('date_found') or it.get('approximate_date_lost')} | ID: {str(it['_id'])}"
            )

        context_text = "\n".join(context_snippets) if context_snippets else "No matching items currently recorded."

        # 4. Generate grounded reply with Gemini
        gemini_service._ensure_configured()
        if gemini_service.is_available():
            try:
                import google.generativeai as genai
                model = genai.GenerativeModel(
                    settings.GEMINI_MODEL,
                    system_instruction=SYSTEM_PROMPT
                )
                
                chat_prompt = (
                    f"Campus Database Search Results:\n{context_text}\n\n"
                    f"Student Query: \"{message}\"\n\n"
                    "Respond to the student using only the factual database results above. "
                    "If relevant items were found, summarize them concisely and let them know they can click the item cards below to view details or submit a claim."
                )
                
                resp = model.generate_content(chat_prompt)
                reply_text = resp.text.strip()
            except Exception as e:
                logger.error(f"Gemini chat failed: {e}")
                reply_text = ChatbotService._rule_based_reply(message, sanitized_cards)
        else:
            reply_text = ChatbotService._rule_based_reply(message, sanitized_cards)

        # 5. Determine suggested follow-up actions
        suggested_actions = [
            "Report a Lost Item",
            "Browse Found Listings",
            "How do I submit a claim?"
        ]
        if sanitized_cards:
            suggested_actions.insert(0, f"View details for {sanitized_cards[0]['title']}")

        return {
            "reply": reply_text,
            "suggested_actions": suggested_actions,
            "relevant_items": sanitized_cards
        }

    @staticmethod
    def _rule_based_reply(message: str, items: List[Dict[str, Any]]) -> str:
        q = message.lower()
        if items:
            item_list = ", ".join([f"'{it['title']}' ({it['location']})" for it in items])
            return (
                f"I checked our campus database and found {len(items)} potentially relevant report(s): {item_list}. "
                "Please review the item cards below. If one of these belongs to you, you can submit an ownership claim."
            )
        
        if "claim" in q:
            return (
                "To claim an item, click on any found item card in the marketplace or from your potential matches list, "
                "and select 'Claim Item'. You will need to describe unique identifying features for campus admin verification."
            )
            
        if "lost" in q:
            return (
                "I didn't find an existing match in our records. Please click 'Report Lost Item' from the top navigation to file a report. "
                "Our AI matching engine will automatically monitor newly reported found items and alert you immediately!"
            )

        return (
            "I searched our active campus records but could not find a matching report. "
            "You can submit a new report using the navigation buttons above, or browse the complete lost & found marketplace."
        )

chatbot_service = ChatbotService()
