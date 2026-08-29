import io
import re
import uuid
import time
from typing import List, Dict, Any, Optional
from pypdf import PdfReader


class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        text: str,
        metadata: Dict[str, Any],
        embedding: Optional[List[float]] = None
    ):
        self.chunk_id = chunk_id
        self.text = text
        self.metadata = metadata
        self.embedding = embedding

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "text": self.text,
            "metadata": self.metadata,
            "token_estimate": len(self.text.split())
        }


class DocumentIngestionEngine:
    """
    Stage 1 Ingestion Engine:
    Handles text parsing from PDFs, Markdown, TXT, and performs intelligent recursive text chunking
    with context preservation and overlap.
    """
    def __init__(self, chunk_size: int = 400, chunk_overlap: int = 80):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def parse_pdf_bytes(self, file_bytes: bytes, filename: str) -> str:
        pdf_stream = io.BytesIO(file_bytes)
        reader = PdfReader(pdf_stream)
        text_content = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_content.append(f"--- [Page {i+1}] ---\n" + page_text)
        return "\n\n".join(text_content)

    def parse_text(self, text_str: str) -> str:
        return text_str.strip()

    def chunk_text(self, text: str, source_name: str, doc_category: str = "General Policy") -> List[DocumentChunk]:
        """
        Splits text into chunks preserving sentences and semantic boundaries.
        """
        # Split by sections or paragraphs first
        paragraphs = re.split(r'\n\s*\n', text)
        raw_chunks = []
        current_chunk_words = []

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            words = para.split()
            if len(current_chunk_words) + len(words) <= self.chunk_size:
                current_chunk_words.extend(words)
            else:
                if current_chunk_words:
                    raw_chunks.append(" ".join(current_chunk_words))
                
                # Overlap logic
                if self.chunk_overlap > 0 and len(current_chunk_words) > self.chunk_overlap:
                    current_chunk_words = current_chunk_words[-self.chunk_overlap:] + words
                else:
                    current_chunk_words = words

        if current_chunk_words:
            raw_chunks.append(" ".join(current_chunk_words))

        # Build DocumentChunk objects
        doc_chunks = []
        total = len(raw_chunks)
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")

        for idx, chunk_text in enumerate(raw_chunks):
            # Infer section title if present
            first_line = chunk_text.split("\n")[0][:60]
            c_id = f"chk_{uuid.uuid4().hex[:8]}"
            chunk = DocumentChunk(
                chunk_id=c_id,
                text=chunk_text,
                metadata={
                    "source": source_name,
                    "category": doc_category,
                    "chunk_index": idx + 1,
                    "total_chunks": total,
                    "preview": first_line,
                    "created_at": timestamp
                }
            )
            doc_chunks.append(chunk)

        return doc_chunks
