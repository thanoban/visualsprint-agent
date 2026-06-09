from __future__ import annotations

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

REPO_ROOT = Path(__file__).resolve().parents[3]
AGENTS_ROOT = REPO_ROOT / "services" / "agents"
ADK_APPS = REPO_ROOT / "services" / "agents" / "adk_apps"
AGENTS_SRC = REPO_ROOT / "services" / "agents" / "src"
AGENTS_PACKAGE = AGENTS_SRC / "visualsprint_agents"

# Make local packages importable before pickling the agent.
sys.path.insert(0, str(ADK_APPS))
sys.path.insert(0, str(AGENTS_SRC))

from visualsprint_action_agent.agent import root_agent as action_root_agent
from visualsprint_reasoning_agent.agent import root_agent as reasoning_root_agent
from visualsprint_summary_agent.agent import root_agent as summary_root_agent


def deploy_agent(
    display_name: str,
    description: str,
    root_agent: object,
    extra_packages: list[str],
) -> str:
    env_vars = {
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
        agent_engine=root_agent,
        display_name=display_name,
        description=description,
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]>=1.111.0",
            "google-adk",
            "requests",
            "pydantic",
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


def main() -> None:
    staging_root, extra_packages = prepare_flat_extra_packages()

    vertexai.init(
        project=PROJECT_ID,
        location=LOCATION,
        staging_bucket=STAGING_BUCKET,
        credentials=resolve_credentials(),
    )
    previous_cwd = Path.cwd()
    os.chdir(staging_root)
    try:
        reasoning_resource = deploy_agent(
            "VisualSprint Reasoning Agent",
            "VisualSprint ADK reasoning agent for chunk-level meeting intelligence.",
            reasoning_root_agent,
            extra_packages,
        )
        summary_resource = deploy_agent(
            "VisualSprint Summary Agent",
            "VisualSprint ADK summary agent for final meeting reports.",
            summary_root_agent,
            extra_packages,
        )
        action_resource = deploy_agent(
            "VisualSprint Action Recommendation Agent",
            "VisualSprint ADK action recommendation agent for Jira and Slack follow-ups.",
            action_root_agent,
            extra_packages,
        )
    finally:
        os.chdir(previous_cwd)

    print("")
    print("New Vertex Agent Engine resources:")
    print(f"VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME={reasoning_resource}")
    print(f"VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME={summary_resource}")
    print(f"VISUALSPRINT_ACTION_ENGINE_RESOURCE_NAME={action_resource}")


if __name__ == "__main__":
    main()
