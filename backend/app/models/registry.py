"""
Model Registry
==============
Configurable local model catalogue. Reads models.yaml if present,
otherwise falls back to environment-driven defaults.

The catalog is intentionally small. Each entry binds a logical
capability (id) to a provider + concrete model identifier. This is
how the system stays swappable between Ollama, vLLM, llama.cpp, or
the bundled in-process local engine.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

import yaml


@dataclass
class ModelEntry:
    id: str
    name: str
    provider: str
    model: str
    capabilities: List[str]
    version: str = "v1"
    parameters: str = "—"


@dataclass
class ModelCatalog:
    provider: str = "local-inprocess"
    base_url: Optional[str] = None
    entries: List[ModelEntry] = field(default_factory=list)

    def to_dict(self) -> List[dict]:
        return [
            {
                "id": e.id,
                "name": e.name,
                "provider": e.provider,
                "model": e.model,
                "capabilities": e.capabilities,
                "version": e.version,
                "parameters": e.parameters,
            }
            for e in self.entries
        ]

    def find_for_capability(self, capability: str) -> Optional[ModelEntry]:
        for e in self.entries:
            if capability in e.capabilities:
                return e
        return None

    def find_by_id(self, model_id: str) -> Optional[ModelEntry]:
        for e in self.entries:
            if e.id == model_id or e.name == model_id:
                return e
        return None


def _default_entries(provider: str) -> List[ModelEntry]:
    """Default registry. Honors env vars so the same image can be
    pointed at any local model without code changes."""
    return [
        ModelEntry(
            id="general",
            name="Local-General-LLM",
            provider=provider,
            model=os.environ.get("MODEL_GENERAL", "local-general"),
            capabilities=[
                "document-analysis",
                "reasoning",
                "summarization",
                "report-generation",
            ],
            version=os.environ.get("MODEL_GENERAL_VERSION", "v1.4.2"),
            parameters=os.environ.get("MODEL_GENERAL_PARAMS", "13B"),
        ),
        ModelEntry(
            id="coding",
            name="Local-Code-Model",
            provider=provider,
            model=os.environ.get("MODEL_CODING", "local-code"),
            capabilities=[
                "code-generation",
                "code-review",
                "debugging",
            ],
            version=os.environ.get("MODEL_CODING_VERSION", "v1.1.0"),
            parameters=os.environ.get("MODEL_CODING_PARAMS", "6.7B"),
        ),
        ModelEntry(
            id="vision",
            name="Local-Vision-Model",
            provider=provider,
            model=os.environ.get("MODEL_VISION", "local-vision"),
            capabilities=[
                "image-analysis",
                "engineering-drawing",
            ],
            version=os.environ.get("MODEL_VISION_VERSION", "v0.9.6"),
            parameters=os.environ.get("MODEL_VISION_PARAMS", "7B"),
        ),
        ModelEntry(
            id="ocr",
            name="Local-OCR",
            provider=provider,
            model=os.environ.get("MODEL_OCR", "local-ocr"),
            capabilities=[
                "ocr",
                "scanned-documents",
                "text-extraction",
            ],
            version=os.environ.get("MODEL_OCR_VERSION", "v2.3.1"),
            parameters="—",
        ),
    ]


def load_catalog() -> ModelCatalog:
    """Build the catalog. Precedence:
    1. models.yaml file in backend/ (if present)
    2. Environment variables
    3. Hard defaults
    """
    yaml_path = Path(__file__).resolve().parents[2] / "models.yaml"
    provider = os.environ.get("LLM_PROVIDER", "local-inprocess")
    base_url = os.environ.get("OLLAMA_BASE_URL") or os.environ.get("LLM_BASE_URL")

    if yaml_path.exists():
        try:
            data = yaml.safe_load(yaml_path.read_text()) or {}
            provider = data.get("provider", provider)
            base_url = data.get("base_url", base_url)
            entries: List[ModelEntry] = []
            for m in data.get("models", []):
                entries.append(
                    ModelEntry(
                        id=m["id"],
                        name=m.get("name", m["id"]),
                        provider=m.get("provider", provider),
                        model=m.get("model", m["id"]),
                        capabilities=m.get("capabilities", []),
                        version=m.get("version", "v1"),
                        parameters=m.get("parameters", "—"),
                    )
                )
            return ModelCatalog(provider=provider, base_url=base_url, entries=entries)
        except Exception:
            pass

    return ModelCatalog(
        provider=provider,
        base_url=base_url,
        entries=_default_entries(provider),
    )
