from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    service_root = Path(__file__).resolve().parents[1]
    src_dir = service_root / "src"
    if str(src_dir) not in sys.path:
        sys.path.insert(0, str(src_dir))

    from visualsprint_agents.evals import run_agent_eval_smoke_as_json

    payload = run_agent_eval_smoke_as_json()
    print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
