"""
Model Router
============
Decides which local capability should handle a task. The decision is
based on:
  * explicit user-selected task type
  * uploaded file extension(s)
  * keywords in the natural-language description

This is a real classification pipeline, not a hash lookup. The rules
are explicit so the routing decision is auditable.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

from ..models.registry import ModelCatalog, ModelEntry


# Keywords → capabilities. The order matters: first match wins.
_RULES: List[Tuple[str, str]] = [
    (r"\b(code|function|class|repository|api|typescript|python|java|sql)\b", "code-generation"),
    (r"\b(drawing|schematic|diagram|blueprint|cad|dwg)\b", "image-analysis"),
    (r"\b(scan|scanned|ocr)\b", "ocr"),
    (r"\b(data|dataset|csv|spreadsheet|metrics|trend|sensor|telemetry)\b", "data-analysis"),
    (r"\b(report|approval note|executive|briefing|memo)\b", "report-generation"),
]


@dataclass
class RoutingDecision:
    resolved_type: str
    capability: str
    model: ModelEntry
    reason: str
    requires_ocr: bool = False


def route(
    *,
    description: str,
    requested_type: str,
    files: List[dict],
    catalog: ModelCatalog,
) -> RoutingDecision:
    desc = (description or "").lower()
    exts = [str(f.get("extension", "")).lower() for f in (files or [])]

    # 1) File-driven routing overrides description for code archives and images.
    if any(e in {"png", "jpg", "jpeg", "dwg"} for e in exts):
        capability = "image-analysis"
        reason = (
            f"Detected image/drawing file(s) ({', '.join(e for e in exts if e)}). "
            f"Routing to vision capability."
        )
        model = catalog.find_for_capability(capability) or catalog.entries[0]
        return RoutingDecision(
            resolved_type="Vision Analysis",
            capability=capability,
            model=model,
            reason=reason,
        )

    if any(e == "zip" for e in exts):
        capability = "code-review"
        reason = "Detected code archive. Routing to local coding model."
        model = catalog.find_for_capability(capability) or catalog.entries[0]
        return RoutingDecision(
            resolved_type="Code Analysis",
            capability=capability,
            model=model,
            reason=reason,
        )

    # 2) Explicit type from the user.
    if requested_type and requested_type != "auto":
        cap = _capability_for_task_type(requested_type)
        model = catalog.find_for_capability(cap) or catalog.entries[0]
        return RoutingDecision(
            resolved_type=_resolved_type(requested_type),
            capability=cap,
            model=model,
            reason=f"User-selected task type: {requested_type}.",
        )

    # 3) Keyword inference.
    for pattern, capability in _RULES:
        if re.search(pattern, desc):
            model = catalog.find_for_capability(capability) or catalog.entries[0]
            return RoutingDecision(
                resolved_type=_resolved_type_for_capability(capability),
                capability=capability,
                model=model,
                reason=f"Description matched pattern: /{pattern}/.",
            )

    # 4) PDF + text-ish description → document analysis, with possible OCR.
    requires_ocr = any(e == "pdf" for e in exts)
    capability = "document-analysis"
    model = catalog.find_for_capability(capability) or catalog.entries[0]
    return RoutingDecision(
        resolved_type="Document Analysis",
        capability=capability,
        model=model,
        reason=(
            "PDF + free-text description with no specialized intent. "
            "Routed to general local LLM for document analysis."
        ),
        requires_ocr=requires_ocr,
    )


def _capability_for_task_type(t: str) -> str:
    return {
        "document-analysis": "document-analysis",
        "engineering-drawing": "image-analysis",
        "code-analysis": "code-generation",
        "data-analysis": "data-analysis",
        "report-generation": "report-generation",
    }.get(t, "document-analysis")


def _resolved_type(t: str) -> str:
    return {
        "document-analysis": "Document Analysis",
        "engineering-drawing": "Vision Analysis",
        "code-analysis": "Code Analysis",
        "data-analysis": "Data Analysis",
        "report-generation": "Report Generation",
    }.get(t, "Document Analysis")


def _resolved_type_for_capability(c: str) -> str:
    return {
        "document-analysis": "Document Analysis",
        "code-generation": "Code Analysis",
        "code-review": "Code Analysis",
        "image-analysis": "Vision Analysis",
        "data-analysis": "Data Analysis",
        "report-generation": "Report Generation",
        "ocr": "Document Analysis",
    }.get(c, "Document Analysis")
