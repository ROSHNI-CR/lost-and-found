import logging
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from app.utils.text_preprocessing import build_searchable_representation

logger = logging.getLogger("findit.vector_store")

try:
    import faiss
    HAS_FAISS = True
    logger.info("FAISS vector engine successfully detected.")
except ImportError:
    HAS_FAISS = False
    logger.info("FAISS not installed; employing high-performance NumPy cosine inner-product vector engine.")

class DualVectorStore:
    """
    Dual vector similarity search engine for Lost items and Found items.
    Implements FAISS IndexIDMap / IndexFlatIP vector search with integer-to-MongoDB ID mapping,
    and a robust unit-normalized NumPy cosine fallback.
    """
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        
        # In-memory storage for vectors: item_type -> np.ndarray (N x dimension)
        self.vectors: Dict[str, np.ndarray] = {
            "lost": np.empty((0, dimension), dtype=np.float32),
            "found": np.empty((0, dimension), dtype=np.float32)
        }
        
        # ID Mappings: item_type -> list of mongodb_ids
        self.id_list: Dict[str, List[str]] = {
            "lost": [],
            "found": []
        }
        
        # Quick lookup: item_type -> {mongodb_id: row_index}
        self.id_to_idx: Dict[str, Dict[str, int]] = {
            "lost": {},
            "found": {}
        }

        # FAISS Indexes and integer ID tracking
        self.faiss_indices: Dict[str, Any] = {}
        self.int_to_mongo: Dict[str, Dict[int, str]] = {"lost": {}, "found": {}}
        self.mongo_to_int: Dict[str, Dict[str, int]] = {"lost": {}, "found": {}}
        self._next_int_id: Dict[str, int] = {"lost": 1, "found": 1}

        self._init_faiss()

    def _init_faiss(self):
        if HAS_FAISS:
            try:
                for t in ["lost", "found"]:
                    base_index = faiss.IndexFlatIP(self.dimension)
                    self.faiss_indices[t] = faiss.IndexIDMap2(base_index)
                logger.info("FAISS IndexIDMap2 indices initialized for 'lost' and 'found'.")
            except Exception as e:
                logger.warning(f"Could not initialize FAISS IndexIDMap2: {e}")
                self.faiss_indices.clear()

    def add_item(self, item_id: str, vector: np.ndarray, item_type: str = "lost"):
        """Add or update an item's embedding in the vector store."""
        if item_type not in self.vectors:
            raise ValueError(f"Invalid item_type '{item_type}'. Must be 'lost' or 'found'.")
            
        vector = vector.reshape(1, self.dimension).astype(np.float32)
        # Ensure unit norm
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm

        # 1. FAISS index update
        if HAS_FAISS and item_type in self.faiss_indices:
            try:
                if item_id in self.mongo_to_int[item_type]:
                    old_int_id = self.mongo_to_int[item_type][item_id]
                    self.faiss_indices[item_type].remove_ids(np.array([old_int_id], dtype=np.int64))
                    del self.int_to_mongo[item_type][old_int_id]
                
                int_id = self._next_int_id[item_type]
                self._next_int_id[item_type] += 1
                self.faiss_indices[item_type].add_with_ids(vector, np.array([int_id], dtype=np.int64))
                self.int_to_mongo[item_type][int_id] = item_id
                self.mongo_to_int[item_type][item_id] = int_id
            except Exception as e:
                logger.debug(f"FAISS add_with_ids note: {e}")

        # 2. NumPy array update (always maintained as reliable fallback & lookup)
        if item_id in self.id_to_idx[item_type]:
            idx = self.id_to_idx[item_type][item_id]
            self.vectors[item_type][idx] = vector[0]
            return

        idx = len(self.id_list[item_type])
        if self.vectors[item_type].shape[0] == 0:
            self.vectors[item_type] = vector
        else:
            self.vectors[item_type] = np.vstack([self.vectors[item_type], vector])
            
        self.id_list[item_type].append(item_id)
        self.id_to_idx[item_type][item_id] = idx

    def remove_item(self, item_id: str, item_type: str = "lost"):
        """Remove an item from the vector index."""
        if item_type not in self.vectors or item_id not in self.id_to_idx[item_type]:
            return

        # 1. Remove from FAISS
        if HAS_FAISS and item_type in self.faiss_indices and item_id in self.mongo_to_int[item_type]:
            try:
                int_id = self.mongo_to_int[item_type][item_id]
                self.faiss_indices[item_type].remove_ids(np.array([int_id], dtype=np.int64))
                del self.int_to_mongo[item_type][int_id]
                del self.mongo_to_int[item_type][item_id]
            except Exception as e:
                logger.debug(f"FAISS remove_ids note: {e}")

        # 2. Remove from NumPy array
        target_idx = self.id_to_idx[item_type][item_id]
        n_items = len(self.id_list[item_type])
        
        if target_idx < n_items - 1:
            last_item_id = self.id_list[item_type][-1]
            self.vectors[item_type][target_idx] = self.vectors[item_type][-1]
            self.id_list[item_type][target_idx] = last_item_id
            self.id_to_idx[item_type][last_item_id] = target_idx

        self.vectors[item_type] = self.vectors[item_type][:-1]
        self.id_list[item_type].pop()
        del self.id_to_idx[item_type][item_id]

    def search(self, query_vector: np.ndarray, item_type: str = "found", top_k: int = 20) -> List[Tuple[str, float]]:
        """
        Search for top_k items of target item_type similar to query_vector.
        Returns list of (mongodb_id, cosine_similarity_score).
        """
        if item_type not in self.vectors or len(self.id_list[item_type]) == 0:
            return []

        query = query_vector.reshape(1, self.dimension).astype(np.float32)
        norm = np.linalg.norm(query)
        if norm > 0:
            query = query / norm

        # Try FAISS search first if available
        if HAS_FAISS and item_type in self.faiss_indices and self.faiss_indices[item_type].ntotal > 0:
            try:
                k = min(top_k, self.faiss_indices[item_type].ntotal)
                distances, indices = self.faiss_indices[item_type].search(query, k)
                results = []
                for dist, int_id in zip(distances[0], indices[0]):
                    if int_id in self.int_to_mongo[item_type]:
                        mongo_id = self.int_to_mongo[item_type][int_id]
                        bounded_score = max(0.0, min(1.0, float(dist)))
                        results.append((mongo_id, bounded_score))
                return results
            except Exception as e:
                logger.debug(f"FAISS search fallback: {e}")

        # NumPy cosine inner product search
        scores = np.dot(self.vectors[item_type], query.T).flatten()
        
        top_k = min(top_k, len(scores))
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            score = float(scores[idx])
            bounded_score = max(0.0, min(1.0, (score + 1.0) / 2.0 if score < 0 else score))
            mongo_id = self.id_list[item_type][idx]
            results.append((mongo_id, bounded_score))
            
        return results

    async def rebuild_from_database(self, db, embedding_service):
        """
        Rebuild the vector index from active records in MongoDB after server startup.
        MongoDB is the single source of truth.
        """
        logger.info("Rebuilding vector store from active MongoDB items...")
        self.vectors["lost"] = np.empty((0, self.dimension), dtype=np.float32)
        self.vectors["found"] = np.empty((0, self.dimension), dtype=np.float32)
        self.id_list["lost"].clear()
        self.id_list["found"].clear()
        self.id_to_idx["lost"].clear()
        self.id_to_idx["found"].clear()
        self.int_to_mongo["lost"].clear()
        self.int_to_mongo["found"].clear()
        self.mongo_to_int["lost"].clear()
        self.mongo_to_int["found"].clear()
        self._next_int_id["lost"] = 1
        self._next_int_id["found"] = 1
        self._init_faiss()

        # 1. Load active lost items
        lost_cursor = db.lost_items.find({"status": {"$in": ["active", "potential_match"]}})
        async for item in lost_cursor:
            text = build_searchable_representation(item)
            vec = embedding_service.generate_embedding(text)
            self.add_item(str(item["_id"]), vec, "lost")

        # 2. Load available found items
        found_cursor = db.found_items.find({"status": {"$in": ["available", "potential_match"]}})
        async for item in found_cursor:
            text = build_searchable_representation(item)
            vec = embedding_service.generate_embedding(text)
            self.add_item(str(item["_id"]), vec, "found")

        logger.info(f"Vector store rebuilt: {len(self.id_list['lost'])} lost items, {len(self.id_list['found'])} found items indexed.")

vector_store = DualVectorStore()
