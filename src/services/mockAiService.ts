import type {
  Task,
  TaskResult,
  TaskType,
  LocalModelId,
  TaskExecutionPlanStep,
  Finding,
  Recommendation,
  ApprovalNote,
  CodeIssue,
  DrawingDimension,
  DrawingComponent,
  DrawingAnnotation,
} from "@/types";

/**
 * Local Mock AI Service
 * --------------------------------------------------------------
 * SentinelAI V1 simulates local AI capabilities. The UI presents
 * local models (Local-General-LLM, Local-Vision-Model,
 * Local-Code-Model, Local-OCR) as target capabilities. The actual
 * inference is mocked locally; nothing leaves the application.
 */

const classificationMap: Record<string, { type: string; model: LocalModelId }> = {
  "document-analysis": { type: "Document Analysis", model: "Local-General-LLM" },
  "engineering-drawing": { type: "Vision Analysis", model: "Local-Vision-Model" },
  "code-analysis": { type: "Code Analysis", model: "Local-Code-Model" },
  "data-analysis": { type: "Data Analysis", model: "Local-General-LLM" },
  "report-generation": { type: "Report Generation", model: "Local-General-LLM" },
};

export function classifyTask(type: TaskType, description: string): { type: string; model: LocalModelId } {
  if (type !== "auto") {
    return classificationMap[type] ?? classificationMap["document-analysis"];
  }
  const text = description.toLowerCase();
  if (/(drawing|schematic|diagram|blueprint|cad|\.dwg|\.png|\.jpg)/.test(text)) {
    return classificationMap["engineering-drawing"];
  }
  if (/(code|repository|function|class|api|typescript|python|java)/.test(text)) {
    return classificationMap["code-analysis"];
  }
  if (/(data|dataset|csv|spreadsheet|metrics|trend)/.test(text)) {
    return classificationMap["data-analysis"];
  }
  if (/(report|approval note|executive|briefing|memo)/.test(text)) {
    return classificationMap["report-generation"];
  }
  return classificationMap["document-analysis"];
}

export function selectModel(type: TaskType, description: string): { resolvedType: string; model: LocalModelId } {
  const c = classifyTask(type, description);
  return { resolvedType: c.type, model: c.model };
}

interface PlanTemplate {
  steps: Omit<TaskExecutionPlanStep, "id" | "status">[];
}

const planTemplates: Record<string, PlanTemplate> = {
  "Document Analysis": {
    steps: [
      { index: "01", title: "Read uploaded document", tool: "Local-OCR", description: "Extract text from PDF", durationMs: 1100 },
      { index: "02", title: "Extract relevant information", tool: "Local-General-LLM", description: "Identify entities, dates, equipment IDs", durationMs: 1300 },
      { index: "03", title: "Identify critical findings", tool: "Local-General-LLM", description: "Classify severity", durationMs: 1500 },
      { index: "04", title: "Assess operational risks", tool: "Local-General-LLM", description: "Risk categorization", durationMs: 1300 },
      { index: "05", title: "Summarize findings", tool: "Local-General-LLM", description: "Executive summary", durationMs: 1100 },
      { index: "06", title: "Generate approval note", tool: "Local-General-LLM", description: "Format management note", durationMs: 1500 },
    ],
  },
  "Vision Analysis": {
    steps: [
      { index: "01", title: "Pre-process drawing", tool: "Local-Vision-Model", description: "Normalize scale, remove noise", durationMs: 900 },
      { index: "02", title: "Detect regions of interest", tool: "Local-Vision-Model", description: "Identify title block, dimensions, parts", durationMs: 1100 },
      { index: "03", title: "Extract dimensions", tool: "Local-Vision-Model", description: "Parse dimensional annotations", durationMs: 1300 },
      { index: "04", title: "Identify components", tool: "Local-Vision-Model", description: "Map BOM items to drawing", durationMs: 1200 },
      { index: "05", title: "Compile structured result", tool: "Local-Vision-Model", description: "Generate output table", durationMs: 1000 },
    ],
  },
  "Code Analysis": {
    steps: [
      { index: "01", title: "Index source files", tool: "Local-Code-Model", description: "Walk repository", durationMs: 1500 },
      { index: "02", title: "Static analysis pass", tool: "Local-Code-Model", description: "Find common patterns", durationMs: 2200 },
      { index: "03", title: "Security review", tool: "Local-Code-Model", description: "Identify vulnerable patterns", durationMs: 2400 },
      { index: "04", title: "Generate recommendations", tool: "Local-Code-Model", description: "Produce fix suggestions", durationMs: 1800 },
    ],
  },
  "Data Analysis": {
    steps: [
      { index: "01", title: "Ingest data", tool: "Local-General-LLM", description: "Parse tabular input", durationMs: 1100 },
      { index: "02", title: "Statistical summary", tool: "Local-General-LLM", description: "Mean, variance, outliers", durationMs: 1500 },
      { index: "03", title: "Trend detection", tool: "Local-General-LLM", description: "Identify patterns", durationMs: 1400 },
      { index: "04", title: "Generate report", tool: "Local-General-LLM", description: "Insights + recommendations", durationMs: 1200 },
    ],
  },
  "Report Generation": {
    steps: [
      { index: "01", title: "Collect source material", tool: "Local-General-LLM", description: "Aggregate inputs", durationMs: 1100 },
      { index: "02", title: "Outline structure", tool: "Local-General-LLM", description: "Define sections", durationMs: 1000 },
      { index: "03", title: "Draft content", tool: "Local-General-LLM", description: "Write sections", durationMs: 1800 },
      { index: "04", title: "Format report", tool: "Local-General-LLM", description: "Apply enterprise template", durationMs: 1300 },
    ],
  },
};

