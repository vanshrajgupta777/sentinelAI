"""
SentinelAI Backend - Pydantic schemas
====================================
All API request/response models for the local FastAPI service.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


# ---------- Enums ----------

class TaskType(str, Enum):
    AUTO = "auto"
    DOCUMENT_ANALYSIS = "document-analysis"
    ENGINEERING_DRAWING = "engineering-drawing"
    CODE_ANALYSIS = "code-analysis"
    DATA_ANALYSIS = "data-analysis"
    REPORT_GENERATION = "report-generation"


class TaskStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class PipelineStatus(str, Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    COMPLETE = "complete"


class AuditCategory(str, Enum):
    TASKS = "TASKS"
    DOCUMENTS = "DOCUMENTS"
    AI = "AI"
    SECURITY = "SECURITY"
    RAG = "RAG"


class AuditStatus(str, Enum):
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARN = "WARN"
    ERROR = "ERROR"


class ExecutionMode(str, Enum):
    REAL_LOCAL = "REAL_LOCAL"
    MOCK = "MOCK"


# ---------- Core models ----------

class UploadedFileInfo(BaseModel):
    id: str
    name: str
    size: int
    extension: str
    mime: Optional[str] = None


class ModelConfig(BaseModel):
    id: str
    name: str
    provider: str
    model: str
    capabilities: List[str]
    available: bool
    version: Optional[str] = None
    parameters: Optional[str] = None


class ModelsResponse(BaseModel):
    mode: ExecutionMode
    provider: str
    base_url: Optional[str] = None
    models: List[ModelConfig]


class CreateTaskRequest(BaseModel):
    description: str
    type: TaskType = TaskType.AUTO
    files: List[UploadedFileInfo] = Field(default_factory=list)


class CreateTaskResponse(BaseModel):
    task_id: str
    status: TaskStatus
    classified_type: str
    selected_model: str
    routing_reason: str
    plan: List[Dict[str, Any]]


class PipelineStep(BaseModel):
    id: str
    index: str
    title: str
    tool: str
    description: str
    status: PipelineStatus = PipelineStatus.WAITING


class TaskSummary(BaseModel):
    id: str
    description: str
    type: str
    resolved_type: str
    status: TaskStatus
    model: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    progress: int = 0
    routing_reason: Optional[str] = None


class TaskDetail(TaskSummary):
    files: List[UploadedFileInfo]
    pipeline: List[PipelineStep]
    plan: List[Dict[str, Any]]
    result: Optional[Dict[str, Any]] = None
    artifact_id: Optional[str] = None
    security: Dict[str, Any]


class TaskListResponse(BaseModel):
    mode: ExecutionMode
    tasks: List[TaskSummary]


class DocumentInfo(BaseModel):
    id: str
    name: str
    type: str
    extension: str
    size: int
    uploaded_at: datetime
    classification: str
    owner: str
    workspace: Optional[str] = None
    indexed: bool = False
    chunks: Optional[int] = None


class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]


class AuditEvent(BaseModel):
    id: str
    timestamp: datetime
    category: AuditCategory
    action: str
    detail: str
    status: AuditStatus
    task_id: Optional[str] = None
    component: str = "backend"


class AuditResponse(BaseModel):
    events: List[AuditEvent]


class SecurityStatus(BaseModel):
    mode: ExecutionMode
    provider: str
    external_ai_calls: int
    external_data_transfers: int
    local_model_calls: int
    status: Literal["LOCAL_ONLY", "DEGRADED", "EXTERNAL_DETECTED"]
    notes: List[str]


class HealthResponse(BaseModel):
    ok: bool
    mode: ExecutionMode
    provider: str
    models_available: int
    backend_version: str


class UploadResponse(BaseModel):
    document_id: str
    name: str
    size: int
    extension: str
    classification: str
    owner: str
    stored_path: str
    workspace: str


class IngestRequest(BaseModel):
    path: str
    metadata: Optional[Dict[str, Any]] = None


class IngestResponse(BaseModel):
    document_id: str
    chunks: int
    indexed: bool


class Citation(BaseModel):
    document_id: str
    document_name: str
    chunk: int
    snippet: str
    score: float


class ArtifactInfo(BaseModel):
    id: str
    task_id: str
    filename: str
    format: str
    size: int
    created_at: datetime
