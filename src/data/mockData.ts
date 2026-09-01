import type {
  Task,
  AuditEvent,
  LocalDocument,
  LocalModel,
  SecurityConnection,
  DemoScenario,
} from "@/types";

export const initialModels: LocalModel[] = [
  {
    id: "Local-General-LLM",
    name: "Local-General-LLM",
    description:
      "General-purpose language model for document understanding, summarization, reasoning and structured report generation.",
    status: "READY",
    version: "v1.4.2",
    parameters: "13B",
    capabilities: [
      "Document analysis",
      "Summarization",
      "Reasoning",
      "Report generation",
    ],
  },
  {
    id: "Local-Vision-Model",
    name: "Local-Vision-Model",
    description:
      "Vision model for analyzing engineering drawings, schematics and visual inspection imagery.",
    status: "READY",
    version: "v0.9.6",
    parameters: "7B",
    capabilities: [
      "Image analysis",
      "Engineering drawings",
      "Visual inspection",
    ],
  },
  {
    id: "Local-Code-Model",
    name: "Local-Code-Model",
    description:
      "Specialized code model for static analysis, code review and refactoring suggestions.",
    status: "READY",
    version: "v1.1.0",
    parameters: "6.7B",
    capabilities: ["Code generation", "Code review", "Debugging"],
  },
  {
    id: "Local-OCR",
    name: "Local-OCR",
    description:
      "Optical character recognition engine for extracting text from scanned documents and PDFs.",
    status: "READY",
    version: "v2.3.1",
    parameters: "—",
    capabilities: ["Scanned documents", "Text extraction"],
  },
];

export const initialDocuments: LocalDocument[] = [
  {
    id: "doc-001",
    name: "Inspection Report 01",
    type: "Inspection Report",
    extension: "PDF",
    size: 2_457_600,
    uploadedAt: "2026-08-25T09:14:00Z",
    status: "INDEXED",
    classification: "CONFIDENTIAL",
    owner: "Asterion Reliability",
  },
  {
    id: "doc-002",
    name: "Pump P-204 Maintenance Manual",
    type: "Manual",
    extension: "PDF",
    size: 5_120_000,
    uploadedAt: "2026-08-22T14:02:00Z",
    status: "INDEXED",
    classification: "INTERNAL",
    owner: "Rotating Equipment",
  },
  {
    id: "doc-003",
    name: "Pump Assembly Drawing",
    type: "Engineering Drawing",
    extension: "DWG",
    size: 8_912_000,
    uploadedAt: "2026-08-21T11:40:00Z",
    status: "INDEXED",
    classification: "RESTRICTED",
    owner: "Mechanical Design",
  },
  {
    id: "doc-004",
    name: "Compressor C-17 Safety Assessment",
    type: "Safety Assessment",
    extension: "PDF",
    size: 1_834_000,
    uploadedAt: "2026-08-20T08:25:00Z",
    status: "INDEXED",
    classification: "CONFIDENTIAL",
    owner: "HSE Division",
  },
  {
    id: "doc-005",
    name: "Heat Exchanger HX-31 Specification",
    type: "Specification",
    extension: "PDF",
    size: 1_220_000,
    uploadedAt: "2026-08-19T16:12:00Z",
    status: "INDEXED",
    classification: "INTERNAL",
    owner: "Process Engineering",
  },
  {
    id: "doc-006",
    name: "Turbine T-09 Operating Procedure",
    type: "Procedure",
    extension: "DOCX",
    size: 920_000,
    uploadedAt: "2026-08-18T10:55:00Z",
    status: "INDEXED",
    classification: "RESTRICTED",
    owner: "Operations",
  },
  {
    id: "doc-007",
    name: "Internal Code Repository Snapshot",
    type: "Code Archive",
    extension: "ZIP",
    size: 14_300_000,
    uploadedAt: "2026-08-15T13:30:00Z",
    status: "INDEXED",
    classification: "CONFIDENTIAL",
    owner: "Plant IT",
  },
  {
    id: "doc-008",
    name: "Approval Note AN-2026-118",
    type: "Approval Note",
    extension: "PDF",
    size: 480_000,
    uploadedAt: "2026-08-12T09:00:00Z",
    status: "INDEXED",
    classification: "INTERNAL",
    owner: "Plant Manager",
  },
];

const now = Date.now();
const ago = (ms: number) => new Date(now - ms).toISOString();

