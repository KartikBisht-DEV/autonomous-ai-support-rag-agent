import json
import os
from typing import List, Dict, Any, Optional, Tuple
import numpy as np

from .ingestion import DocumentChunk
from .embeddings import BaseEmbeddingProvider, LocalSemanticEmbeddings


class VectorDB:
    """
    Stage 2: Vector Database Engine
    Stores embeddings, performs high-speed cosine semantic search, 
    and handles metadata filtering and persistence.
    """
    def __init__(self, embedding_provider: Optional[BaseEmbeddingProvider] = None, storage_path: Optional[str] = None):
        self.embedding_provider = embedding_provider or LocalSemanticEmbeddings()
        self.storage_path = storage_path
        self.chunks: List[DocumentChunk] = []
        self.embeddings_matrix: Optional[np.ndarray] = None
        self._doc_sources: set = set()

    def set_embedding_provider(self, provider: BaseEmbeddingProvider):
        self.embedding_provider = provider
        # Re-embed all chunks if any exist
        if self.chunks:
            texts = [c.text for c in self.chunks]
            embeddings = self.embedding_provider.embed_documents(texts)
            for chunk, emb in zip(self.chunks, embeddings):
                chunk.embedding = emb
            self.embeddings_matrix = np.array(embeddings, dtype=np.float32)

    def add_chunks(self, chunks: List[DocumentChunk]):
        if not chunks:
            return

        texts = [c.text for c in chunks]
        embeddings = self.embedding_provider.embed_documents(texts)

        for chunk, emb in zip(chunks, embeddings):
            chunk.embedding = emb
            self.chunks.append(chunk)
            self._doc_sources.add(chunk.metadata.get("source", "Unknown"))

        # Update numpy matrix
        all_embeddings = [c.embedding for c in self.chunks if c.embedding is not None]
        if all_embeddings:
            self.embeddings_matrix = np.array(all_embeddings, dtype=np.float32)

    def similarity_search(
        self,
        query: str,
        top_k: int = 4,
        score_threshold: float = 0.05,
        category_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes semantic search via cosine similarity of query against stored embeddings.
        """
        if not self.chunks or self.embeddings_matrix is None or len(self.embeddings_matrix) == 0:
            return []

        query_vec = np.array(self.embedding_provider.embed_query(query), dtype=np.float32)
        query_norm = np.linalg.norm(query_vec)
        if query_norm > 0:
            query_vec = query_vec / query_norm

        # Compute cosine similarity
        matrix_norms = np.linalg.norm(self.embeddings_matrix, axis=1, keepdims=True)
        # Avoid zero-division
        matrix_norms[matrix_norms == 0] = 1.0
        normalized_matrix = self.embeddings_matrix / matrix_norms

        scores = np.dot(normalized_matrix, query_vec)

        # Keyword BM25-style boost
        query_words = set(query.lower().split())
        results = []

        for idx, score in enumerate(scores):
            chunk = self.chunks[idx]
            if category_filter and chunk.metadata.get("category") != category_filter:
                continue

            # Exact keyword overlap bonus
            chunk_words = set(chunk.text.lower().split())
            overlap = len(query_words.intersection(chunk_words))
            keyword_bonus = min(0.2, overlap * 0.03)

            final_score = float(score) + keyword_bonus
            # Bound score between 0.0 and 1.0
            final_score = max(0.0, min(1.0, final_score))

            if final_score >= score_threshold:
                results.append({
                    "chunk_id": chunk.chunk_id,
                    "text": chunk.text,
                    "metadata": chunk.metadata,
                    "score": round(final_score, 4),
                    "raw_cosine": round(float(score), 4)
                })

        # Sort descending by score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        categories = {}
        for c in self.chunks:
            cat = c.metadata.get("category", "General")
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "total_chunks": len(self.chunks),
            "total_sources": len(self._doc_sources),
            "sources": list(self._doc_sources),
            "categories": categories,
            "embedding_dimension": len(self.embeddings_matrix[0]) if self.embeddings_matrix is not None and len(self.embeddings_matrix) > 0 else 0,
            "provider": self.embedding_provider.__class__.__name__
        }

    def clear(self):
        self.chunks.clear()
        self.embeddings_matrix = None
        self._doc_sources.clear()
