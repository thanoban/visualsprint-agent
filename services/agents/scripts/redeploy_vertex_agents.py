from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import vertexai
from google.oauth2.credentials import Credentials
from vertexai import agent_engines


PROJECT_ID = "visualsprint-agent"
PROJECT_NUMBER = "530780341550"
LOCATION = "us-central1"
CONTROL_PLANE_URL = "https://visualsprint-api-530780341550.us-west1.run.app"
STAGING_BUCKET = os.environ.get(
    "VISUALSPRINT_VERTEX_STAGING_BUCKET",
    "gs://visualsprint-agent-agent-engine-staging",
)
DEFAULT_ADK_MODEL = "gemini-2.5-flash"

REPO_ROOT = Path(__file__).resolve().parents[3]
AGENTS_ROOT = REPO_ROOT / "services" / "agents"
ADK_APPS = REPO_ROOT / "services" / "agents" / "adk_apps"
AGENTS_SRC = REPO_ROOT / "services" / "agents" / "src"
AGENTS_PACKAGE = AGENTS_SRC / "visualsprint_agents"

# Make local packages importable before pickling the agent.
sys.path.insert(0, str(ADK_APPS))
sys.path.insert(0, str(AGENTS_SRC))
os.environ["VISUALSPRINT_ADK_MODEL"] = DEFAULT_ADK_MODEL

from visualsprint_agents.adk.engine_wrappers import (
    VisualSprintActionEngine,
    VisualSprintReasoningEngine,
    VisualSprintSummaryEngine,
)


def deploy_agent(
    display_name: str,
    description: str,
    agent_engine: object,
    extra_packages: list[str],
) -> str:
    env_vars = {
        # Force google-genai / ADK to use Vertex AI credentials, not API-key mode.
        # GOOGLE_CLOUD_PROJECT is reserved/injected by Agent Engine; do not set it here.
        "GOOGLE_GENAI_USE_VERTEXAI": "True",
        "GOOGLE_CLOUD_LOCATION": LOCATION,
        "VISUALSPRINT_ADK_MODEL": DEFAULT_ADK_MODEL,
        "VISUALSPRINT_CONTROL_PLANE_URL": CONTROL_PLANE_URL,
        "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID": PROJECT_ID,
        "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_NUMBER": PROJECT_NUMBER,
        "VISUALSPRINT_GOOGLE_CLOUD_LOCATION": LOCATION,
        "VISUALSPRINT_DEPLOYMENT_TARGET": "agent_engine",
        "VISUALSPRINT_AGENT_RUNTIME_BACKEND": "vertex_ai_reasoning_engine",
        "VISUALSPRINT_ELASTIC_API_KEY_SECRET_NAME": "ELASTICSEARCH_API_KEY",
        "VISUALSPRINT_MCP_ENDPOINT_SECRET_NAME": "ELASTIC_MCP_SERVER_URL",
        "ELASTICSEARCH_URL_SECRET_NAME": "ELASTICSEARCH_URL",
        "ELASTIC_INDEX_OUTCOMES_SECRET_NAME": "ELASTIC_INDEX_OUTCOMES",
    }

    remote_agent = agent_engines.create(
        agent_engine=agent_engine,
        display_name=display_name,
        description=description,
        # Pin to the local versions used to pickle the agent. A version skew
        # between the pickling env and the deployed runtime (notably google-adk)
        # produces runtime errors like "'LlmAgent' object has no attribute 'mode'".
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]==1.156.0",
            "google-adk==1.34.3",
            "google-genai==1.75.0",
            "requests",
            "pydantic==2.12.5",
        ],
        extra_packages=extra_packages,
        env_vars=env_vars,
    )

    print("")
    print(display_name)
    print(remote_agent.resource_name)
    return remote_agent.resource_name


def resolve_credentials() -> Credentials:
    gcloud_executable = shutil.which("gcloud") or shutil.which("gcloud.cmd") or "gcloud.cmd"
    access_token = subprocess.check_output(
        [gcloud_executable, "auth", "print-access-token"],
        text=True,
    ).strip()
    if not access_token:
        raise RuntimeError("Unable to resolve a gcloud access token for Vertex deployment.")
    return Credentials(token=access_token)


def build_agents_wheel() -> str:
    wheel_dir = Path(tempfile.mkdtemp(prefix="visualsprint-agents-wheel-"))
    subprocess.run(
        [
            sys.executable,
            "-m",
            "pip",
            "wheel",
            "--no-deps",
            "--wheel-dir",
            str(wheel_dir),
            str(AGENTS_ROOT),
        ],
        check=True,
    )
    wheels = sorted(wheel_dir.glob("visualsprint_agents-*.whl")) or sorted(
        wheel_dir.glob("visualsprint_agents*.whl")
    ) or sorted(wheel_dir.glob("*.whl"))
    if not wheels:
        raise RuntimeError(f"No wheel was produced in {wheel_dir}")
    return str(wheels[-1])


def prepare_flat_extra_packages() -> tuple[Path, list[str]]:
    staging_root = Path(tempfile.mkdtemp(prefix="visualsprint-agent-engine-extra-"))
    package_paths = [
        AGENTS_PACKAGE,
        ADK_APPS / "visualsprint_reasoning_agent",
        ADK_APPS / "visualsprint_summary_agent",
        ADK_APPS / "visualsprint_action_agent",
    ]
    prepared_paths: list[str] = []
    for source_path in package_paths:
        target_path = staging_root / source_path.name
        shutil.copytree(source_path, target_path)
        prepared_paths.append(target_path.name)
    return staging_root, prepared_paths


AGENT_SPECS = {
    "reasoning": (
        "VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME",
        "VisualSprint Reasoning Agent (query wrapper)",
        "VisualSprint reasoning runtime wrapper exposing query(input) -> ReasoningRunResponse.",
        VisualSprintReasoningEngine,
    ),
    "summary": (
        "VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME",
        "VisualSprint Summary Agent (query wrapper)",
        "VisualSprint summary runtime wrapper exposing query(input) -> FinalReportDraft.",
        VisualSprintSummaryEngine,
    ),
    "action": (
        "VISUALSPRINT_ACTION_ENGINE_RESOURCE_NAME",
        "VisualSprint Action Recommendation Agent (query wrapper)",
        "VisualSprint action runtime wrapper exposing query(input) -> ActionAgentResponse.",
        VisualSprintActionEngine,
    ),
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Redeploy VisualSprint Vertex Agent Engine wrappers.")
    parser.add_argument(
        "--agents",
        nargs="+",
        choices=sorted(AGENT_SPECS.keys()),
        default=sorted(AGENT_SPECS.keys()),
        help="Which agent wrappers to deploy (default: all). Example: --agents summary",
    )
    args = parser.parse_args()
    selected = [name for name in ("reasoning", "summary", "action") if name in set(args.agents)]

    staging_root, extra_packages = prepare_flat_extra_packages()

    vertexai.init(
        project=PROJECT_ID,
        location=LOCATION,
        staging_bucket=STAGING_BUCKET,
        credentials=resolve_credentials(),
    )
    previous_cwd = Path.cwd()
    os.chdir(staging_root)
    resources: dict[str, str] = {}
    try:
        for name in selected:
            env_var, display_name, description, engine_cls = AGENT_SPECS[name]
            resources[env_var] = deploy_agent(
                display_name,
                description,
                engine_cls(),
                extra_packages,
            )
    finally:
        os.chdir(previous_cwd)

    print("")
    print("New Vertex Agent Engine resources:")
    for env_var, resource_name in resources.items():
        print(f"{env_var}={resource_name}")


if __name__ == "__main__":
    main()
