export type TaskType =
  | "auto"
  | "document-analysis"
  | "engineering-drawing"
  | "code-analysis"
  | "data-analysis"
  | "report-generation";

export type TaskStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type LocalModelId =
  | "Local-General-LLM"
  | "Local-Vision-Model"
  | "Local-Code-Model"
  | "Local-OCR";

export type PipelineStepStatus = "waiting" | "active" | "complete";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
}

export interface PipelineStep {
  id: string;
  index: string;
  title: string;
  status: PipelineStepStatus;
  tool: string;
  description: string;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface Recommendation {
  id: string;
  text: string;
}

export interface ApprovalNote {
  subject: string;
  executiveSummary: string;
  inspectionFindings: string;
  riskAssessment: string;
  recommendedActions: string;
  approvalRecommendation: string;
}

export interface DrawingDimension {
  label: string;
  value: string;
}

export interface DrawingComponent {
  id: string;
  name: string;
  quantity: number;
}

export interface DrawingAnnotation {
  id: string;
  label: string;
  note: string;
}

export interface CodeIssue {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  recommendation: string;
}

export interface TaskResult {
  summary: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  findings: Finding[];
  recommendations: Recommendation[];
  approvalNote?: ApprovalNote;
  drawing?: {
    drawingNumber: string;
    title: string;
    dimensions: DrawingDimension[];
    components: DrawingComponent[];
    annotations: DrawingAnnotation[];
    observations: string[];
  };
  code?: {
    language: string;
    filesReviewed: number;
    issues: CodeIssue[];
    summary: string;
  };
}

export interface TaskExecutionPlanStep {
  id: string;
  index: string;
  title: string;
  tool: string;
  description: string;
  status: "waiting" | "active" | "complete";
  durationMs: number;
}

export interface Task {
  id: string;
  description: string;
  type: TaskType;
  resolvedType: string;
  status: TaskStatus;
  model: LocalModelId;
  files: UploadedFile[];
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  progress: number;
  currentStage?: string;
  statusMessage?: string;
  pipeline: PipelineStep[];
  plan: TaskExecutionPlanStep[];
  result?: TaskResult;
  security: {
    localProcessing: boolean;
    externalCalls: number;
    verified: boolean;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  category: "TASKS" | "DOCUMENTS" | "AI" | "SECURITY" | "RAG";
  action: string;
  detail: string;
  status: "INFO" | "SUCCESS" | "WARN" | "ERROR";
  taskId?: string;
}

export interface LocalModel {
  id: LocalModelId;
  name: string;
  description: string;
  status: "READY" | "BUSY" | "OFFLINE";
  version: string;
  capabilities: string[];
  parameters: string;
}

export interface LocalDocument {
  id: string;
  name: string;
  type: string;
  extension: string;
  size: number;
  uploadedAt: string;
  status: "INDEXED" | "PROCESSED" | "PENDING";
  classification: "CONFIDENTIAL" | "INTERNAL" | "RESTRICTED";
  owner: string;
}

export interface SecurityConnection {
  id: string;
  time: string;
  service: string;
  destination: string;
  status: "ALLOWED" | "BLOCKED";
  protocol: string;
}

export interface DemoScenario {
  id: string;
  number: string;
  title: string;
  description: string;
  workflow: string[];
  taskType: TaskType;
  description_prompt: string;
  files: { name: string; size: number; type: string; extension: string }[];
}
