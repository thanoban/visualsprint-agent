"""ADK deployment entrypoint for the VisualSprint action agent."""

from pathlib import Path
import sys

SRC_DIR = Path(__file__).resolve().parents[2] / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from visualsprint_agents.adk.action_agent import root_agent

__all__ = ["root_agent"]
