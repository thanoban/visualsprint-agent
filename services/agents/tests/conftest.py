from __future__ import annotations

import sys
from pathlib import Path

import pytest


AGENTS_SRC = Path(__file__).resolve().parents[1] / "src"
if str(AGENTS_SRC) not in sys.path:
    sys.path.insert(0, str(AGENTS_SRC))


@pytest.fixture(autouse=True)
def clear_invocation_audit():
    from visualsprint_agents.invocation_audit import audit_store

    audit_store.clear()
    yield
    audit_store.clear()
