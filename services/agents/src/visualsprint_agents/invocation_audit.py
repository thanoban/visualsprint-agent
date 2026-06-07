"""In-memory invocation audit trail for the VisualSprint agents service."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock


@dataclass(frozen=True, slots=True)
class InvocationAuditRecord:
    invoked_at: datetime
    agent_kind: str
    execution_mode: str
    status: str
    target_agent_id: str | None
    request_key: str
    detail: str


class InvocationAuditStore:
    def __init__(self, limit: int = 50) -> None:
        self._limit = limit
        self._lock = Lock()
        self._records: deque[InvocationAuditRecord] = deque(maxlen=limit)

    def record(
        self,
        *,
        agent_kind: str,
        execution_mode: str,
        status: str,
        target_agent_id: str | None,
        request_key: str,
        detail: str,
    ) -> None:
        with self._lock:
            self._records.appendleft(
                InvocationAuditRecord(
                    invoked_at=datetime.now(timezone.utc),
                    agent_kind=agent_kind,
                    execution_mode=execution_mode,
                    status=status,
                    target_agent_id=target_agent_id,
                    request_key=request_key,
                    detail=detail,
                )
            )

    def snapshot(self) -> list[InvocationAuditRecord]:
        with self._lock:
            return list(self._records)

    def clear(self) -> None:
        with self._lock:
            self._records.clear()


audit_store = InvocationAuditStore()