export function createExecutionPlan(resolvedType: string, model: LocalModelId): TaskExecutionPlanStep[] {
  const template = planTemplates[resolvedType] ?? planTemplates["Document Analysis"];
  return template.steps.map((step, i) => ({
    ...step,
    id: `pl-${Date.now()}-${i}`,
    status: "waiting" as const,
  }));
}

function approvalNoteFromFindings(findings: Finding[], subject: string): ApprovalNote {
  const findingsText = findings
    .map((f) => `• ${f.title} (${f.severity}): ${f.description}`)
    .join("\n");
  return {
    subject,
    executiveSummary:
      "Inspection completed. The team identified a small number of medium-severity findings with no immediate safety risk. Corrective action is recommended within 14 days.",
    inspectionFindings: findingsText,
    riskAssessment:
      "Overall risk classified as MEDIUM. Continued operation is acceptable with monitored duty; however, deferring corrective action beyond 30 days elevates the risk profile.",
    recommendedActions:
      "1) Schedule follow-up inspection within 14 days. 2) Brief operations on revised operating envelope. 3) Record corrective action in CMMS. 4) Notify reliability engineering.",
    approvalRecommendation:
      "Recommended for approval. Subject to corrective action completion within 14 days and follow-up inspection report.",
  };
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function inspectionResult(description: string): TaskResult {
  const subject = "Equipment Inspection Approval Note";
  const findings: Finding[] = [
    {
      id: makeId("f"),
      title: "Abnormal vibration on Pump P-204",
      description:
        "Vibration readings exceeded ISO 10816-3 alert threshold by 18% during sustained operation. Probable root cause is bearing wear.",
      severity: "MEDIUM",
    },
    {
      id: makeId("f"),
      title: "Maintenance interval exceeded",
      description:
        "Last scheduled overhaul of Pump P-204 was 11,200 operating hours ago, exceeding the recommended 10,000 hour interval.",
      severity: "MEDIUM",
    },
    {
      id: makeId("f"),
      title: "Bearing temperature trending upward",
      description:
        "Average bearing temperature has risen 4.2°C over the last 30 days, indicating progressive wear.",
      severity: "MEDIUM",
    },
    {
      id: makeId("f"),
      title: "Additional inspection recommended",
      description:
        "Borescope inspection deferred from prior cycle. Recommended before returning equipment to full duty.",
      severity: "LOW",
    },
  ];
  const recommendations: Recommendation[] = [
    { id: makeId("r"), text: "Schedule vibration analysis and borescope inspection within 14 days." },
    { id: makeId("r"), text: "Review maintenance history and update overhaul plan for Pump P-204." },
    { id: makeId("r"), text: "Brief operations team on revised operating envelope until corrective action." },
    { id: makeId("r"), text: "Record corrective action in CMMS and notify reliability engineering." },
  ];
  return {
    summary:
      "Inspection of Pump P-204 at the Asterion Industrial Systems refinery unit identified three medium-severity findings related to vibration, bearing condition and maintenance interval compliance. Overall risk is rated MEDIUM and corrective action is recommended within 14 days.",
    riskLevel: "MEDIUM",
    findings,
    recommendations,
    approvalNote: approvalNoteFromFindings(findings, subject),
  };
}

function drawingResult(): TaskResult {
  const dimensions: DrawingDimension[] = [
    { label: "Overall Length", value: "1,420 mm" },
    { label: "Overall Width", value: "640 mm" },
    { label: "Overall Height", value: "780 mm" },
    { label: "Shaft Diameter", value: "85 mm" },
    { label: "Casing Wall Thickness", value: "14 mm" },
    { label: "Bore Diameter", value: "120 mm" },
    { label: "Flange Bolt Circle", value: "Ø 220 mm" },
  ];
  const components: DrawingComponent[] = [
    { id: "c1", name: "Casing", quantity: 1 },
    { id: "c2", name: "Impeller", quantity: 1 },
    { id: "c3", name: "Shaft", quantity: 1 },
    { id: "c4", name: "Bearing Assembly", quantity: 2 },
    { id: "c5", name: "Mechanical Seal", quantity: 1 },
    { id: "c6", name: "Coupling", quantity: 1 },
    { id: "c7", name: "Bolt Set M16", quantity: 12 },
  ];
  const annotations: DrawingAnnotation[] = [
    { id: "n1", label: "A", note: "Surface roughness Ra 1.6" },
    { id: "n2", label: "B", note: "Pressure test at 1.5x design pressure" },
    { id: "n3", label: "C", note: "Balance grade G6.3 per ISO 1940" },
    { id: "n4", label: "D", note: "Material: ASTM A216 WCB" },
  ];
  return {
    summary:
      "Vision analysis of the pump assembly drawing extracted 7 dimensions, 7 component items and 4 surface/material annotations. Drawing conforms to typical industrial assembly conventions.",
    riskLevel: "LOW",
    findings: [
      { id: makeId("f"), title: "Drawing revision R3 detected", description: "Title block indicates revision R3, dated 2026-06-14.", severity: "LOW" },
      { id: makeId("f"), title: "Material specification present", description: "All major components have material callouts.", severity: "LOW" },
      { id: makeId("f"), title: "Tolerance stack-up flagged", description: "Dimensional tolerance chain on shaft assembly may exceed recommended 0.05mm.", severity: "MEDIUM" },
    ],
    recommendations: [
      { id: makeId("r"), text: "Verify latest revision with mechanical design before fabrication." },
      { id: makeId("r"), text: "Review tolerance stack-up on shaft assembly with manufacturing." },
      { id: makeId("r"), text: "Confirm flange bolt torque sequence with assembly procedure." },
    ],
    drawing: {
      drawingNumber: "AST-PA-204-R3",
      title: "Pump Assembly — P-204",
      dimensions,
      components,
      annotations,
      observations: [
        "Title block and revision index are present and legible.",
        "All critical dimensions have tolerance callouts.",
        "Surface finish and balance grades are specified for rotating components.",
        "Material callouts present for all primary components.",
      ],
    },
  };
}

function codeResult(): TaskResult {
  const issues: CodeIssue[] = [
    { id: makeId("i"), title: "Hard-coded credentials", severity: "HIGH", description: "config/service.ts:42 — string literal resembles API key", recommendation: "Use env-backed secret loader." },
    { id: makeId("i"), title: "SQL injection risk", severity: "HIGH", description: "db/users.ts:118 — string concatenation in query", recommendation: "Switch to parameterized query." },
    { id: makeId("i"), title: "Swallowed exception", severity: "MEDIUM", description: "jobs/sync.ts:84 — empty catch block", recommendation: "Log error context and rethrow." },
    { id: makeId("i"), title: "Missing type guard", severity: "MEDIUM", description: "api/handlers.ts:201 — unsafe cast", recommendation: "Add zod schema." },
    { id: makeId("i"), title: "Deprecated API usage", severity: "LOW", description: "utils/fs.ts:55 — uses legacy fs API", recommendation: "Replace with fs.promises." },
    { id: makeId("i"), title: "Console logging in production", severity: "LOW", description: "12 files reference console.log", recommendation: "Use structured logger." },
    { id: makeId("i"), title: "Outdated dependency", severity: "MEDIUM", description: "package.json — 3 packages have known advisories", recommendation: "Plan upgrade cycle." },
  ];
  return {
    summary:
      "Static review of the internal code archive found 7 issues across 6 files, including 2 high-severity security concerns and 3 medium-severity code quality issues.",
    riskLevel: "MEDIUM",
    findings: [
      { id: makeId("f"), title: "Hard-coded API key pattern", description: "String literal resembling an API key detected in config/service.ts.", severity: "HIGH" },
      { id: makeId("f"), title: "SQL injection risk", description: "User input is concatenated into a database query in 2 locations.", severity: "HIGH" },
      { id: makeId("f"), title: "Swallowed exceptions", description: "Empty catch blocks in 3 functions suppress error context.", severity: "MEDIUM" },
    ],
    recommendations: [
      { id: makeId("r"), text: "Move secrets to a local secrets manager and rotate any exposed keys." },
      { id: makeId("r"), text: "Refactor database calls to use parameterized queries." },
      { id: makeId("r"), text: "Add structured logging to error handling paths." },
      { id: makeId("r"), text: "Schedule follow-up review after fixes." },
    ],
    code: {
      language: "TypeScript",
      filesReviewed: 42,
      summary: "7 issues found across 6 files. 2 high, 3 medium, 2 low severity.",
      issues,
    },
  };
}

function dataResult(): TaskResult {
  return {
    summary:
      "Analysis of the operational dataset shows stable throughput with a mild upward trend in mean cycle time over the last 30 days. Two outlier shifts were identified and correlate with maintenance events.",
    riskLevel: "LOW",
    findings: [
      { id: makeId("f"), title: "Throughput stable", description: "Daily throughput within ±3% of 30-day mean.", severity: "LOW" },
      { id: makeId("f"), title: "Cycle time trending up", description: "Mean cycle time increased 2.1% over 30 days.", severity: "LOW" },
      { id: makeId("f"), title: "Outlier shifts", description: "Two shifts exceed 2σ cycle time and align with maintenance events.", severity: "MEDIUM" },
    ],
    recommendations: [
      { id: makeId("r"), text: "Continue current operations with standard monitoring." },
      { id: makeId("r"), text: "Schedule trend review at end of next cycle." },
      { id: makeId("r"), text: "Document outlier shifts in reliability log." },
    ],
  };
}

function reportResult(description: string): TaskResult {
  return {
    summary:
      "Report generated locally from provided source material. Content is summarized for management review with no external processing.",
    riskLevel: "LOW",
    findings: [
      { id: makeId("f"), title: "Source material aggregated", description: "2 documents and 1 dataset were referenced.", severity: "LOW" },
    ],
    recommendations: [
      { id: makeId("r"), text: "Distribute report to internal stakeholders only." },
      { id: makeId("r"), text: "Schedule review meeting within 7 days." },
    ],
  };
}

export function generateResult(resolvedType: string, description: string): TaskResult {
  switch (resolvedType) {
    case "Vision Analysis":
      return drawingResult();
    case "Code Analysis":
      return codeResult();
    case "Data Analysis":
      return dataResult();
    case "Report Generation":
      return reportResult(description);
    case "Document Analysis":
    default:
      return inspectionResult(description);
  }
}

export function createNewTask(input: {
  description: string;
  type: TaskType;
  files: { id: string; name: string; size: number; type: string; extension: string }[];
}): Task {
  const { resolvedType, model } = selectModel(input.type, input.description);
  const plan = createExecutionPlan(resolvedType, model);
  const id = `TSK-${Math.floor(7800 + Math.random() * 200)}`;
  const now = new Date().toISOString();
  const pipeline = [
    { id: "p1", index: "01", title: "Task Classification", status: "complete" as const, tool: "Classifier", description: resolvedType },
    { id: "p2", index: "02", title: "Local Model Selection", status: "complete" as const, tool: "Router", description: model },
    { id: "p3", index: "03", title: "Execution Planning", status: "complete" as const, tool: "Orchestrator", description: "Plan generated" },
    { id: "p4", index: "04", title: "Document Processing", status: input.files.length > 0 ? ("active" as const) : ("waiting" as const), tool: model === "Local-Vision-Model" ? "Local-Vision-Model" : "Local-OCR", description: input.files.length > 0 ? "Processing" : "No file" },
    { id: "p5", index: "05", title: "AI Analysis", status: "waiting" as const, tool: model, description: "Pending" },
    { id: "p6", index: "06", title: "Result Generation", status: "waiting" as const, tool: model, description: "Pending" },
    { id: "p7", index: "07", title: "Security Verification", status: "waiting" as const, tool: "Security Module", description: "Pending" },
  ];
  return {
    id,
    description: input.description,
    type: input.type,
    resolvedType,
    status: "processing",
    model,
    files: input.files,
    createdAt: now,
    progress: 8,
    currentStage: "Document Processing",
    statusMessage: "Reading document...",
    pipeline,
    plan,
    security: { localProcessing: true, externalCalls: 0, verified: false },
  };
}

export function runTaskExecution(
  task: Task,
  onUpdate: (t: Task) => void,
  onComplete: (t: Task) => void,
) {
  const stageMessages: Record<string, string[]> = {
    "01 — Task Classification": ["Classifying task..."],
    "02 — Local Model Selection": ["Selecting local model..."],
    "03 — Execution Planning": ["Creating execution plan..."],
    "04 — Document Processing": ["Reading document...", "Extracting relevant information..."],
    "05 — AI Analysis": ["Analyzing findings...", "Assessing operational risks..."],
    "06 — Result Generation": ["Preparing approval note..."],
    "07 — Security Verification": ["Verifying security status..."],
  };

  const stageMap: Array<{ pipelineIndex: number; planIndices: number[]; progressStart: number; progressEnd: number; durationMs: number; }> = [
    { pipelineIndex: 0, planIndices: [], progressStart: 8, progressEnd: 18, durationMs: 700 },
    { pipelineIndex: 1, planIndices: [], progressStart: 18, progressEnd: 28, durationMs: 700 },
    { pipelineIndex: 2, planIndices: [], progressStart: 28, progressEnd: 38, durationMs: 700 },
    { pipelineIndex: 3, planIndices: [0, 1], progressStart: 38, progressEnd: 55, durationMs: 1400 },
    { pipelineIndex: 4, planIndices: [2, 3, 4], progressStart: 55, progressEnd: 78, durationMs: 1700 },
    { pipelineIndex: 5, planIndices: [5], progressStart: 78, progressEnd: 92, durationMs: 1300 },
    { pipelineIndex: 6, planIndices: [], progressStart: 92, progressEnd: 100, durationMs: 700 },
  ];

  let stageIdx = 0;
  const advance = () => {
    if (stageIdx >= stageMap.length) {
      const result = generateResult(task.resolvedType, task.description);
      const completedAt = new Date().toISOString();
      const durationMs = new Date(completedAt).getTime() - new Date(task.createdAt).getTime();
      const finalTask: Task = {
        ...task,
        status: "completed",
        progress: 100,
        currentStage: "Security Verification",
        statusMessage: "Completed securely",
        completedAt,
        durationMs,
        result,
        pipeline: task.pipeline.map((p) => ({ ...p, status: "complete" as const })),
        plan: task.plan.map((p) => ({ ...p, status: "complete" as const })),
        security: { localProcessing: true, externalCalls: 0, verified: true },
      };
      onComplete(finalTask);
      return;
    }
    const stage = stageMap[stageIdx];
    const stageTitle = task.pipeline[stage.pipelineIndex]?.title ?? "";
    const messages = stageMessages[
      stage.pipelineIndex === 0
        ? "01 — Task Classification"
        : stage.pipelineIndex === 1
        ? "02 — Local Model Selection"
        : stage.pipelineIndex === 2
        ? "03 — Execution Planning"
        : stage.pipelineIndex === 3
        ? "04 — Document Processing"
        : stage.pipelineIndex === 4
        ? "05 — AI Analysis"
        : stage.pipelineIndex === 5
        ? "06 — Result Generation"
        : "07 — Security Verification"
    ] ?? ["Processing..."];

    let msgIdx = 0;
    const tickMs = Math.max(250, Math.floor(stage.durationMs / Math.max(messages.length, 1)));
    const interval = setInterval(() => {
      msgIdx += 1;
      const progress =
        stage.progressStart + ((stage.progressEnd - stage.progressStart) * msgIdx) / Math.max(messages.length, 1);
      const nextPipeline = task.pipeline.map((p, i) => {
        if (i < stage.pipelineIndex) return { ...p, status: "complete" as const };
        if (i === stage.pipelineIndex) return { ...p, status: "active" as const, description: messages[Math.min(msgIdx, messages.length - 1)] };
        return p;
      });
      const nextPlan = task.plan.map((p, i) => {
        const isInStage = stage.planIndices.includes(i);
        if (!isInStage) return p;
        const localIdx = stage.planIndices.indexOf(i);
        const stageProgress = msgIdx / messages.length;
        if (stageProgress >= 1) return { ...p, status: "complete" as const };
        if (stageProgress > 0 || localIdx === 0) return { ...p, status: "active" as const };
        return p;
      });
      onUpdate({
        ...task,
        pipeline: nextPipeline,
        plan: nextPlan,
        progress: Math.round(progress),
        currentStage: stageTitle,
        statusMessage: messages[Math.min(msgIdx, messages.length - 1)],
      });
      if (msgIdx >= messages.length) {
        clearInterval(interval);
        stageIdx += 1;
        setTimeout(advance, 250);
      }
    }, tickMs);
  };
  setTimeout(advance, 400);
}
