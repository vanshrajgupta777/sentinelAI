"""
Audit Log
=========
Append-only structured log of every meaningful backend event.
Persisted to a JSONL file so it survives process restarts and is
easy to inspect from the filesystem.
"""
from __future__ import annotations

import json
import os
import threading
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from ..models.schemas import AuditCategory, AuditEvent, AuditStatus


class AuditLog:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        if not self.path.exists():
            self.path.touch()

    def record(
        self,
        category: AuditCategory,
        action: str,
        detail: str,
        status: AuditStatus = AuditStatus.INFO,
        task_id: Optional[str] = None,
        component: str = "backend",
    ) -> AuditEvent:
        event = AuditEvent(
            id=f"ev-{uuid.uuid4().hex[:10]}",
            timestamp=datetime.utcnow(),
            category=category,
            action=action,
            detail=detail,
            status=status,
            task_id=task_id,
            component=component,
        )
        with self._lock:
            with open(self.path, "a") as f:
                f.write(json.dumps(event.model_dump(mode="json")) + "\n")
        return event

    def list(self, limit: int = 200) -> List[AuditEvent]:
        if not self.path.exists():
            return []
        out: List[AuditEvent] = []
        try:
            with open(self.path) as f:
                lines = f.readlines()
        except Exception:
            return []
        for line in lines[-limit:]:
            try:
                data = json.loads(line)
                out.append(AuditEvent(**data))
            except Exception:
                continue
        out.reverse()
        return out

    def for_task(self, task_id: str) -> List[AuditEvent]:
        return [e for e in self.list(limit=2000) if e.task_id == task_id]
