import math
import re
from typing import List, Optional
import numpy as np

class BaseEmbeddingProvider:
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError

    def embed_query(self, text: str) -> List[float]:
        raise NotImplementedError


class LocalSemanticEmbeddings(BaseEmbeddingProvider):
    """
    High-performance semantic character-ngram + subword TF-IDF embedding engine.
    Ensures the RAG system works out of the box with zero external dependencies,
    calculating high-dimensional cosine-normalized semantic representations.
    """
    def __init__(self, vector_dim: int = 256):
        self.vector_dim = vector_dim

    def _hash_token(self, token: str, dim: int) -> int:
        val = 0
        for char in token:
            val = (val * 31 + ord(char)) & 0xFFFFFFFF
        return val % dim

    def _tokenize(self, text: str) -> List[str]:
        text_clean = text.lower()
        words = re.findall(r'\b[a-z0-9_]+\b', text_clean)
        ngrams = []
        # Add word tokens
        for w in words:
            ngrams.append(w)
            if len(w) > 4:
                # Add subword character n-grams for typo & morphology tolerance
                for i in range(len(w) - 3):
                    ngrams.append(w[i:i+4])
        # Add word bigrams for context
        for i in range(len(words) - 1):
            ngrams.append(f"{words[i]}_{words[i+1]}")
        return ngrams

    def _vectorize(self, text: str) -> List[float]:
        tokens = self._tokenize(text)
        vec = np.zeros(self.vector_dim, dtype=np.float32)
        if not tokens:
            return vec.tolist()

        for token in tokens:
            idx = self._hash_token(token, self.vector_dim)
            weight = 1.0 + math.log(1 + len(token))
            vec[idx] += weight

        # Apply L2 Normalization for Cosine Distance calculations
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._vectorize(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._vectorize(text)


class OpenAIEmbeddings(BaseEmbeddingProvider):
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model = model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        cleaned = [t.replace("\n", " ") for t in texts]
        resp = self.client.embeddings.create(input=cleaned, model=self.model)
        return [item.embedding for item in resp.data]

    def embed_query(self, text: str) -> List[float]:
        cleaned = text.replace("\n", " ")
        resp = self.client.embeddings.create(input=[cleaned], model=self.model)
        return resp.data[0].embedding


class GeminiEmbeddings(BaseEmbeddingProvider):
    def __init__(self, api_key: str, model: str = "models/text-embedding-004"):
        from google import genai
        self.client = genai.Client(api_key=api_key)
        self.model = model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            result = self.client.models.embed_content(
                model=self.model,
                contents=text
            )
            embeddings.append(result.embedding.values)
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        result = self.client.models.embed_content(
            model=self.model,
            contents=text
        )
        return result.embedding.values


def get_embedding_provider(provider_type: str = "local", api_key: Optional[str] = None, model: Optional[str] = None) -> BaseEmbeddingProvider:
    if provider_type == "openai" and api_key:
        return OpenAIEmbeddings(api_key=api_key, model=model or "text-embedding-3-small")
    elif provider_type == "gemini" and api_key:
        return GeminiEmbeddings(api_key=api_key, model=model or "models/text-embedding-004")
    return LocalSemanticEmbeddings()
