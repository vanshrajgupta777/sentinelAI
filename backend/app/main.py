"""
SentinelAI Backend
==================
FastAPI app exposing the local AI workbench. Endpoints:

  GET  /api/health                 — liveness + mode
  GET  /api/models                 — model registry + availability
  GET  /api/security/status        — security counters
  GET  /api/audit                  — recent audit events

  POST /api/tasks                  — create + route a task
  GET  /api/tasks                  — list tasks
  GET  /api/tasks/{id}             — task detail
  POST /api/tasks/{id}/execute     — run the orchestrator

  POST /api/documents/upload       — upload + extract a file
  GET  /api/documents              — list documents
  DELETE /api/documents/{id}       — remove a document
  POST /api/documents/ingest       — ingest a local file into RAG
  GET  /api/documents/knowledge    — list knowledge base docs

  GET  /api/artifacts/{id}         — download a generated artifact
"""
from __future__ import annotations

import logging
import os
import re
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from .agents.orchestrator import Orchestrator
from .audit.log import AuditLog
from .models.registry import load_catalog
from .models.schemas import (
    AuditCategory,
    AuditStatus,
    CreateTaskRequest,
    CreateTaskResponse,
    DocumentInfo,
    DocumentListResponse,
    ExecutionMode,
    HealthResponse,
    IngestRequest,
    IngestResponse,
    ModelsResponse,
    SecurityStatus,
    TaskListResponse,
    TaskType,
    UploadResponse,
)
from .rag.retriever import LocalRetriever
from .services.documents import extract as doc_extract
from .services.local_engine import build_engine

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger("sentinelai")

# ---------- Bootstrap ----------

BACKEND_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_ROOT / "data"
WORKSPACES = DATA_DIR / "workspaces"
UPLOADS = DATA_DIR / "uploads"
ARTIFACTS = DATA_DIR / "artifacts"
KB = DATA_DIR / "knowledge_base"
AUDIT_PATH = DATA_DIR / "audit.jsonl"
for d in (WORKSPACES, UPLOADS, ARTIFACTS, KB, KB / "documents", KB / "embeddings", KB / "metadata"):
    d.mkdir(parents=True, exist_ok=True)

catalog = load_catalog()
engine = build_engine()
retriever = LocalRetriever(KB)
audit = AuditLog(AUDIT_PATH)
orchestrator = Orchestrator(
    catalog=catalog,
    engine=engine,
    retriever=retriever,
    audit=audit,
    workspaces_root=WORKSPACES,
    artifacts_root=ARTIFACTS,
)

MODE: ExecutionMode = (
    ExecutionMode.REAL_LOCAL if engine.provider == "ollama" else ExecutionMode.MOCK
)

# Seed a tiny knowledge base on first start so RAG has something
# to retrieve against in the demo. The contents are fictional and
# live entirely on the local filesystem.
def _seed_kb() -> None:
    seeds = [
        (
            "sop-pump-vibration",
            "Asterion SOP — Pump Vibration Response",
            (
                "When a centrifugal pump exceeds the ISO 10816-3 alert threshold, the operator must "
                "(a) reduce load to 80% of nameplate, (b) record vibration trend, (c) notify the "
                "reliability duty engineer. Sustained exceedance > 24h requires a borescope inspection "
                "and scheduled bearing replacement."
            ),
        ),
        (
            "sop-bearing-temperature",
            "Asterion SOP — Bearing Temperature Monitoring",
            (
                "A sustained rise in bearing temperature > 4°C over 30 days indicates progressive wear. "
                "Plan an unscheduled inspection within 14 days and verify lubrication system performance. "
                "Document the trend in the equipment logbook."
            ),
        ),
        (
            "sop-maintenance-interval",
            "Asterion SOP — Overdue Maintenance",
            (
                "Operating hours past the manufacturer's recommended overhaul interval require a "
                "documented review by the maintenance planning team. A risk-based assessment must be "
                "completed and recorded before continued operation."
            ),
        ),
    ]
    for doc_id, name, body in seeds:
        if (KB / "documents" / f"{doc_id}.json").exists():
            continue
        retriever.ingest(doc_id, name, body, page_count=1)