export const initialTasks: Task[] = [
  {
    id: "TSK-7821",
    description:
      "Analyze this inspection report, identify critical findings, assess operational risks and prepare an approval note.",
    type: "document-analysis",
    resolvedType: "Document Analysis",
    status: "completed",
    model: "Local-General-LLM",
    files: [
      {
        id: "f1",
        name: "inspection_report.pdf",
        size: 2_457_600,
        type: "application/pdf",
        extension: "PDF",
      },
    ],
    createdAt: ago(1000 * 60 * 60 * 2),
    completedAt: ago(1000 * 60 * 60 * 2 - 1000 * 60 * 9),
    durationMs: 9_000,
    progress: 100,
    currentStage: "Security Verification",
    statusMessage: "Completed securely",
    pipeline: [
      { id: "p1", index: "01", title: "Task Classification", status: "complete", tool: "Classifier", description: "Document Analysis" },
      { id: "p2", index: "02", title: "Local Model Selection", status: "complete", tool: "Router", description: "Local-General-LLM" },
      { id: "p3", index: "03", title: "Execution Planning", status: "complete", tool: "Orchestrator", description: "Plan generated" },
      { id: "p4", index: "04", title: "Document Processing", status: "complete", tool: "Local-OCR", description: "Text extracted" },
      { id: "p5", index: "05", title: "AI Analysis", status: "complete", tool: "Local-General-LLM", description: "Findings extracted" },
      { id: "p6", index: "06", title: "Result Generation", status: "complete", tool: "Local-General-LLM", description: "Approval note created" },
      { id: "p7", index: "07", title: "Security Verification", status: "complete", tool: "Security Module", description: "No external calls" },
    ],
    plan: [
      { id: "pl1", index: "01", title: "Read uploaded document", tool: "Local-OCR", description: "Extract text from PDF", status: "complete", durationMs: 1200 },
      { id: "pl2", index: "02", title: "Extract relevant information", tool: "Local-General-LLM", description: "Identify entities, dates, equipment IDs", status: "complete", durationMs: 1400 },
      { id: "pl3", index: "03", title: "Identify critical findings", tool: "Local-General-LLM", description: "Classify severity", status: "complete", durationMs: 1500 },
      { id: "pl4", index: "04", title: "Assess operational risks", tool: "Local-General-LLM", description: "Risk categorization", status: "complete", durationMs: 1300 },
      { id: "pl5", index: "05", title: "Summarize findings", tool: "Local-General-LLM", description: "Executive summary", status: "complete", durationMs: 1100 },
      { id: "pl6", index: "06", title: "Generate approval note", tool: "Local-General-LLM", description: "Format management note", status: "complete", durationMs: 1500 },
    ],
    result: {
      summary:
        "Inspection of Pump P-204 at the Asterion Industrial Systems refinery unit identified three medium-severity findings related to vibration, bearing condition and maintenance interval compliance. Overall risk is rated MEDIUM and corrective action is recommended within 14 days.",
      riskLevel: "MEDIUM",
      findings: [
        {
          id: "f1",
          title: "Abnormal vibration on Pump P-204",
          description:
            "Vibration readings exceeded ISO 10816-3 alert threshold by 18% during sustained operation. Probable root cause is bearing wear.",
          severity: "MEDIUM",
        },
        {
          id: "f2",
          title: "Maintenance interval exceeded",
          description:
            "Last scheduled overhaul of Pump P-204 was 11,200 operating hours ago, exceeding the recommended 10,000 hour interval.",
          severity: "MEDIUM",
        },
        {
          id: "f3",
          title: "Bearing temperature trending upward",
          description:
            "Average bearing temperature has risen 4.2°C over the last 30 days, indicating progressive wear.",
          severity: "MEDIUM",
        },
        {
          id: "f4",
          title: "Additional inspection recommended",
          description:
            "Borescope inspection deferred from prior cycle. Recommended before returning equipment to full duty.",
          severity: "LOW",
        },
      ],
      recommendations: [
        { id: "r1", text: "Schedule vibration analysis and borescope inspection within 14 days." },
        { id: "r2", text: "Review maintenance history and update overhaul plan for Pump P-204." },
        { id: "r3", text: "Brief operations team on revised operating envelope until corrective action." },
        { id: "r4", text: "Record corrective action in CMMS and notify reliability engineering." },
      ],
      approvalNote: {
        subject: "Approval Note — Pump P-204 Inspection Findings",
        executiveSummary:
          "Inspection of Pump P-204 completed on 25 Aug 2026 by the Asterion Reliability team identified three medium-severity findings. No immediate safety risk, but corrective action is recommended within 14 days.",
        inspectionFindings:
          "Findings include abnormal vibration exceeding ISO 10816-3 alert threshold, overdue maintenance interval, and a sustained upward trend in bearing temperature. A deferred borescope inspection is also flagged.",
        riskAssessment:
          "Overall risk classified as MEDIUM. Continued operation is acceptable with monitored duty; however, deferring corrective action beyond 30 days elevates the risk profile.",
        recommendedActions:
          "1) Schedule vibration analysis and borescope inspection within 14 days. 2) Update overhaul plan. 3) Brief operations on revised envelope. 4) Record corrective action in CMMS.",
        approvalRecommendation:
          "Recommended for approval. Subject to corrective action completion within 14 days and follow-up inspection report.",
      },
    },
    security: {
      localProcessing: true,
      externalCalls: 0,
      verified: true,
    },
  },
  {
    id: "TSK-7820",
    description:
      "Analyze the pump assembly drawing, extract key dimensions, components and annotations.",
    type: "engineering-drawing",
    resolvedType: "Vision Analysis",
    status: "processing",
    model: "Local-Vision-Model",
    files: [
      {
        id: "f2",
        name: "pump_assembly.dwg",
        size: 8_912_000,
        type: "image/vnd.dwg",
        extension: "DWG",
      },
    ],
    createdAt: ago(1000 * 60 * 4),
    progress: 64,
    currentStage: "Vision Analysis",
    statusMessage: "Extracting components and dimensions...",
    pipeline: [
      { id: "p1", index: "01", title: "Task Classification", status: "complete", tool: "Classifier", description: "Engineering Drawing" },
      { id: "p2", index: "02", title: "Local Model Selection", status: "complete", tool: "Router", description: "Local-Vision-Model" },
      { id: "p3", index: "03", title: "Execution Planning", status: "complete", tool: "Orchestrator", description: "Plan generated" },
      { id: "p4", index: "04", title: "Document Processing", status: "complete", tool: "Local-Vision-Model", description: "Image pre-processed" },
      { id: "p5", index: "05", title: "AI Analysis", status: "active", tool: "Local-Vision-Model", description: "Analyzing drawing regions" },
      { id: "p6", index: "06", title: "Result Generation", status: "waiting", tool: "Local-Vision-Model", description: "Compiling structured data" },
      { id: "p7", index: "07", title: "Security Verification", status: "waiting", tool: "Security Module", description: "Pending" },
    ],
    plan: [
      { id: "pl1", index: "01", title: "Pre-process drawing", tool: "Local-Vision-Model", description: "Normalize scale, remove noise", status: "complete", durationMs: 900 },
      { id: "pl2", index: "02", title: "Detect regions of interest", tool: "Local-Vision-Model", description: "Identify title block, dimensions, parts", status: "complete", durationMs: 1100 },
      { id: "pl3", index: "03", title: "Extract dimensions", tool: "Local-Vision-Model", description: "Parse dimensional annotations", status: "active", durationMs: 1300 },
      { id: "pl4", index: "04", title: "Identify components", tool: "Local-Vision-Model", description: "Map BOM items to drawing", status: "waiting", durationMs: 1200 },
      { id: "pl5", index: "05", title: "Compile structured result", tool: "Local-Vision-Model", description: "Generate output table", status: "waiting", durationMs: 1000 },
    ],
    security: {
      localProcessing: true,
      externalCalls: 0,
      verified: false,
    },
  },
  {
    id: "TSK-7819",
    description:
      "Review the internal source code archive for security issues and code quality concerns.",
    type: "code-analysis",
    resolvedType: "Code Analysis",
    status: "completed",
    model: "Local-Code-Model",
    files: [
      {
        id: "f3",
        name: "internal_code.zip",
        size: 14_300_000,
        type: "application/zip",
        extension: "ZIP",
      },
    ],
    createdAt: ago(1000 * 60 * 60 * 26),
    completedAt: ago(1000 * 60 * 60 * 26 - 1000 * 60 * 12),
    durationMs: 12_000,
    progress: 100,
    currentStage: "Security Verification",
    statusMessage: "Completed securely",
    pipeline: [
      { id: "p1", index: "01", title: "Task Classification", status: "complete", tool: "Classifier", description: "Code Analysis" },
      { id: "p2", index: "02", title: "Local Model Selection", status: "complete", tool: "Router", description: "Local-Code-Model" },
      { id: "p3", index: "03", title: "Execution Planning", status: "complete", tool: "Orchestrator", description: "Plan generated" },
      { id: "p4", index: "04", title: "Document Processing", status: "complete", tool: "Local-Code-Model", description: "Indexed source files" },
      { id: "p5", index: "05", title: "AI Analysis", status: "complete", tool: "Local-Code-Model", description: "Issues identified" },
      { id: "p6", index: "06", title: "Result Generation", status: "complete", tool: "Local-Code-Model", description: "Recommendations generated" },
      { id: "p7", index: "07", title: "Security Verification", status: "complete", tool: "Security Module", description: "No external calls" },
    ],
    plan: [
      { id: "pl1", index: "01", title: "Index source files", tool: "Local-Code-Model", description: "Walk repository", status: "complete", durationMs: 1500 },
      { id: "pl2", index: "02", title: "Static analysis pass", tool: "Local-Code-Model", description: "Find common patterns", status: "complete", durationMs: 2200 },
      { id: "pl3", index: "03", title: "Security review", tool: "Local-Code-Model", description: "Identify vulnerable patterns", status: "complete", durationMs: 2400 },
      { id: "pl4", index: "04", title: "Generate recommendations", tool: "Local-Code-Model", description: "Produce fix suggestions", status: "complete", durationMs: 1800 },
    ],
    result: {
      summary:
        "Static review of the internal code archive found 7 issues across 3 files, including one high-severity hard-coded credential pattern and two medium-severity error handling gaps.",
      riskLevel: "MEDIUM",
      findings: [
        {
          id: "f1",
          title: "Hard-coded API key pattern",
          description: "String literal resembling an API key detected in config/service.ts.",
          severity: "HIGH",
        },
        {
          id: "f2",
          title: "Missing input validation",
          description: "User input is passed to a database query without parameterized binding in 2 locations.",
          severity: "MEDIUM",
        },
        {
          id: "f3",
          title: "Swallowed exceptions",
          description: "Empty catch blocks in 3 functions suppress error context.",
          severity: "MEDIUM",
        },
      ],
      recommendations: [
        { id: "r1", text: "Move secrets to a local secrets manager and rotate any exposed keys." },
        { id: "r2", text: "Refactor database calls to use parameterized queries." },
        { id: "r3", text: "Add structured logging to error handling paths." },
        { id: "r4", text: "Schedule follow-up review after fixes." },
      ],
      code: {
        language: "TypeScript",
        filesReviewed: 42,
        summary: "7 issues found across 3 files. 1 high, 4 medium, 2 low severity.",
        issues: [
          { id: "i1", title: "Hard-coded credentials", severity: "HIGH", description: "config/service.ts:42", recommendation: "Use env-backed secret loader." },
          { id: "i2", title: "SQL injection risk", severity: "HIGH", description: "db/users.ts:118", recommendation: "Switch to parameterized query." },
          { id: "i3", title: "Swallowed exception", severity: "MEDIUM", description: "jobs/sync.ts:84", recommendation: "Log error and rethrow." },
          { id: "i4", title: "Missing type guard", severity: "MEDIUM", description: "api/handlers.ts:201", recommendation: "Add zod schema." },
          { id: "i5", title: "Deprecated API usage", severity: "LOW", description: "utils/fs.ts:55", recommendation: "Replace with fs.promises." },
        ],
      },
    },
    security: {
      localProcessing: true,
      externalCalls: 0,
      verified: true,
    },
  },
];

