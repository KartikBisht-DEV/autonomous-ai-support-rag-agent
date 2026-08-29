# 🎓 Autonomous AI Support Agent with RAG
### *Final Year B.Tech CSE Capstone / Major Project*
**Developer:** [Kartik Bisht](https://github.com/KartikBisht-DEV) (B.Tech Computer Science & Engineering)  
**Live Production URL:** [https://autonomous-ai-support-rag-agent.onrender.com](https://autonomous-ai-support-rag-agent.onrender.com)  
**GitHub Repository:** [https://github.com/KartikBisht-DEV/autonomous-ai-support-rag-agent](https://github.com/KartikBisht-DEV/autonomous-ai-support-rag-agent)

---

## 📌 Problem Statement & Motivation

Standard Large Language Models (LLMs) suffer from two fundamental enterprise limitations:
1. **Hallucination & Stale Data**: Generic LLMs invent facts when queried on internal company policies, return windows, or dynamic order records.
2. **Lack of Autonomous Action**: Standalone LLMs cannot interact with live databases, check tracking APIs, or execute refund calculations.

**Our Solution:**  
We designed and implemented an **Autonomous Multi-Stage RAG (Retrieval-Augmented Generation) Architecture** combined with a **ReAct Agentic Brain** that:
- Ingests unstructured policy PDFs into vector embeddings.
- Executes real-time semantic retrieval using Cosine Similarity + BM25 keyword reranking.
- Autonomously executes backend tools (`lookup_order`, `calculate_refund`, `check_warranty`, `escalate_ticket`).
- Strictly grounds factual answers with verifiable document citations and live thought tracing.

---

## 📐 System Architecture & 4-Stage Pipeline

```
[ 📑 USER DATA / POLICY PDFs ]
            │
            ▼ (Stage 1: Ingestion)
    [ Text Chunking ]  ───► Sliding Window Recursive Chunking (350 tokens, 60 overlap)
            │
            ▼
  [ Embedding Model ]  ───► Subword TF-IDF / text-embedding-3-small (256-dim vectors)
            │
            ▼
┌───────────────────────────────────────┐
│         VECTOR DATABASE               │  ───► Cosine Similarity Index + Hybrid BM25
│         (ChromaDB / FAISS)            │
└───────────────────┬───────────────────┘
                    ▲
                    │ (Stage 2: Retrieval)
           [ Semantic Search ]  ───► Top-K Relevant Document Context
                    │
   [ 👤 USER ]      ▼ (Relevant Text Context)
        │    ┌───────────────────────────────────┐
        ├───►│      AGENTIC ORCHESTRATOR         │  ───► ReAct Loop:
        │    │      (The Brain: LangChain)       │       1. Intent Recognition
        │    └──────────────┬────────────────────┘       2. Tool Calling (Order DB / Refund)
        │                   │                            3. Grounding Guard
        │                   ▼ (Stage 3: Generation)
        │           [ LLM (OpenAI/Gemini) ]
        │                   │
        │ (Stage 4: Render UI)
        ◄──(Grounded Factual Response + Citations + Thought Steps)
```

---

## 🧮 Mathematical & Algorithmic Foundations

### 1. Vector Cosine Similarity
To measure the semantic relevance of a user query $\mathbf{q}$ against stored document chunk vectors $\mathbf{d}_i$, we calculate the cosine of the angle between them:

$$\text{Cosine Similarity}(\mathbf{q}, \mathbf{d}_i) = \frac{\mathbf{q} \cdot \mathbf{d}_i}{\|\mathbf{q}\|_2 \|\mathbf{d}_i\|_2} = \frac{\sum_{k=1}^{D} q_k d_{ik}}{\sqrt{\sum_{k=1}^{D} q_k^2} \sqrt{\sum_{k=1}^{D} d_{ik}^2}}$$

### 2. Sliding Window Recursive Chunking
To prevent cutting sentences mid-thought, our sliding window chunker uses:
$$\text{Step Size} = \text{Chunk Size (350 tokens)} - \text{Overlap (60 tokens)} = 290 \text{ tokens}$$
The 60-token overlap guarantees that context at chunk boundaries is never lost.

### 3. Complexity Analysis
- **Vector Search Time Complexity**: $O(N \cdot D)$ where $N$ is the number of document chunks and $D$ is the embedding dimension ($D = 256$).
- **Space Complexity**: $O(N \cdot D)$ in-memory dense matrix storage.

---

## 🎤 Placement Interview & Viva Q&A (Top 10 Questions)

### Q1: Why RAG instead of Fine-Tuning an LLM?
> **Answer:** Fine-tuning modifies internal model weights for style/syntax, but is expensive, slow to update, and cannot guarantee zero-hallucination. RAG decouples *knowledge storage* from *reasoning*: when company policies change, we simply re-index the PDF in the Vector DB without retraining. It also provides exact source citations.

### Q2: How does the ReAct agent decide when to call a tool?
> **Answer:** The Orchestrator uses a ReAct (Reasoning + Acting) loop. During the initial pass, regex and intent extractors identify entities (like `ORD-9821` or `SN-QT8892`). If an Order ID is found, it triggers `lookup_order`. If refund intent is detected, it calculates return window compliance against the 30-day policy.

### Q3: How do you prevent LLM hallucinations?
> **Answer:** We enforce 3 layers of defense:
> 1. **Context Constrained Prompting**: System instructions explicitly mandate answering *only* from the injected retrieved context.
> 2. **Grounding Confidence Metric**: Measuring cosine distance between generated claims and retrieved excerpts.
> 3. **Interactive Citation Linking**: Providing exact document source tags so users can audit answers.

### Q4: Why FastAPI over Flask or Django?
> **Answer:** FastAPI runs on modern ASGI (Uvicorn/Starlette) with native Python `async/await` support, allowing non-blocking concurrent request handling during external LLM API calls and vector calculations. It also provides automatic Pydantic schema validation.

### Q5: How would you scale this to 10 Million enterprise documents?
> **Answer:** We would replace exact brute-force search with Approximate Nearest Neighbor (ANN) indexing like **HNSW (Hierarchical Navigable Small World)** in a distributed vector database (e.g. Pinecone, Milvus, Qdrant) and offload document ingestion to Celery background workers with Redis message brokers.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic | High-performance Async REST API |
| **RAG & Vector DB** | Custom Cosine Vector Store, NumPy, PyPDF | High-dimensional semantic indexing & chunking |
| **Agentic Brain** | ReAct Pattern, Rule-Based & Multi-Model Engine | Autonomous intent routing & tool execution |
| **LLM Support** | Google Gemini 2.0, OpenAI GPT-4o, Local Engine | Flexible model orchestration |
| **Frontend** | Vanilla HTML5, Modern CSS Glassmorphism, JS ES6 | Responsive mobile & desktop interface |
| **Deployment** | Render, Vercel, Docker Ready | 24/7 cloud hosting |

---

## ⚡ Quickstart (Run Locally)

```bash
# 1. Clone repo
git clone https://github.com/KartikBisht-DEV/autonomous-ai-support-rag-agent.git
cd autonomous-ai-support-rag-agent

# 2. Setup Virtual Environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Start Server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 👨‍💻 Author
**Kartik Bisht**  
B.Tech Computer Science & Engineering  
GitHub: [@KartikBisht-DEV](https://github.com/KartikBisht-DEV)  
Email: `bishtkartik2005@gmail.com`