_seed_kb()

# ---------- App ----------

app = FastAPI(
    title="SentinelAI Workbench Backend",
    version="1.0.0",
    description="Local AI workbench. No external AI calls.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


# ---------- Core endpoints ----------

@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        ok=True,
        mode=MODE,
        provider=engine.provider,
        models_available=len(catalog.entries),
        backend_version="1.0.0",
    )


@app.get("/api/models", response_model=ModelsResponse)
def models_endpoint() -> ModelsResponse:
    # Probe availability for each entry
    items = []
    for e in catalog.entries:
        available = engine.is_available() and e.provider == engine.provider
        items.append(
            {
                "id": e.id,
                "name": e.name,
                "provider": e.provider,
                "model": e.model,
                "capabilities": e.capabilities,
                "available": available,
                "version": e.version,
                "parameters": e.parameters,
            }
        )
    return ModelsResponse(mode=MODE, provider=engine.provider, base_url=catalog.base_url, models=items)


@app.get("/api/security/status", response_model=SecurityStatus)
def security_status() -> SecurityStatus:
    return SecurityStatus(
        mode=MODE,
        provider=engine.provider,
        external_ai_calls=orchestrator.security_status["external_ai_calls"],
        external_data_transfers=orchestrator.security_status["external_data_transfers"],
        local_model_calls=orchestrator.security_status["local_model_calls"],
        status="LOCAL_ONLY" if MODE == ExecutionMode.MOCK or engine.provider == "ollama" else "DEGRADED",
        notes=[
            "No external AI APIs are called by this backend.",
            "All document processing happens inside local workspaces.",
            "Application-level isolation only — production requires physical network controls.",
        ],
    )


@app.get("/api/audit")
def audit_endpoint(limit: int = 200):
    return {"events": [e.model_dump(mode="json") for e in audit.list(limit=limit)]}


# ---------- Documents ----------

@app.post("/api/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    name = file.filename or f"upload-{uuid.uuid4().hex[:6]}"
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    out_path = UPLOADS / safe
    data = await file.read()
    with open(out_path, "wb") as f:
        f.write(data)
    ext = doc_extract(out_path)
    workspace = WORKSPACES / f"upload_{uuid.uuid4().hex[:8]}"
    for sub in ("input", "intermediate", "output", "logs"):
        (workspace / sub).mkdir(parents=True, exist_ok=True)
    shutil.copy(out_path, workspace / "input" / safe)
    (workspace / "intermediate" / f"{safe}.txt").write_text(ext.text or "")
    audit.record(
        AuditCategory.DOCUMENTS,
        "DOCUMENT_UPLOADED",
        f"Uploaded {safe} ({len(data)} bytes) to workspace {workspace.name}",
        AuditStatus.SUCCESS,
    )
    return UploadResponse(
        document_id=safe,
        name=safe,
        size=len(data),
        extension=safe.rsplit(".", 1)[-1].upper() if "." in safe else "",
        classification="CONFIDENTIAL",
        owner="current-user",
        stored_path=str(out_path),
        workspace=workspace.name,
    )


@app.get("/api/documents", response_model=DocumentListResponse)
def list_documents():
    docs: List[DocumentInfo] = []
    for p in sorted(UPLOADS.iterdir()):
        if not p.is_file():
            continue
        ext = doc_extract(p)
        docs.append(
            DocumentInfo(
                id=p.name,
                name=p.name,
                type=_infer_type(p.name),
                extension=p.suffix.lstrip(".").upper() or "FILE",
                size=p.stat().st_size,
                uploaded_at=datetime.fromtimestamp(p.stat().st_mtime),
                classification="CONFIDENTIAL",
                owner="current-user",
                indexed=False,
                chunks=None,
            )
        )
    return DocumentListResponse(documents=docs)


@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str):
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", document_id)
    p = UPLOADS / safe
    if not p.exists():
        raise HTTPException(404, "document not found")
    p.unlink()
    audit.record(
        AuditCategory.DOCUMENTS,
        "DOCUMENT_REMOVED",
        f"Removed {safe} from local repository",
        AuditStatus.WARN,
    )
    return {"ok": True}