export const initialAuditEvents: AuditEvent[] = [
  {
    id: "a1",
    timestamp: ago(1000 * 60 * 60 * 2),
    category: "TASKS",
    action: "TASK_COMPLETED",
    detail: "Inspection Report Analysis completed",
    status: "SUCCESS",
    taskId: "TSK-7821",
  },
  {
    id: "a2",
    timestamp: ago(1000 * 60 * 60 * 2 + 1000),
    category: "AI",
    action: "MODEL_DISPATCHED",
    detail: "Local-General-LLM invoked for document analysis",
    status: "INFO",
    taskId: "TSK-7821",
  },
  {
    id: "a3",
    timestamp: ago(1000 * 60 * 60 * 2 + 2000),
    category: "SECURITY",
    action: "SECURITY_CHECK",
    detail: "No external API calls detected",
    status: "SUCCESS",
    taskId: "TSK-7821",
  },
  {
    id: "a4",
    timestamp: ago(1000 * 60 * 4),
    category: "TASKS",
    action: "TASK_CREATED",
    detail: "Pump Assembly Drawing submitted for analysis",
    status: "INFO",
    taskId: "TSK-7820",
  },
  {
    id: "a5",
    timestamp: ago(1000 * 60 * 4 - 1000),
    category: "DOCUMENTS",
    action: "DOCUMENT_UPLOADED",
    detail: "pump_assembly.dwg added to local repository",
    status: "INFO",
  },
  {
    id: "a6",
    timestamp: ago(1000 * 60 * 60 * 26),
    category: "TASKS",
    action: "TASK_COMPLETED",
    detail: "Internal Code Review completed",
    status: "SUCCESS",
    taskId: "TSK-7819",
  },
  {
    id: "a7",
    timestamp: ago(1000 * 60 * 60 * 26 + 1000),
    category: "AI",
    action: "MODEL_DISPATCHED",
    detail: "Local-Code-Model invoked for code review",
    status: "INFO",
    taskId: "TSK-7819",
  },
  {
    id: "a8",
    timestamp: ago(1000 * 60 * 60 * 26 + 2000),
    category: "SECURITY",
    action: "SECURITY_CHECK",
    detail: "No external API calls detected",
    status: "SUCCESS",
    taskId: "TSK-7819",
  },
  {
    id: "a9",
    timestamp: ago(1000 * 60 * 60 * 8),
    category: "SECURITY",
    action: "EXTERNAL_REQUEST_BLOCKED",
    detail: "Outbound request to api.external-ai.com blocked by policy",
    status: "WARN",
  },
  {
    id: "a10",
    timestamp: ago(1000 * 60 * 60 * 9),
    category: "DOCUMENTS",
    action: "DOCUMENT_INDEXED",
    detail: "Inspection Report 01 indexed in local repository",
    status: "INFO",
  },
];

