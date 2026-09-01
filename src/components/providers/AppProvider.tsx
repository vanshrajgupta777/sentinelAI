"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Task,
  AuditEvent,
  LocalDocument,
  LocalModel,
  SecurityConnection,
  UploadedFile,
  TaskType,
} from "@/types";
import { api, type BackendMode, type BackendModel, type BackendTask } from "@/services/apiClient";
import { runMockExecution, buildMockTask } from "@/services/mockAiService";
import { buildTaskAuditTrail, makeAuditEvent } from "@/services/auditService";
import {
  initialTasks,
  initialAuditEvents,
  initialDocuments,
  initialModels,
  initialConnections,
} from "@/data/mockData";

interface AppContextValue {
  // state
  tasks: Task[];
  audit: AuditEvent[];
  documents: LocalDocument[];
  models: LocalModel[];
  connections: SecurityConnection[];
  // status
  backendMode: BackendMode;
  backendProvider: string;
  backendReachable: boolean;
  backendNote: string | null;
  // counts
  activeTaskCount: number;
  documentsProcessed: number;
  securityEventCount: number;
  externalAiCalls: number;
  localModelCalls: number;
  // task actions
  submitTask: (input: {
    description: string;
    type: TaskType;
    files: UploadedFile[];
  }) => Promise<Task>;
  retryTask: (taskId: string) => void;
  // demo
  runDemo: (input: {
    description: string;
    type: TaskType;
    files: UploadedFile[];
  }) => Promise<Task>;
  // documents
  addDocument: (doc: Omit<LocalDocument, "id" | "uploadedAt" | "status" | "classification" | "owner"> & { file?: File }) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  refreshBackend: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [audit, setAudit] = useState<AuditEvent[]>(initialAuditEvents);
  const [documents, setDocuments] = useState<LocalDocument[]>(initialDocuments);
  const [models, setModels] = useState<LocalModel[]>(initialModels);
  const [connections, setConnections] = useState<SecurityConnection[]>(initialConnections);

  const [backendMode, setBackendMode] = useState<BackendMode>("UNKNOWN");
  const [backendProvider, setBackendProvider] = useState<string>("local-inprocess");
  const [backendReachable, setBackendReachable] = useState<boolean>(false);
  const [backendNote, setBackendNote] = useState<string | null>(null);
  const [externalAiCalls, setExternalAiCalls] = useState(0);
  const [localModelCalls, setLocalModelCalls] = useState(0);

  const pollers = useRef<{ tasks?: ReturnType<typeof setInterval>; audit?: ReturnType<typeof setInterval> }>({});