@app.post("/api/documents/ingest", response_model=IngestResponse)
def ingest_document(req: IngestRequest):
    p = Path(req.path)
    if not p.exists():
        raise HTTPException(404, f"path not found: {req.path}")
    ext = doc_extract(p)
    n = retriever.ingest(p.stem, p.name, ext.text, ext.page_count)
    audit.record(
        AuditCategory.RAG,
        "DOCUMENT_INDEXED",
        f"Indexed {p.name} into local knowledge base ({n} chunks)",
        AuditStatus.SUCCESS,
    )
    return IngestResponse(document_id=p.stem, chunks=n, indexed=True)


@app.get("/api/documents/knowledge")
def knowledge():
    return {"documents": retriever.list_documents()}


# ---------- Tasks ----------

@app.post("/api/tasks", response_model=CreateTaskResponse)
def create_task(req: CreateTaskRequest):
    type_ = TaskType(req.type) if req.type in TaskType.__members__.values() else TaskType.AUTO
    task = orchestrator.create_task(req.description, type_, req.files)
    return CreateTaskResponse(
        task_id=task.id,
        status=task.status,
        classified_type=task.routing.resolved_type if task.routing else "",
        selected_model=task.routing.model.name if task.routing else "",
        routing_reason=task.routing.reason if task.routing else "",
        plan=task.plan,
    )


@app.get("/api/tasks", response_model=TaskListResponse)
def list_tasks():
    items = []
    for t in orchestrator.list_tasks():
        items.append(_task_summary(t))
    return TaskListResponse(mode=MODE, tasks=items)


@app.get("/api/tasks/{task_id}")
def task_detail(task_id: str):
    t = orchestrator.get_task(task_id)
    if t is None:
        raise HTTPException(404, "task not found")
    return _task_detail(t)


@app.post("/api/tasks/{task_id}/execute")
def execute_task(task_id: str):
    t = orchestrator.get_task(task_id)
    if t is None:
        raise HTTPException(404, "task not found")
    t = orchestrator.execute(task_id)
    return _task_detail(t)


@app.get("/api/artifacts/{artifact_id}")
def download_artifact(artifact_id: str):
    safe = re.sub(r"[^A-Za-z0-9._-]", "_", artifact_id)
    p = orchestrator.get_artifact_path(safe)
    if p is None or not p.exists():
        raise HTTPException(404, "artifact not found")
    return FileResponse(
        str(p),
        filename=p.name,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


# ---------- Helpers ----------

def _infer_type(name: str) -> str:
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    return {
        "pdf": "Inspection Report",
        "docx": "Procedure",
        "xlsx": "Specification",
        "dwg": "Engineering Drawing",
        "png": "Engineering Drawing",
        "jpg": "Engineering Drawing",
        "zip": "Code Archive",
    }.get(ext, "Document")


def _task_summary(t):
    return {
        "id": t.id,
        "description": t.description,
        "type": t.requested_type,
        "resolved_type": t.routing.resolved_type if t.routing else "",
        "status": t.status,
        "model": t.routing.model.name if t.routing else "",
        "created_at": t.created_at.isoformat(),
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        "duration_ms": t.duration_ms,
        "progress": t.progress,
        "routing_reason": t.routing.reason if t.routing else None,
    }


def _task_detail(t):
    return {
        "id": t.id,
        "description": t.description,
        "type": t.requested_type,
        "resolved_type": t.routing.resolved_type if t.routing else "",
        "status": t.status,
        "model": t.routing.model.name if t.routing else "",
        "created_at": t.created_at.isoformat(),
        "completed_at": t.completed_at.isoformat() if t.completed_at else None,
        "duration_ms": t.duration_ms,
        "progress": t.progress,
        "routing_reason": t.routing.reason if t.routing else None,
        "files": [f.model_dump() for f in t.files],
        "pipeline": [s.model_dump(mode="json") for s in t.pipeline],
        "plan": t.plan,
        "result": t.result,
        "artifact_id": t.artifact_id,
        "security": {
            "local_processing": True,
            "external_calls": 0,
            "verified": t.status.value == "completed",
            "local_model_calls": t.local_model_calls,
        },
    }