export const initialConnections: SecurityConnection[] = [
  { id: "c1", time: "14:21:04", service: "AI Engine", destination: "localhost", status: "ALLOWED", protocol: "IPC" },
  { id: "c2", time: "14:21:05", service: "Database", destination: "localhost", status: "ALLOWED", protocol: "TCP/5432" },
  { id: "c3", time: "14:21:06", service: "AI API", destination: "external", status: "BLOCKED", protocol: "HTTPS" },
  { id: "c4", time: "14:21:07", service: "Object Store", destination: "localhost", status: "ALLOWED", protocol: "IPC" },
  { id: "c5", time: "14:21:08", service: "Audit Logger", destination: "localhost", status: "ALLOWED", protocol: "IPC" },
  { id: "c6", time: "14:21:09", service: "Telemetry", destination: "external", status: "BLOCKED", protocol: "HTTPS" },
  { id: "c7", time: "14:21:11", service: "OCR Engine", destination: "localhost", status: "ALLOWED", protocol: "IPC" },
  { id: "c8", time: "14:21:12", service: "Auth Service", destination: "localhost", status: "ALLOWED", protocol: "TCP/8443" },
  { id: "c9", time: "14:21:13", service: "Model Registry", destination: "external", status: "BLOCKED", protocol: "HTTPS" },
  { id: "c10", time: "14:21:14", service: "Vector Store", destination: "localhost", status: "ALLOWED", protocol: "IPC" },
];

