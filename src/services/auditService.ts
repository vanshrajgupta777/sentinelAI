import type { AuditEvent } from "@/types";

let counter = 100;
export function makeAuditEvent(
  category: AuditEvent["category"],
  action: string,
  detail: string,
  status: AuditEvent["status"] = "INFO",
  taskId?: string,
): AuditEvent {
  counter += 1;
  return {
    id: `ev-${Date.now()}-${counter}`,
    timestamp: new Date().toISOString(),
    category,
    action,
    detail,
    status,
    taskId,
  };
}

export function buildTaskAuditTrail(taskId: string, model: string): AuditEvent[] {
  const t = new Date();
  return [
    {
      id: `${taskId}-1`,
      timestamp: new Date(t.getTime() - 8000).toISOString(),
      category: "TASKS",
      action: "TASK_CREATED",
      detail: "Inspection report submitted",
      status: "INFO",
      taskId,
    },
    {
      id: `${taskId}-2`,
      timestamp: new Date(t.getTime() - 7500).toISOString(),
      category: "TASKS",
      action: "TASK_CLASSIFIED",
      detail: "Document Analysis",
      status: "INFO",
      taskId,
    },
    {
      id: `${taskId}-3`,
      timestamp: new Date(t.getTime() - 7000).toISOString(),
      category: "AI",
      action: "MODEL_SELECTED",
      detail: model,
      status: "INFO",
      taskId,
    },
    {
      id: `${taskId}-4`,
      timestamp: new Date(t.getTime() - 6500).toISOString(),
      category: "TASKS",
      action: "PLAN_CREATED",
      detail: "6 execution steps",
      status: "INFO",
      taskId,
    },
    {
      id: `${taskId}-5`,
      timestamp: new Date(t.getTime() - 4000).toISOString(),
      category: "DOCUMENTS",
      action: "DOCUMENT_PROCESSED",
      detail: "inspection_report.pdf",
      status: "INFO",
      taskId,
    },
    {
      id: `${taskId}-6`,
      timestamp: new Date(t.getTime() - 1500).toISOString(),
      category: "AI",
      action: "RESULT_GENERATED",
      detail: "Approval note created",
      status: "SUCCESS",
      taskId,
    },
    {
      id: `${taskId}-7`,
      timestamp: new Date(t.getTime() - 500).toISOString(),
      category: "SECURITY",
      action: "SECURITY_CHECK",
      detail: "No external API calls",
      status: "SUCCESS",
      taskId,
    },
  ];
}
