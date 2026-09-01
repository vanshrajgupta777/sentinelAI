"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { loadState, saveState } from "@/services/store";
import { buildTaskAuditTrail, makeAuditEvent } from "@/services/auditService";
import { createNewTask, runTaskExecution } from "@/services/mockAiService";
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
  // counts
  activeTaskCount: number;
  documentsProcessed: number;
  securityEventCount: number;
  // task actions
  submitTask: (input: {
    description: string;
    type: TaskType;
    files: UploadedFile[];
  }) => Task;
  retryTask: (taskId: string) => void;
  // demo
  runDemo: (input: {
    description: string;
    type: TaskType;
    files: UploadedFile[];
  }) => Task;
  // documents
  addDocument: (doc: Omit<LocalDocument, "id" | "uploadedAt" | "status" | "classification" | "owner">) => void;
  removeDocument: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [audit, setAudit] = useState<AuditEvent[]>(initialAuditEvents);
  const [documents, setDocuments] = useState<LocalDocument[]>(initialDocuments);
  const [models, setModels] = useState<LocalModel[]>(initialModels);
  const [connections, setConnections] = useState<SecurityConnection[]>(initialConnections);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = loadState();
    setTasks(s.tasks);
    setAudit(s.audit);
    setDocuments(s.documents);
    setModels(s.models);
    setConnections(s.connections);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState({ tasks, audit, documents, models, connections });
  }, [hydrated, tasks, audit, documents, models, connections]);

  const appendAudit = useCallback((events: AuditEvent[]) => {
    setAudit((prev) => [...events, ...prev]);
  }, []);

  const updateTask = useCallback((updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const completeTask = useCallback(
    (taskId: string, model: string, final: Task) => {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? final : t)));
      appendAudit(buildTaskAuditTrail(taskId, model));
      // log blocked external request periodically for realism
      if (Math.random() > 0.6) {
        appendAudit([
          makeAuditEvent(
            "SECURITY",
            "EXTERNAL_REQUEST_BLOCKED",
            "Outbound request to api.external-ai.com blocked by policy",
            "WARN",
          ),
        ]);
      }
    },
    [appendAudit],
  );

  const submitTask = useCallback(
    (input: { description: string; type: TaskType; files: UploadedFile[] }): Task => {
      const task = createNewTask(input);
      setTasks((prev) => [task, ...prev]);
      appendAudit([
        makeAuditEvent("TASKS", "TASK_CREATED", "Task submitted to orchestrator", "INFO", task.id),
        makeAuditEvent("TASKS", "TASK_CLASSIFIED", task.resolvedType, "INFO", task.id),
        makeAuditEvent("AI", "MODEL_SELECTED", task.model, "INFO", task.id),
        makeAuditEvent("TASKS", "PLAN_CREATED", `${task.plan.length} execution steps`, "INFO", task.id),
      ]);
      runTaskExecution(
        task,
        (t) => updateTask(t),
        (final) => completeTask(task.id, task.model, final),
      );
      return task;
    },
    [appendAudit, completeTask, updateTask],
  );

  const runDemo = useCallback(
    (input: { description: string; type: TaskType; files: UploadedFile[] }): Task => {
      return submitTask(input);
    },
    [submitTask],
  );

  const retryTask = useCallback(
    (taskId: string) => {
      const existing = tasks.find((t) => t.id === taskId);
      if (!existing) return;
      const input = {
        description: existing.description,
        type: existing.type,
        files: existing.files,
      };
      submitTask(input);
    },
    [submitTask, tasks],
  );

  const addDocument = useCallback(
    (doc: Omit<LocalDocument, "id" | "uploadedAt" | "status" | "classification" | "owner">) => {
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
    [appendAudit],
  );

  const removeDocument = useCallback(
    (id: string) => {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      appendAudit([
        makeAuditEvent("DOCUMENTS", "DOCUMENT_REMOVED", `Document ${id} removed from local repository`, "WARN"),
      ]);
    },
    [appendAudit],
  );

  const activeTaskCount = tasks.filter((t) => t.status === "processing").length;
  const documentsProcessed = documents.length;
  const securityEventCount = audit.filter(
    (a) => a.category === "SECURITY" && a.status === "WARN",
  ).length;

  const value: AppContextValue = useMemo(
    () => ({
      tasks,
      audit,
      documents,
      models,
      connections,
      activeTaskCount,
      documentsProcessed,
      securityEventCount,
      submitTask,
      retryTask,
      runDemo,
      addDocument,
      removeDocument,
    }),
    [
      tasks,
      audit,
      documents,
      models,
      connections,
      activeTaskCount,
      documentsProcessed,
      securityEventCount,
      submitTask,
      retryTask,
      runDemo,
      addDocument,
      removeDocument,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
