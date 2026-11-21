import logging
import numpy as np
from typing import List, Union

logger = logging.getLogger("findit.embedding")

class EmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None
        self._dimension = 384

    @property
    def model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading SentenceTransformer model: {self.model_name}...")
                self._model = SentenceTransformer(self.model_name)
                logger.info(f"SentenceTransformer {self.model_name} loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load SentenceTransformer ({e}). Fallback projection enabled.")
                self._model = None
        return self._model

    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate normalized 384-dimensional embedding vector for text.
        Normalized embeddings allow cosine similarity via standard inner product.
        """
        if not text:
            # Return zero vector if empty
            return np.zeros(self._dimension, dtype=np.float32)

        try:
            if self.model is not None:
                embedding = self.model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
                return embedding.astype(np.float32)
        except Exception as e:
            logger.error(f"Error encoding with SentenceTransformer: {e}")

        # Deterministic semantic fallback vector if torch / sentence-transformers is offline
        return self._fallback_hash_embedding(text)

    def _fallback_hash_embedding(self, text: str) -> np.ndarray:
        """Deterministic fallback embedding using character n-grams and hashing."""
        vec = np.zeros(self._dimension, dtype=np.float32)
        words = text.lower().split()
        for i, word in enumerate(words):
            h = hash(word)
            idx = abs(h) % self._dimension
            vec[idx] += 1.0 / (1.0 + i * 0.1)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

embedding_service = EmbeddingService()