export const demoScenarios: DemoScenario[] = [
  {
    id: "demo-1",
    number: "Demo 01",
    title: "Confidential Inspection Report",
    description:
      "Analyze an inspection report and generate an approval note.",
    workflow: ["Report", "General LLM", "Analysis", "Approval Note"],
    taskType: "document-analysis",
    description_prompt:
      "Analyze this inspection report, identify critical findings, assess operational risks and prepare an approval note.",
    files: [{ name: "inspection_report.pdf", size: 2_457_600, type: "application/pdf", extension: "PDF" }],
  },
  {
    id: "demo-2",
    number: "Demo 02",
    title: "Engineering Drawing",
    description:
      "Analyze an engineering drawing and extract dimensions and annotations.",
    workflow: ["Drawing", "Vision Model", "Analysis", "Structured Result"],
    taskType: "engineering-drawing",
    description_prompt:
      "Analyze the pump assembly drawing, extract key dimensions, components and annotations.",
    files: [{ name: "pump_assembly.dwg", size: 8_912_000, type: "image/vnd.dwg", extension: "DWG" }],
  },
  {
    id: "demo-3",
    number: "Demo 03",
    title: "Confidential Code Review",
    description:
      "Analyze internal source code and identify potential issues.",
    workflow: ["Code", "Code Model", "Analysis", "Recommendations"],
    taskType: "code-analysis",
    description_prompt:
      "Review the internal source code archive for security issues and code quality concerns.",
    files: [{ name: "internal_code.zip", size: 14_300_000, type: "application/zip", extension: "ZIP" }],
  },
];
