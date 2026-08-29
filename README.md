# 🤖 Autonomous AI Support Agent with RAG

An enterprise-grade, end-to-end **Autonomous Customer Support Agent with Retrieval-Augmented Generation (RAG)** built with Python, FastAPI, Vector Embeddings, ReAct Agentic Orchestration, and an interactive modern web interface.

---

## 📐 System Architecture

```
[ 📑 USER DATA / POLICY PDFs ]
            │
            ▼ (Stage 1: Ingestion)
    [ Text Chunking ]
            │
            ▼
  [ Embedding Model ] (e.g., text-embedding-3-small / Gemini / Local)
            │
            ▼
┌───────────────────────────────────────┐
│         VECTOR DATABASE               │
│         (ChromaDB / FAISS)            │
└───────────────────┬───────────────────┘
                    ▲
                    │ (Stage 2: Retrieval)
           [ Semantic Search ]
                    │
   [ 👤 USER ]      ▼ (Relevant Text Context)
        │    ┌───────────────────────────────────┐
        ├───►│      AGENTIC ORCHESTRATOR         │
        │    │      (The Brain: ReAct Loop)      │
        │    └──────────────┬────────────────────┘
        │                   │
        │                   ▼ (Stage 3: Generation)
        │           [ LLM (OpenAI/Gemini) ]
        │                   │
        │ (Stage 4: Render UI)
        ◄──(Factual Grounded Response)
```

---

## 🚀 Key Features

### 1. Stage 1: Document Ingestion & Chunking
- **Multi-Format Parsing**: Ingests PDF (`pypdf`), Markdown (`.md`), and raw text (`.txt`).
- **Context-Aware Sliding Window Chunking**: Recursive paragraph and sentence chunking with configurable `chunk_size` and `chunk_overlap`.
- **Metadata Tagging**: Preserves document sources, category tags, token counts, and chunk IDs.

### 2. Stage 2: Vector Database & Semantic Retrieval
- **High-Performance Vector Store**: Cosine similarity calculation using NumPy dense matrix.
- **Hybrid Keyword & Semantic Search**: Combines dense vector similarity with token-overlap bonuses for maximum precision.
- **Multi-Provider Embeddings**:
  - `LocalSemanticEmbeddings`: Zero-dependency, offline semantic subword TF-IDF embedding engine.
  - `OpenAIEmbeddings`: `text-embedding-3-small` / `text-embedding-3-large`.
  - `GeminiEmbeddings`: Google `text-embedding-004`.

### 3. Stage 3: Agentic Orchestrator (The Brain)
- **Multi-Step ReAct Loop**:
  1. **Intent Classification & Entity Extraction**: Detects Order IDs (`ORD-XXXX`), Serial Numbers (`SN-XXXX`), return intents, warranty claims, or outage escalations.
  2. **Semantic Knowledge Retrieval**: Retrieves top-$K$ grounded policy chunks.
  3. **Autonomous Tool Execution**:
     - `lookup_order`: Queries live order & shipment database.
     - `calculate_refund_eligibility`: Validates return windows (30 days), restocking fees, and VIP instant payouts.
     - `check_warranty`: Checks Care+ protection plans and repair deductibles.
     - `escalate_ticket`: Dispatches tickets to human on-call engineers for critical outages.
  4. **Grounding & Hallucination Guard**: Computes confidence scores and provides exact source citations.

### 4. Stage 4: Interactive Web UI
- **Real-Time AI Support Chat**: Interactive chat interface with streaming thought trace accordion (`Stage 1 ➔ 2 ➔ 3 ➔ 4`), suggested prompts, and clickable citation cards.
- **Knowledge Base Inspector**: Live chunk viewer, token count tracker, and drag-and-drop PDF upload dropzone.
- **Vector Search Sandbox**: Test cosine similarity matching directly on queries with real-time score meters.
- **Agent Flow Visualizer**: Visual representation of the complete pipeline.
- **Tool Sandbox**: Manually execute agent tools and inspect structured JSON responses.

---

## 🛠️ Project Structure

```
.
├── backend/
│   └── app/
│       ├── __init__.py
│       ├── main.py                # FastAPI app & endpoints
│       ├── rag/
│       │   ├── ingestion.py       # PDF/Text parser & sliding window chunker
│       │   ├── embeddings.py      # OpenAI, Gemini & Local embeddings
│       │   └── vectordb.py        # Cosine vector store & similarity search
│       ├── agent/
│       │   ├── orchestrator.py    # Autonomous agent brain & ReAct loop
│       │   └── tools.py           # Order DB, Refund engine, Ticket escalation
│       └── data/
│           └── sample_policies.py # Preloaded enterprise policy documents
├── static/
│   ├── index.html                 # Modern glassmorphism web interface
│   ├── css/
│   │   └── styles.css             # Dark theme design system
│   └── js/
│       └── app.js                 # Frontend state, chat & sandbox logic
├── requirements.txt
├── .gitignore
└── README.md
```

---

## ⚡ Quickstart & Installation

### Prerequisites
- Python 3.10+
- `pip`

### Step 1: Clone and Set Up Virtual Environment
```bash
git clone https://github.com/KartikBisht-DEV/autonomous-rag-support-agent.git
cd autonomous-rag-support-agent

python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Run the Server
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Open in Browser
Visit **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 🧪 Sample Queries to Test

| Query | What the Agent Does |
|---|---|
| `Where is my order ORD-9821 and what is the tracking status?` | Executes `lookup_order` tool, queries shipping carrier tracking, and displays VIP tier delivery info. |
| `Can I return order ORD-9821 for a full refund?` | Checks order delivery date, verifies 30-day return policy, calculates restocking fee ($0 for VIP), and confirms instant carrier scan payout. |
| `Check warranty status for SN-QT8892` | Runs `check_warranty` tool, checks Care+ extended 3-year plan, and reveals replacement deductible. |
| `I have a critical system outage, escalate to a human manager!` | Triggers `escalate_ticket` tool, generates high-priority ticket `#TCK-XXXXX`, and assigns 15-minute SLA on-call response. |

---

## 📄 License
MIT License. Created by [KartikBisht-DEV](https://github.com/KartikBisht-DEV).