  // Convert a backend task into the shape the UI expects.
  const adaptTask = (b: BackendTask): Task => {
    const pipeline: Task["pipeline"] = (b.pipeline ?? []).map((p, i) => ({
      id: p.id || `p${i + 1}`,
      index: p.index || String(i + 1).padStart(2, "0"),
      title: p.title,
      tool: p.tool,
      description: p.description,
      status: (p.status as Task["pipeline"][number]["status"]) || "waiting",
    }));
    const plan: Task["plan"] = (b.plan ?? []).map((p, i) => ({
      id: `${b.id}-pl-${i}`,
      index: p.index,
      title: p.title,
      tool: p.tool,
      description: p.description,
      status: (p.status as Task["plan"][number]["status"]) || "waiting",
      durationMs: 0,
    }));
    const files: UploadedFile[] = (b.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.mime ?? "application/octet-stream",
      extension: f.extension,
    }));
    return {
      id: b.id,
      description: b.description,
      type: (b.type as TaskType) || "auto",
      resolvedType: b.resolved_type,
      status: b.status as Task["status"],
      model: (b.model as Task["model"]) || "Local-General-LLM",
      files,
      createdAt: b.created_at,
      completedAt: b.completed_at ?? undefined,
      durationMs: b.duration_ms ?? undefined,
      progress: b.progress ?? 0,
      currentStage: b.status === "completed" ? "Security Verification" : "Processing",
      statusMessage: b.status === "completed" ? "Completed securely" : "Processing locally...",
      pipeline: pipeline as Task["pipeline"],
      plan: plan as Task["plan"],
      result: b.result,
      security: {
        localProcessing: b.security?.local_processing ?? true,
        externalCalls: b.security?.external_calls ?? 0,
        verified: b.security?.verified ?? b.status === "completed",
      },
    };
  };

  const adaptModels = (bm: BackendModel[]): LocalModel[] => {
    return bm.map((m) => ({
      id: m.name as LocalModel["id"],
      name: m.name,
      description: m.capabilities.join(", "),
      status: m.available ? "READY" : "OFFLINE",
      version: m.version ?? "v1",
      capabilities: m.capabilities,
      parameters: m.parameters ?? "—",
    }));
  };

  const appendAudit = useCallback((events: AuditEvent[]) => {
    setAudit((prev) => [...events, ...prev]);
  }, []);

  const refreshBackend = useCallback(async () => {
    const [health, modelList, sec] = await Promise.all([
      api.health(),
      api.models(),
      api.securityStatus(),
    ]);
    if (!health) {
      setBackendReachable(false);
      setBackendMode("MOCK");
      setBackendProvider("local-inprocess (offline)");
      setBackendNote(
        "FastAPI backend is not reachable. The UI is running in clearly-labelled MOCK MODE so the experience still works without local infrastructure. Start the backend (see README) to enable REAL LOCAL MODE.",
      );
      return;
    }
    setBackendReachable(true);
    setBackendMode(health.mode);
    setBackendProvider(health.provider);
    if (modelList) {
      setModels(adaptModels(modelList.models));
    }
    if (sec) {
      setExternalAiCalls(sec.external_ai_calls);
      setLocalModelCalls(sec.local_model_calls);
    }
    setBackendNote(
      health.mode === "REAL_LOCAL"
        ? "Connected to the local FastAPI backend. All inference is performed locally via the configured model provider."
        : "Connected to the local FastAPI backend. Running in MOCK MODE (Ollama not detected) — configure OLLAMA_BASE_URL or LLM_PROVIDER=ollama to switch to REAL LOCAL MODE.",
    );

    // Pull tasks/audit from the backend
    const taskList = await api.listTasks();
    if (taskList) {
      setTasks(taskList.tasks.map(adaptTask));
    }
    const auditList = await api.audit(200);
    if (auditList) {
      setAudit(
        auditList.events.map((e: any) => ({
          id: e.id,
          timestamp: e.timestamp,
          category: e.category,
          action: e.action,
          detail: e.detail,
          status: e.status,
          taskId: e.task_id ?? undefined,
        })),
      );
    }
  }, []);

  useEffect(() => {
    void refreshBackend();
    // Poll for task progress so the execution screen stays live.
    pollers.current.tasks = setInterval(async () => {
      if (!backendReachable) return;
      const tl = await api.listTasks();
      if (tl) {
        setTasks(tl.tasks.map(adaptTask));
      }
    }, 1500);
    pollers.current.audit = setInterval(async () => {
      if (!backendReachable) return;
      const al = await api.audit(100);
      if (al) {
        setAudit(
          al.events.map((e: any) => ({
            id: e.id,
            timestamp: e.timestamp,
            category: e.category,
            action: e.action,
            detail: e.detail,
            status: e.status,
            taskId: e.task_id ?? undefined,
          })),
        );
      }
    }, 4000);
    return () => {
      if (pollers.current.tasks) clearInterval(pollers.current.tasks);
      if (pollers.current.audit) clearInterval(pollers.current.audit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendReachable]);

  const updateTask = useCallback((updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const submitTask = useCallback(
    async (input: { description: string; type: TaskType; files: UploadedFile[] }): Promise<Task> => {
      // 1) Try the real backend
      if (backendReachable) {
        const created = await api.createTask(input);
        if (created) {
          const detail = await api.getTask(created.task_id);
          if (detail) {
            const task = adaptTask(detail);
            setTasks((prev) => [task, ...prev]);
            // Fire-and-forget execution
            void (async () => {
              const exec = await api.executeTask(created.task_id);
              if (exec) {
                setTasks((prev) => prev.map((t) => (t.id === exec.id ? adaptTask(exec) : t)));
              }
            })();
            return task;
          }
        }
      }
      // 2) Fallback to local mock
      const task = buildMockTask(input);
      setTasks((prev) => [task, ...prev]);
      appendAudit([
        makeAuditEvent("TASKS", "TASK_CREATED", "Task submitted to orchestrator", "INFO", task.id),
        makeAuditEvent("TASKS", "TASK_CLASSIFIED", task.resolvedType, "INFO", task.id),
        makeAuditEvent("AI", "MODEL_SELECTED", task.model, "INFO", task.id),
        makeAuditEvent("TASKS", "PLAN_CREATED", `${task.plan.length} execution steps`, "INFO", task.id),
      ]);
      runMockExecution(
        task,
        (t) => updateTask(t),
        (final) => {
          setTasks((prev) => prev.map((t) => (t.id === final.id ? final : t)));
          appendAudit(buildTaskAuditTrail(final.id, final.model));
        },
      );
      return task;
    },
    [backendReachable, appendAudit, updateTask],
  );

  const runDemo = useCallback(
    async (input: { description: string; type: TaskType; files: UploadedFile[] }): Promise<Task> => {
      return submitTask(input);
    },
    [submitTask],
  );

  const retryTask = useCallback(
    async (taskId: string) => {
      const existing = tasks.find((t) => t.id === taskId);
      if (!existing) return;
      await submitTask({
        description: existing.description,
        type: existing.type,
        files: existing.files,
      });
    },
    [submitTask, tasks],
  );

  const addDocument = useCallback(
    async (
      doc: Omit<LocalDocument, "id" | "uploadedAt" | "status" | "classification" | "owner"> & {
        file?: File;
      },
    ) => {
      if (backendReachable && doc.file) {
        const res = await api.uploadDocument(doc.file);
        if (res) {
          const list = await api.listDocuments();
          if (list) {
            setDocuments(list.documents);
          }
          appendAudit([
            makeAuditEvent("DOCUMENTS", "DOCUMENT_UPLOADED", `${doc.name} uploaded via backend`, "INFO"),
          ]);
          return;
        }
      }
      const newDoc: LocalDocument = {
        ...doc,
        id: `doc-${Math.floor(Math.random() * 1_000_000)}`,
        uploadedAt: new Date().toISOString(),
        status: "INDEXED",
        classification: "CONFIDENTIAL",
        owner: "Current User",
      };
      setDocuments((prev) => [newDoc, ...prev]);
      appendAudit([
        makeAuditEvent("DOCUMENTS", "DOCUMENT_UPLOADED", `${doc.name} added to local repository`, "INFO"),
      ]);
    },
    [backendReachable, appendAudit],
  );

  const removeDocument = useCallback(
    async (id: string) => {
      if (backendReachable) {
        const ok = await api.deleteDocument(id);
        if (ok) {
          const list = await api.listDocuments();
          if (list) setDocuments(list.documents);
        }
      } else {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
      appendAudit([
        makeAuditEvent("DOCUMENTS", "DOCUMENT_REMOVED", `Document ${id} removed from local repository`, "WARN"),
      ]);
    },
    [backendReachable, appendAudit],
  );

  const activeTaskCount = tasks.filter((t) => t.status === "processing").length;
  const documentsProcessed = documents.length;
  const securityEventCount = audit.filter(
    (a) => a.category === "SECURITY" && (a.status === "WARN" || a.status === "ERROR"),
  ).length;

  const value: AppContextValue = useMemo(
    () => ({
      tasks,
      audit,
      documents,
      models,
      connections,
      backendMode,
      backendProvider,
      backendReachable,
      backendNote,
      activeTaskCount,
      documentsProcessed,
      securityEventCount,
      externalAiCalls,
      localModelCalls,
      submitTask,
      retryTask,
      runDemo,
      addDocument,
      removeDocument,
      refreshBackend,
    }),
    [
      tasks,
      audit,
      documents,
      models,
      connections,
      backendMode,
      backendProvider,
      backendReachable,
      backendNote,
      activeTaskCount,
      documentsProcessed,
      securityEventCount,
      externalAiCalls,
      localModelCalls,
      submitTask,
      retryTask,
      runDemo,
      addDocument,
      removeDocument,
      refreshBackend,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
