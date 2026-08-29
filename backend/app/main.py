import os
import shutil
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .rag.ingestion import DocumentIngestionEngine, DocumentChunk
from .rag.embeddings import get_embedding_provider
from .rag.vectordb import VectorDB
from .agent.orchestrator import AgenticOrchestrator
from .agent.tools import AgentTools, MOCK_ORDERS
from .data.sample_policies import SAMPLE_DOCUMENTS

# Initialize App
app = FastAPI(
    title="Autonomous AI Support Agent with RAG",
    description="Enterprise-Grade Autonomous Customer Support RAG System with Vector DB & Agentic Brain",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global In-Memory Instances
ingestion_engine = DocumentIngestionEngine(chunk_size=350, chunk_overlap=60)
vector_db = VectorDB()
orchestrator = AgenticOrchestrator(vector_db=vector_db)


def initialize_knowledge_base():
    """Preload standard enterprise sample policy documents."""
    vector_db.clear()
    for doc in SAMPLE_DOCUMENTS:
        chunks = ingestion_engine.chunk_text(
            text=doc["content"],
            source_name=doc["filename"],
            doc_category=doc["category"]
        )
        vector_db.add_chunks(chunks)
    print(f"Initialized Knowledge Base with {len(vector_db.chunks)} chunks across {len(SAMPLE_DOCUMENTS)} documents.")


initialize_knowledge_base()

# Request/Response Schemas
class ChatRequest(BaseModel):
    query: str
    user_email: Optional[str] = "bishtkartik2005@gmail.com"
    llm_provider: Optional[str] = "local" # local, openai, gemini
    api_key: Optional[str] = None
    llm_model: Optional[str] = None
    system_instruction: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 4
    category: Optional[str] = None

class ToolExecutionRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]

class ConfigUpdateRequest(BaseModel):
    embedding_provider: str
    api_key: Optional[str] = None
    model_name: Optional[str] = None


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "system": "Autonomous AI Support Agent RAG",
        "version": "1.0.0",
        "timestamp": os.environ.get("HOSTNAME", "localhost")
    }


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    result = orchestrator.process_query(
        query=req.query,
        user_email=req.user_email,
        llm_provider=req.llm_provider or "local",
        api_key=req.api_key,
        llm_model=req.llm_model,
        system_instruction=req.system_instruction
    )
    return result


@app.get("/api/kb/stats")
async def get_kb_stats():
    return vector_db.get_stats()


@app.get("/api/kb/chunks")
async def get_kb_chunks():
    return [c.to_dict() for c in vector_db.chunks]


@app.post("/api/kb/search")
async def semantic_search_endpoint(req: SearchRequest):
    results = vector_db.similarity_search(
        query=req.query,
        top_k=req.top_k or 4,
        category_filter=req.category
    )
    return {"query": req.query, "results": results, "count": len(results)}


@app.post("/api/kb/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("Custom Document")
):
    filename = file.filename
    content_bytes = await file.read()

    if filename.lower().endswith(".pdf"):
        raw_text = ingestion_engine.parse_pdf_bytes(content_bytes, filename)
    else:
        raw_text = content_bytes.decode("utf-8", errors="ignore")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the provided file.")

    chunks = ingestion_engine.chunk_text(
        text=raw_text,
        source_name=filename,
        doc_category=category
    )
    vector_db.add_chunks(chunks)

    return {
        "success": True,
        "filename": filename,
        "category": category,
        "chunks_created": len(chunks),
        "total_kb_chunks": len(vector_db.chunks)
    }


@app.post("/api/kb/reset")
async def reset_kb():
    initialize_knowledge_base()
    return {"success": True, "message": "Knowledge base reset to default enterprise policies."}


@app.post("/api/config/embedding")
async def update_embedding_config(req: ConfigUpdateRequest):
    try:
        provider = get_embedding_provider(
            provider_type=req.embedding_provider,
            api_key=req.api_key,
            model=req.model_name
        )
        vector_db.set_embedding_provider(provider)
        return {
            "success": True,
            "provider": provider.__class__.__name__,
            "message": "Embedding engine updated and vector index recomputed successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tools/orders")
async def get_mock_orders():
    return MOCK_ORDERS


@app.post("/api/tools/execute")
async def execute_tool(req: ToolExecutionRequest):
    tool_name = req.tool_name
    args = req.arguments

    if tool_name == "lookup_order":
        return AgentTools.lookup_order(args.get("order_id", ""))
    elif tool_name == "calculate_refund":
        return AgentTools.calculate_refund_eligibility(
            order_id=args.get("order_id", ""),
            reason=args.get("reason", "Customer inquiry")
        )
    elif tool_name == "check_warranty":
        return AgentTools.check_warranty(args.get("serial_number", ""))
    elif tool_name == "escalate_ticket":
        return AgentTools.escalate_ticket(
            customer_email=args.get("customer_email", "user@example.com"),
            issue_summary=args.get("issue_summary", "Manual test"),
            severity=args.get("severity", "Medium")
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown tool: {tool_name}")


# Robust Multi-Platform Static Frontend Resolution (Local, Docker, Render, Vercel)
POSSIBLE_STATIC_DIRS = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static"),
    os.path.join(os.getcwd(), "static"),
    os.path.abspath("static"),
    "/var/task/static"
]

STATIC_DIR = next((d for d in POSSIBLE_STATIC_DIRS if os.path.exists(d)), None)

if STATIC_DIR and os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def serve_index():
    if STATIC_DIR:
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
    return {"message": "Autonomous AI Support Agent Backend API is running. Check /api/health or mount /static."}
