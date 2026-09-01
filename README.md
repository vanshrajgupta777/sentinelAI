# SentinelAI Workbench

A local-first AI workbench for confidential industrial, defence and
government knowledge work. Brings AI to the organization's data
instead of sending the organization's data to AI.

this repository contains both the Next.js frontend and the local
Python FastAPI backend that powers the real local AI workflow

```
                    SentinelAI
                         │
                    Next.js UI
                         │
                   /api/backend (rewrite)
                         │
                   FastAPI (Python)
                         │
               Agent Orchestrator
                         │
                  Model Router
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
  Local-General-LLM  Local-Code-Model  Local-Vision-Model
                         │
                  Local Tools
                ┌────────┼────────┐
                ↓        ↓        ↓
         RAG Retriever  Files  Workspace
                │
                ↓
        Local Knowledge Base
                │
                ↓
            Audit Log (JSONL)
```

## Quick Start

### 1. Prerequisites

* Node.js 20+
* Python 3.11+
* Optional: [Ollama](https://ollama.com) for production-grade local
  models. The app works without Ollama using a deterministic
  in-process local engine (clearly labelled as MOCK mode in the UI).

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8765
```

The first start seeds a small knowledge base of fictional Asterion
SOPs into `backend/data/knowledge_base/`.

### 3. Frontend

In another terminal:

```bash
npm install
npm run dev
```

The Next.js dev server proxies `/api/backend/*` to the FastAPI
backend on `127.0.0.1:8765` (see `next.config.ts`).

### 4. (Optional) Ollama

If you have Ollama installed and a model pulled:

```bash
export LLM_PROVIDER=ollama
export OLLAMA_BASE_URL=http://localhost:11434
export MODEL_GENERAL=llama3.1:8b
export MODEL_CODING=qwen2.5-coder:7b
export MODEL_VISION=llava:7b
```

The architecture will auto-switch to REAL LOCAL mode and the
topbar will show "Real Local".

The frontend will continue to work without Ollama — it falls back
to the in-process local engine and the UI displays a clearly
labelled MOCK MODE banner.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `local-inprocess` | `ollama` to talk to a real local model server |
| `OLLAMA_BASE_URL` | — | URL of the Ollama API |
| `LLM_BASE_URL` | — | Generic alias for the local model server |
| `MODEL_GENERAL` | `local-general` | Model identifier for the general LLM |
| `MODEL_CODING` | `local-code` | Model identifier for the coding model |
| `MODEL_VISION` | `local-vision` | Model identifier for the vision model |
| `MODEL_OCR` | `local-ocr` | Model identifier for the OCR engine |
| `SENTINELAI_BACKEND_URL` | `http://127.0.0.1:8765` | Frontend proxy target |

## Endpoints

* `GET  /api/health` — liveness + mode + provider
* `GET  /api/models` — model registry + availability
* `GET  /api/security/status` — application-level security counters
* `GET  /api/audit` — recent audit events
* `POST /api/documents/upload` — upload a file (multipart)
* `GET  /api/documents` — list uploaded files
* `DELETE /api/documents/{id}` — remove a file
* `POST /api/documents/ingest` — add a file to the local KB
* `GET  /api/documents/knowledge` — list KB documents
* `POST /api/tasks` — create + route a task
* `GET  /api/tasks` — list tasks
* `GET  /api/tasks/{id}` — task detail
* `POST /api/tasks/{id}/execute` — run the orchestrator
* `GET  /api/artifacts/{id}` — download a generated artifact

## How RAG Works

The local retriever lives in `backend/app/rag/retriever.py`. It
chunks documents, builds a TF-IDF matrix, normalizes for cosine
similarity, and returns the top-k chunks for any query. The
matrix is rebuilt on first query and cached in memory.

It is intentionally simple. It runs anywhere Python runs and
never calls any external service.

## Code Agent (Optional)

A Docker sandbox is referenced by the reference roadmap but is
**not** included in V1 by default — Docker is not available in
many development environments. The orchestrator's code-analysis
workflow already exercises the local code model and surfaces
findings + recommendations; adding a sandbox runner is a clean
drop-in (`backend/app/agents/sandbox.py`) once Docker or Podman
is available.

