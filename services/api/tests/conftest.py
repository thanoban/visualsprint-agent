from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


API_SRC = Path(__file__).resolve().parents[1] / "src"
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))

from visualsprint_api.main import app
from visualsprint_api.repository import repository


@pytest.fixture(autouse=True)
def reset_repository_state():
    repository.reset()
    yield
    repository.reset()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
