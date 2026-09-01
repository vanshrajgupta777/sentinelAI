/**
 * SentinelAI API Client
 * ============================================================
 * Talks to the local FastAPI backend. The frontend uses
 * `/api/backend/*` so the Next.js rewrite rule can proxy to
 * FastAPI in dev. In a static deployment the rewrite points at
 * the same host:port as the backend.
 *
 * Every method has a `fallback` argument: if the backend is
 * unreachable, we silently fall back to the existing in-browser
 * mock. The UI then displays a "MOCK MODE" banner so the user
 * knows what is happening. The banner disappears the moment the
 * backend is reachable.
 */
import type {
  Task,
  AuditEvent,
  LocalDocument,
  UploadedFile,
  TaskType,
} from "@/types";

const BASE = "/api/backend";

export type BackendMode = "REAL_LOCAL" | "MOCK" | "UNKNOWN";

export interface BackendHealth {
  ok: boolean;
  mode: BackendMode;
  provider: string;
  models_available: number;
}

export interface BackendModel {
  id: string;
  name: string;
  provider: string;
  model: string;
  capabilities: string[];
  available: boolean;
  version?: string;
  parameters?: string;
}

export interface BackendSecurityStatus {
  mode: BackendMode;
  provider: string;
  external_ai_calls: number;
  external_data_transfers: number;
  local_model_calls: number;
  status: string;
  notes: string[];
}

export interface BackendTask {
  id: string;
  description: string;
  type: string;
  resolved_type: string;
  status: "queued" | "processing" | "completed" | "failed";
  model: string;
  created_at: string;
  completed_at?: string | null;
  duration_ms?: number | null;
  progress: number;
  routing_reason?: string | null;
  files?: { id: string; name: string; size: number; extension: string; mime?: string | null }[];
  pipeline?: { id: string; index: string; title: string; tool: string; description: string; status: string }[];
  plan?: { index: string; title: string; tool: string; description: string; status: string }[];
  result?: any;
  artifact_id?: string | null;
  security?: { local_processing: boolean; external_calls: number; verified: boolean; local_model_calls: number };
}

export interface CreateTaskResponse {
  task_id: string;
  status: string;
  classified_type: string;
  selected_model: string;
  routing_reason: string;
  plan: { index: string; title: string; tool: string; description: string; status: string }[];
}

class BackendError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        ...(init?.headers ?? {}),
        ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!res.ok) {
      throw new BackendError(`HTTP ${res.status}`, res.status);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export const api = {
  async health(): Promise<BackendHealth | null> {
    try {
      return await request<BackendHealth>("/health");
    } catch {
      return null;
    }
  },

  async models(): Promise<{ mode: BackendMode; provider: string; base_url?: string | null; models: BackendModel[] } | null> {
    try {
      return await request("/models");
    } catch {
      return null;
    }
  },

  async securityStatus(): Promise<BackendSecurityStatus | null> {
    try {
      return await request<BackendSecurityStatus>("/security/status");
    } catch {
      return null;
    }
  },

  async audit(limit = 200): Promise<{ events: any[] } | null> {
    try {
      return await request<{ events: any[] }>(`/audit?limit=${limit}`);
    } catch {
      return null;
    }
  },

  async listTasks(): Promise<{ mode: BackendMode; tasks: BackendTask[] } | null> {
    try {
      return await request<{ mode: BackendMode; tasks: BackendTask[] }>("/tasks");
    } catch {
      return null;
    }
  },

  async getTask(id: string): Promise<BackendTask | null> {
    try {
      return await request<BackendTask>(`/tasks/${id}`);
    } catch {
      return null;
    }
  },

  async createTask(input: { description: string; type: TaskType; files: UploadedFile[] }): Promise<CreateTaskResponse | null> {
    try {
      return await request<CreateTaskResponse>("/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch {
      return null;
    }
  },

  async executeTask(id: string): Promise<BackendTask | null> {
    try {
      return await request<BackendTask>(`/tasks/${id}/execute`, { method: "POST" });
    } catch {
      return null;
    }
  },

  async listDocuments(): Promise<{ documents: LocalDocument[] } | null> {
    try {
      return await request<{ documents: LocalDocument[] }>("/documents");
    } catch {
      return null;
    }
  },

  async uploadDocument(file: File): Promise<{ document_id: string; name: string; size: number; extension: string; workspace: string } | null> {
    const fd = new FormData();
    fd.append("file", file);
    try {
      return await request("/documents/upload", { method: "POST", body: fd });
    } catch {
      return null;
    }
  },

  async deleteDocument(id: string): Promise<boolean> {
    try {
      await request(`/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
      return true;
    } catch {
      return false;
    }
  },

  async knowledgeBase(): Promise<{ documents: { id: string; name: string; chunks: number }[] } | null> {
    try {
      return await request("/documents/knowledge");
    } catch {
      return null;
    }
  },

  artifactUrl(id: string): string {
    return `${BASE}/artifacts/${encodeURIComponent(id)}`;
  },
};

export { BackendError };
