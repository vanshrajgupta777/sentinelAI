import type { Task, AuditEvent, LocalDocument } from "@/types";
import { initialTasks, initialAuditEvents, initialDocuments, initialModels, initialConnections } from "@/data/mockData";
import type { LocalModel, SecurityConnection } from "@/types";

/**
 * Application store using localStorage for V1 persistence.
 * No external AI calls. All data stays local.
 */

const STORAGE_KEY = "sentinelai.v1";

export interface AppState {
  tasks: Task[];
  audit: AuditEvent[];
  documents: LocalDocument[];
  models: LocalModel[];
  connections: SecurityConnection[];
}

const baseState: AppState = {
  tasks: initialTasks,
  audit: initialAuditEvents,
  documents: initialDocuments,
  models: initialModels,
  connections: initialConnections,
};

export function isBrowser() {
  return typeof window !== "undefined";
}

export function loadState(): AppState {
  if (!isBrowser()) return baseState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(baseState));
      return baseState;
    }
    const parsed = JSON.parse(raw) as AppState;
    return {
      tasks: parsed.tasks ?? initialTasks,
      audit: parsed.audit ?? initialAuditEvents,
      documents: parsed.documents ?? initialDocuments,
      models: parsed.models ?? initialModels,
      connections: parsed.connections ?? initialConnections,
    };
  } catch {
    return baseState;
  }
}

export function saveState(state: AppState) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function resetState() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}
