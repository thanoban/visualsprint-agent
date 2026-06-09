# Google Cloud Agent Builder Plan

This document is the main setup and implementation guide for the Google Cloud agent layer in VisualSprint.

It is written for the current repository state and for a teammate who has not used Google Agent Builder before.

Use this document when you need to answer:

- what already exists in the repo
- what is still missing
- what to do in Google Cloud
- what to wire in the codebase
- what order to do the work in

For Elastic-only ownership and handoff, use [elastic-integration-handoff.md](./elastic-integration-handoff.md).

This version of the guide uses the recommended Google production path:

1. build the agents in `ADK`
2. deploy them to `Vertex AI Agent Engine`
3. register them inside the `Gemini Enterprise` app
4. connect the existing repo adapter to those deployed runtimes

## What changed after re-checking the repo

After re-checking the full project structure and the current markdown files, these are the important updates to the plan:

1. `services/agents` is no longer only a pure stub.
2. The repo now already contains:
   - Cloud Run deployment YAML in `infra/cloud-run/`
   - cloud-facing adapter config in `services/agents/src/visualsprint_agents/config.py`
   - runtime bridge code in `services/agents/src/visualsprint_agents/agent_runtime.py`
   - agent smoke and audit routes in `services/api/src/visualsprint_api/routes/agents.py`
   - agent eval fixtures and an eval smoke script in `services/agents/evals/` and `services/agents/scripts/`
   - ADK reasoning, summary, and action agents under `services/agents/src/visualsprint_agents/adk/`
   - ADK persistence tools that can now call the control plane when configured
   - Elastic write-back and search in `services/api`
   - an agents-side Elastic MCP client and `search_prior_outcomes` tool path
   - Dockerfiles, deployment docs, and a launch checklist
3. The old doc wording understated how far the adapter, Elastic, and action-review layers have already progressed.
4. The best next step is no longer "create the scaffolding." The stronger next step is to prove the real deployed path end to end and harden secrets, tenant scoping, and service identity.

So the updated plan below treats the project as:

- a working local product slice
- a partially prepared cloud-agent adapter
- a not-yet-finished Google Agent Builder and Elastic integration

## Short answer

The repo already has the right architecture for Google Agent Builder, but the real managed agent path is not fully wired yet.

Today the project already has:

- a working web shell with browser capture and dashboard surfaces
- a deterministic API control plane
- shared contracts
- a local agents service
- ADK agent scaffolds and deployable app folders
- cloud-oriented adapter configuration
- deployment-facing Cloud Run config
- Elastic write-back and Elastic-backed search fallback
- an Elastic MCP client path on the agents side
- an approval-based action review layer in the product
- evaluation fixtures for reasoning and summary flows

What is still missing:

1. confirmed live deployed Agent Engine plus Gemini Enterprise proof through the real hosted path
2. confirmed live Elastic MCP use during a managed reasoning run
3. final Secret Manager and Cloud Run service-identity hardening
4. tenant-aware memory scoping instead of the current default placeholder
5. end-to-end verification against deployed cloud services

## Capture constraint to keep in mind

VisualSprint is still a web app, so capture behavior is limited by browser security rules.

That means:

- browser meeting tabs are the best supported capture target
- another browser tab can only be captured if the user explicitly shares it
- an external desktop app such as Zoom can only be seen if the user explicitly shares that window or the full screen
- the Google agents should never assume hidden access to desktop apps

For the detailed product and UX plan, use [capture-constraints-and-plan.md](./capture-constraints-and-plan.md).

## Recommended agent set

For the best performance-oriented production design, create these first:

1. `VisualSprint Reasoning Agent`
2. `VisualSprint Summary Agent`

Then add one more focused layer for high-value action handling:

3. `Action Recommendation / Escalation Review` subflow

This third layer does not need to be a fully separate autonomous agent on day one. It can start as:

- a dedicated subflow inside the reasoning or summary path
- a review stage in the portal
- or a later standalone agent if the workflow grows

## Why add one more action-focused layer

If performance matters more than cost, this extra layer is useful because it separates:

- factual extraction
- meeting summarization
- actionability and escalation decisions

That improves quality in critical situations because the system does not have to do all of these jobs inside one overloaded reasoning pass.

The benefits are:

- better prioritization of critical blockers and risky commitments
- cleaner approval-based suggestions for Jira or Slack
- less chance of sending weak or noisy actions downstream
- easier evaluation because extraction quality and escalation quality can be tested separately

## What that extra layer should do

The action recommendation or escalation review layer should:

- inspect the outputs from the reasoning and summary stages
- identify items worth surfacing to the portal
- group items into:
  - `suggest_for_jira`
  - `suggest_for_slack`
  - `suggest_for_manual_review`
  - `suggest_for_escalation`
- rank urgency and confidence
- explain why an item should be suggested
- wait for human approval before any external send action

## What it should not do

This extra layer should not:

- replace the reasoning agent
- replace the summary agent
- directly send to Jira or Slack without approval
- re-parse raw transcript or browser capture
- invent new records that were not produced by the earlier stages

## Current repo truth

This section is the source-of-truth snapshot for the current project.

### Frontend

- `apps/web`
- Next.js dashboard
- browser capture UI
- live, report, action, and dev views
- approval portal surfaces for downstream action review

### Deterministic backend

- `services/api`
- meeting lifecycle
- capture lifecycle
- transcript and media context assembly
- output persistence
- summary packet assembly
- agent smoke routes
- action recommendation persistence and execution endpoints
- Elastic write-back and Elastic-backed retrieval fallback

### Agents service

- `services/agents`
- local mock fallback behavior
- bridge-style runtime invocation support
- Vertex AI Reasoning Engine query support
- reasoning, summary, and action agent entrypoints
- ADK scaffolds and deployable app folders
- Elastic MCP client path
- control-plane-backed persistence tools for ADK execution
- deployment health reporting
- eval fixtures and smoke script

### Infra

- `infra/cloud-run/visualsprint-agents.service.yaml`
- `infra/cloud-run/visualsprint-api.service.yaml`
- Dockerfiles and deployment scripts

### Docs

- this file for the full Google Agent Builder plan
- `docs/elastic-integration-handoff.md` for Elastic-only execution
- `docs/fixes.md` for known architecture and verification risks
- `docs/DEPLOY.md` for operational deployment steps
- `docs/REMAINING_TASKS.md` for the current launch checklist

## Important issues found while reviewing docs and structure

These are the main issues that matter before cloud integration:

### 1. The old doc said the agents service was only a stub

That is now incomplete.

The repo already includes:

- `VISUALSPRINT_AGENT_MODE`
- `VISUALSPRINT_DEPLOYMENT_TARGET`
- `VISUALSPRINT_AGENT_RUNTIME_BACKEND`
- Cloud Run deployment env var placeholders
- direct runtime query support for Vertex AI Reasoning Engine

So the correct description is:

- the service still has local fallback behavior
- but the adapter shape for real cloud integration is already built much further than the old wording suggested

### 2. Contract alignment still matters before production memory

This remains true from the earlier review.

Before real Elastic indexing and real managed-agent outputs, we still need to align:

- stored outcome shape
- stable IDs
- evidence references
- memory relation labels

### 3. Verification is stronger than before, but still not complete

The repo now includes:

- agent eval fixtures
- `npm run eval:agents`
- smoke routes for agent invocation
- deployment docs and launch checklist docs

That is a good step forward.

But production validation is still missing for:

- real Google-managed agents
- real Elastic retrieval
- deployed Cloud Run identity and secret access

## Recommended production shape

Keep this architecture.

1. `services/api` owns deterministic orchestration and persistence.
2. `services/agents` stays the adapter boundary.
3. Google Agent Builder and Agent Engine own reasoning and summarization behavior.
4. Elastic owns historical memory retrieval.
5. The web app stays unaware of cloud-agent details.

This is still the safest path because the current repo already expects an agents-service seam through `VISUALSPRINT_AGENTS_SERVICE_URL`.

## Google Agent Builder concepts in simple terms

If you have not used Google Agent Builder before, these are the pieces that matter for VisualSprint.

### Gemini Enterprise app

This is the top-level Gemini web app container in Google Cloud.

In the ADK-first path, you still create the app, but its main job is to:

- host the user-facing Gemini Enterprise experience
- expose Agent Gallery
- hold the registered custom agents your team deploys elsewhere

### Agent Development Kit (ADK)

This is the code-first framework Google provides for building real production agents.

It is a better fit for VisualSprint because this repo already has:

- a Python service boundary in `services/agents`
- Cloud Run deployment config
- eval fixtures
- runtime adapter code

### Vertex AI Agent Engine

This is the managed runtime where ADK agents are deployed.

You build the agent in code, deploy it to Agent Engine, then query it through Google-managed runtime APIs.

### Agent Gallery

This is where custom agents are listed in the Gemini Enterprise web app.

### Agent Designer

This is the no-code or low-code builder used to create and edit custom agents.

It supports:

- prompt-first creation
- flow-based creation
- preview and testing
- subagent-style multi-step designs

### Why we need it

VisualSprint needs Google Agent Builder because the hackathon requires a functional agent powered by Gemini and Google Cloud Agent Builder, not only a local backend with mock outputs.

For this project, the strongest production path is:

- build agents in `ADK`
- deploy them to `Vertex AI Agent Engine`
- register them in the `Gemini Enterprise` app

## Which Google path should we choose

For VisualSprint, choose this as the primary path:

- `ADK` for the real agent implementation
- `Vertex AI Agent Engine` for managed runtime
- `Gemini Enterprise` for registration and discovery

Treat `Agent Designer` as optional.

Use it only when you want:

- quick prompt exploration
- early interaction testing
- a rough prototype before moving the behavior into code

Do not make Agent Designer the only production implementation path for this repo.

## What we do not need Agent Builder to do

Agent Builder should not own:

- browser capture
- chunk registration
- media uploads
- transcript chunk lifecycle
- database writes
- dashboard rendering

Those remain in our repo.

## What Agent Builder should own

Google-managed agent infrastructure should own:

- reasoning over assembled chunk context
- use of the Elastic MCP tool for historical memory
- meeting-close summarization
- managed runtime execution

Agent Designer can still be used for:

- early prompt experiments
- checking behavior quickly
- comparing prototype logic against the coded ADK implementation

## Recommended implementation path

For VisualSprint, use this order:

1. define the final reasoning and summary behavior in the repo
2. build the agents in `ADK`
3. deploy them to `Vertex AI Agent Engine`
4. register them inside the `Gemini Enterprise` app
5. connect the existing `services/agents` adapter to those deployed runtimes
6. add Elastic MCP-backed memory

This is a better fit than relying on Agent Designer alone because the current repo is already code-first.

## Beginner-friendly setup path in Google Cloud

This is the step-by-step path for someone starting from zero.

## Phase 1. Prepare Google Cloud

### Step 1. Create or select a Google Cloud project

Create a dedicated Google Cloud project for VisualSprint, or use the team’s existing one.

You will need:

- billing enabled
- permission to use Gemini Enterprise and Cloud Run

### Step 2. Enable the required services

At minimum, enable the services needed for:

- Gemini Enterprise
- Cloud Run
- Secret Manager
- Vertex AI

If you later use more Google services for storage or ingestion, enable those separately.

### Step 3. Create a Gemini Enterprise app

Official reference:

- https://docs.cloud.google.com/gemini/enterprise/docs/create-app

High-level steps from the official flow:

1. Open Google Cloud console.
2. Go to Gemini Enterprise.
3. Open the Apps page.
4. Click `Create app`.
5. Enter the app name.
6. Choose the region or multi-region.
7. Create the app.

Recommended name:

- `VisualSprint`

### Step 4. Enable the web app features required for agents

Official reference:

- https://docs.cloud.google.com/gemini/enterprise/docs/manage-web-app-features

In the Gemini Enterprise app:

1. Open the app in Google Cloud console.
2. Go to `Configurations`.
3. Open `Feature Management`.
4. Turn on:
   - `Enable Agent Gallery`
   - `Enable Agent Designer`

These are required so you can create and manage custom agents in the web app.

## Phase 2. Prepare the coded agent implementation

### Step 5. Create the ADK agent code in the repo

Create the real code-based agents:

- reasoning agent
- summary agent
- action agent for approval-based downstream suggestions

Recommended location in this repo:

- `services/agents`

The ADK path matches this repo better than a web-only builder flow.

Recommended implementation shape:

- keep the current FastAPI adapter in `services/agents`
- add ADK-specific agent code under that service
- keep the repo contracts as the source of truth

The current repo already uses this shape:

- `services/agents/src/visualsprint_agents/adk/`
- `services/agents/src/visualsprint_agents/adk/reasoning_agent.py`
- `services/agents/src/visualsprint_agents/adk/summary_agent.py`
- `services/agents/src/visualsprint_agents/adk/action_agent.py`
- `services/agents/src/visualsprint_agents/adk/tools/`

The remaining work is to keep maturing these into the live deployed ADK implementation and to finish proving the hosted runtime path end to end.

### Step 6. Build the reasoning agent in ADK

The reasoning agent should be designed around the repo’s current contracts:

- chunk reasoning input
- structured reasoning output

Its responsibilities should stay the same as the product contract:

- inspect transcript context
- inspect screen evidence
- compare against running meeting state
- call memory retrieval when needed
- return durable structured outcomes only

### Step 7. Build the summary agent in ADK

The summary agent should be designed around:

- summary packet input
- final report output

Its job should be:

- generate the executive summary
- consolidate decisions and commitments
- keep unresolved blockers visible
- include memory-backed context only when it helps

### Step 8. Use the existing repo contracts as the source of truth

This keeps the adapter thin and avoids double-translation.

The ADK agents should map cleanly to:

- `ChunkInsight`
- `MeetingSummaryPacket`
- `RegisterAgentOutputsRequest`
- `FinalReport`

### Step 9. Use Agent Designer only as an optional prototype aid

If you want fast experimentation:

1. create a temporary prototype in Agent Designer
2. refine prompts and expected behavior
3. move the stable logic into ADK code

Recommended rule:

- production logic should live in code, not only in a web UI flow

## Phase 3. Deploy the ADK agents to Vertex AI Agent Engine

Official references:

- https://google.github.io/adk-docs/deploy/agent-engine/
- https://google.github.io/adk-docs/deploy/agent-engine/deploy/

### Step 10. Prepare for Agent Engine deployment

Before deployment, you generally need:

- a Google Cloud project
- Vertex AI access
- a staging bucket
- the required Python environment

### Step 11. Package each ADK agent for deployment

ADK agents are deployed to Agent Engine as managed applications.

For VisualSprint, that means:

- one deployed reasoning runtime
- one deployed summary runtime

### Step 12. Deploy the agents to Agent Engine

After deployment, you should end up with:

- a reasoning engine resource name
- a summary engine resource name

These are the exact values the current repo can use through:

- `VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME`
- `VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME`

Current confirmed runtime values:

- project ID: `visualsprint-agent`
- project number: `530780341550`
- location: `us-west1`
- reasoning agent ID: `554162656492126208`
- summary agent ID: `6620511354560184320`
- action agent ID: `7293799498852073472`
- reasoning resource: `projects/530780341550/locations/us-west1/reasoningEngines/554162656492126208`
- summary resource: `projects/530780341550/locations/us-west1/reasoningEngines/6620511354560184320`
- action resource: `projects/530780341550/locations/us-west1/reasoningEngines/7293799498852073472`
- reasoning query URL: `https://us-west1-aiplatform.googleapis.com/v1/projects/530780341550/locations/us-west1/reasoningEngines/554162656492126208:query`
- summary query URL: `https://us-west1-aiplatform.googleapis.com/v1/projects/530780341550/locations/us-west1/reasoningEngines/6620511354560184320:query`
- action query URL: `https://us-west1-aiplatform.googleapis.com/v1/projects/530780341550/locations/us-west1/reasoningEngines/7293799498852073472:query`
- Agent Engine runtime service account: `service-530780341550@gcp-sa-aiplatform-re.iam.gserviceaccount.com`

The repo accepts both the older `*_ENGINE_RESOURCE_NAME` env vars and the
console-provided `*_AGENT_RESOURCE` aliases for these Agent Engine paths.

Also capture:

- the Google Cloud project ID
- the Google Cloud location used for the reasoning engines
- any deployment service account used by the agents runtime

## Phase 4. Register the deployed ADK agents inside Gemini Enterprise

Official references:

- https://docs.cloud.google.com/gemini/enterprise/docs/register-and-manage-an-adk-agent
- https://docs.cloud.google.com/gemini/enterprise/docs/agents-overview

### Step 13. Create the Gemini Enterprise app if it does not exist yet

This is still required because the Gemini Enterprise app is the user-facing container where agents appear.

### Step 14. Enable the web app features required for agents

At minimum:

- `Enable Agent Gallery`

If you want UI-based experimentation too:

- `Enable Agent Designer`

### Step 15. Register each ADK agent with the Gemini Enterprise app

In the Gemini Enterprise app:

1. open the app
2. go to `Agents`
3. click `Add Agents`
4. choose `Custom agent via Agent Engine`
5. if your agent needs delegated authorization, add the authorization details
6. click `Next`
7. enter the display name and description
8. provide the deployed Agent Engine reasoning engine resource path
9. click `Create`

Recommended display names:

- `VisualSprint Reasoning Agent`
- `VisualSprint Summary Agent`

The resource path you register should be the Agent Engine path, for example:

- `projects/PROJECT_ID/locations/LOCATION/reasoningEngines/RESOURCE_ID`

or the fully qualified API-style path accepted by the Gemini Enterprise registration flow.

### Step 16. Copy the Gemini app identifiers back into the repo config

After the Gemini Enterprise app and ADK agents exist, copy these values into your deployment configuration:

- Gemini Enterprise app ID -> `VISUALSPRINT_AGENT_APPLICATION_ID`
- reasoning engine resource -> `VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME`
- summary engine resource -> `VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME`
- project ID -> `VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID`
- location -> `VISUALSPRINT_GOOGLE_CLOUD_LOCATION`

### Step 17. Verify the agents appear in Agent Gallery

After registration:

- confirm both agents appear in the Gemini Enterprise app
- confirm they are callable as registered organizational agents

## Phase 5. Optional UI prototyping in Agent Designer

### Step 18. Use Agent Designer only for exploration

You can still use the web app for quick experiments, but this should not replace the coded ADK path.

Use Agent Designer for:

- trying prompt variations
- testing instructions quickly
- comparing prototype behavior against deployed ADK behavior

### Step 19. Do not make Agent Designer the only source of production truth

For this project, the production source of truth should be:

- ADK code
- deployed Agent Engine resources
- repo contracts

## Phase 6. Add the Elastic MCP tool

This part is required for the memory layer.

Official references:

- https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server
- https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools/mcp-tools

### Step 20. Prepare the Elastic side first

The Elastic owner should:

1. create the Elastic Serverless project
2. create the outcomes index
3. create the API key with the needed privileges
4. prepare the MCP endpoint URL

The current official MCP endpoint pattern is:

- `{KIBANA_URL}/api/agent_builder/mcp`
- or `{KIBANA_URL}/s/{SPACE_NAME}/api/agent_builder/mcp`

### Step 21. Prepare the Elastic MCP connector

Inside Elastic Agent Builder tooling, an MCP server endpoint is used to expose tools.

The important point for VisualSprint is:

- Elastic exposes tools through its MCP server
- the reasoning flow should use the `search_prior_outcomes` tool from that MCP-connected setup

### Step 22. Connect the tool in the reasoning flow

The reasoning agent should be configured so that:

1. it identifies a durable candidate signal
2. it calls `search_prior_outcomes`
3. it receives ranked historical matches
4. it uses that result plus the current meeting state to label the relation

Recommended ownership boundary:

- Elastic returns candidates
- the reasoning agent decides `new`, `recurring`, `reopened`, or `resolved_previously`

## Phase 7. Connect the repo adapter to the deployed runtimes

This is where our codebase begins calling the real cloud setup.

## Current repo pieces that already support this

The repo already includes:

- `services/agents/src/visualsprint_agents/config.py`
- `services/agents/src/visualsprint_agents/agent_runtime.py`
- `infra/cloud-run/visualsprint-agents.service.yaml`

That means the document should guide setup using those existing env vars instead of speaking only in abstract terms.

### Step 23. Choose the runtime mode

The current agents service supports two backend modes:

- `bridge`
- `vertex_ai_reasoning_engine`

Current control env vars:

- `VISUALSPRINT_AGENT_MODE`
- `VISUALSPRINT_DEPLOYMENT_TARGET`
- `VISUALSPRINT_AGENT_RUNTIME_BACKEND`

Recommended primary implementation path now:

- use `configured_cloud`
- deploy on `cloud_run`
- prefer `vertex_ai_reasoning_engine` when the ADK agents are deployed to Agent Engine

Use `bridge` only if the team deliberately wants an intermediate step.

### Step 24. Configure the agents service environment

The current repo already expects these values:

- `VISUALSPRINT_ENV`
- `VISUALSPRINT_TRACK`
- `VISUALSPRINT_AGENT_MODE`
- `VISUALSPRINT_DEPLOYMENT_TARGET`
- `VISUALSPRINT_AGENT_RUNTIME_BACKEND`
- `VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID`
- `VISUALSPRINT_GOOGLE_CLOUD_PROJECT_NUMBER`
- `VISUALSPRINT_GOOGLE_CLOUD_LOCATION`
- `VISUALSPRINT_AGENT_APPLICATION_ID`
- `VISUALSPRINT_REASONING_AGENT_ID`
- `VISUALSPRINT_SUMMARY_AGENT_ID`
- `VISUALSPRINT_ACTION_AGENT_ID`
- `VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME`
- `VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME`
- `VISUALSPRINT_REASONING_AGENT_RESOURCE`
- `VISUALSPRINT_SUMMARY_AGENT_RESOURCE`
- `VISUALSPRINT_ACTION_AGENT_RESOURCE`
- `VISUALSPRINT_REASONING_QUERY_URL`
- `VISUALSPRINT_SUMMARY_QUERY_URL`
- `VISUALSPRINT_ACTION_QUERY_URL`
- `VISUALSPRINT_AGENT_RUNTIME_SERVICE_ACCOUNT`
- `VISUALSPRINT_REASONING_AGENT_ENDPOINT_URL`
- `VISUALSPRINT_SUMMARY_AGENT_ENDPOINT_URL`
- `VISUALSPRINT_GOOGLE_API_ACCESS_TOKEN`
- `VISUALSPRINT_AGENT_BRIDGE_BEARER_TOKEN`
- `VISUALSPRINT_AGENT_BRIDGE_BEARER_TOKEN_SECRET_NAME`
- `VISUALSPRINT_AGENT_REQUEST_TIMEOUT_SECONDS`
- `VISUALSPRINT_ELASTIC_MCP_ENDPOINT`
- `VISUALSPRINT_MCP_ENDPOINT`
- `VISUALSPRINT_ELASTIC_API_KEY`
- `VISUALSPRINT_ELASTIC_API_KEY_SECRET_NAME`
- `VISUALSPRINT_SERVICE_ACCOUNT_EMAIL`
- `VISUALSPRINT_CLOUD_RUN_SERVICE_URL`
- `VISUALSPRINT_CONTROL_PLANE_URL`
- `VISUALSPRINT_CONTROL_PLANE_BEARER_TOKEN`
- `VISUALSPRINT_REASONING_MODEL`
- `VISUALSPRINT_SUMMARY_MODEL`
- `VISUALSPRINT_ACTION_MODEL`
- `VISUALSPRINT_ALLOWED_ORIGINS`

For the ADK plus Agent Engine path, the most important ones are:

- `VISUALSPRINT_AGENT_MODE=configured_cloud`
- `VISUALSPRINT_DEPLOYMENT_TARGET=cloud_run`
- `VISUALSPRINT_AGENT_RUNTIME_BACKEND=vertex_ai_reasoning_engine`
- `VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID`
- `VISUALSPRINT_GOOGLE_CLOUD_PROJECT_NUMBER`
- `VISUALSPRINT_GOOGLE_CLOUD_LOCATION`
- `VISUALSPRINT_AGENT_APPLICATION_ID`
- `VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME`
- `VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME`
- `VISUALSPRINT_REASONING_AGENT_RESOURCE`
- `VISUALSPRINT_SUMMARY_AGENT_RESOURCE`
- `VISUALSPRINT_ACTION_AGENT_RESOURCE`
- `VISUALSPRINT_AGENT_RUNTIME_SERVICE_ACCOUNT`

Current confirmed values:

- project ID: `visualsprint-agent`
- location: `us-west1`

### Step 25. Understand the two runtime paths

#### Option A. Vertex AI Reasoning Engine mode

This should now be the preferred production path.

- the adapter calls the Vertex AI query endpoint directly
- the repo uses:
  - `VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME`
  - `VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME`

The adapter calls:

- `https://aiplatform.googleapis.com/v1/{resource_name}:query`

Use this when:

- the agents are built in ADK
- they are deployed to Agent Engine
- you want the cleanest production path

#### Option B. Bridge mode

In bridge mode:

- `services/agents` calls configured external agent endpoints
- the repo uses:
  - `VISUALSPRINT_REASONING_AGENT_ENDPOINT_URL`
  - `VISUALSPRINT_SUMMARY_AGENT_ENDPOINT_URL`

Use this only if you intentionally want a staged or transitional integration.

## Phase 8. Deploy the agents service on Cloud Run

### Step 26. Use the existing Cloud Run YAML as the base

The repo already has:

- `infra/cloud-run/visualsprint-agents.service.yaml`

That file shows the current expected deployment shape and placeholder env vars.

Before deploying, replace placeholders such as:

- `PROJECT_ID`
- `VISUALSPRINT_AGENT_APP_ID`
- `VISUALSPRINT_REASONING_AGENT_ID`
- `VISUALSPRINT_SUMMARY_AGENT_ID`
- runtime endpoint placeholders
- or the Agent Engine resource names, depending on the runtime mode you choose

### Step 27. Attach the service account

Cloud Run should run as a service account that can:

- call required Google runtime APIs
- read needed secrets from Secret Manager

### Step 28. Deploy and verify health

After deployment:

1. hit `/api/health`
2. confirm the health payload reflects configured cloud mode
3. confirm `deploymentReady` is true
4. confirm the missing configuration list is empty for your chosen mode

## Phase 9. Validate through the repo

### Step 29. Run local evals first

The repo already contains:

- `npm run eval:agents`
- `docs/DEPLOY.md`
- `docs/REMAINING_TASKS.md`

Run it before cloud testing so you know the local adapter and eval scaffolding still work.

### Step 30. Use the smoke routes

The API already provides a smoke path for the agent seam:

- `POST /api/meetings/{meeting_id}/agents/smoke`

Use it to test:

- reasoning invocation
- summary invocation
- source reporting

without writing a final report or mutating production behavior unnecessarily.

### Step 31. Check invocation audit

The agents service exposes:

- `GET /api/audit/invocations`

Use this to confirm:

- how many runs happened
- whether they used bridge mode, bridge fallback, or mock mode

This is especially helpful while learning the platform and debugging first deployment attempts.

## Full setup checklist for a first-time Google Agent Builder user

Use this as the simplest practical checklist.

### Google Cloud

- Create the Google Cloud project
- Enable billing
- Enable Gemini Enterprise, Vertex AI, Cloud Run, and Secret Manager
- Create the Gemini Enterprise app
- Enable Agent Gallery
- Enable Agent Designer

### Google web app

- Create or open the Gemini Enterprise app
- enable Agent Gallery
- register the deployed ADK agents
- confirm the agents appear in the app
- optionally use Agent Designer for experiments

### Elastic

- Create the Elastic Serverless project
- create the outcomes index
- generate the API key
- prepare the MCP endpoint
- define `search_prior_outcomes`

### Repo wiring

- configure the agents-service env vars
- prefer `vertex_ai_reasoning_engine`
- update Cloud Run YAML values
- deploy the agents service

### Values to bring back from Google Cloud

- Gemini Enterprise app ID
- reasoning engine resource name
- summary engine resource name
- deployment location
- service account and secret names

### Validation

- run `npm run eval:agents`
- check `/api/health`
- run the API smoke route
- check invocation audit
- confirm the reasoning flow can use Elastic-backed memory

## Step-by-step work to integrate Elastic

This remains the concrete repo plan for Elastic, but the teammate-ready execution version lives in [elastic-integration-handoff.md](./elastic-integration-handoff.md).

### Step 0. Align the canonical contract first

Do this before real Elastic indexing.

Files to review first:

- `packages/contracts/src/domain.ts`
- `services/api/src/visualsprint_api/models.py`
- `services/agents/src/visualsprint_agents/models.py`

Target decisions:

- confirm the canonical stored outcome shape
- keep stable record IDs across chunk updates
- standardize memory relation labels
- make sure evidence references are part of the persisted shape
- decide where tenant scoping lands now, even if the first runtime is still effectively single-tenant

### Step 1. Create the Elastic project and credentials

In Elastic:

1. Create the Elasticsearch Serverless project.
2. Create the index for historical outcomes.
3. Configure semantic search over the key outcome text fields.
4. Generate an API key for backend access.
5. Prepare the MCP server configuration and tool definition.

In Google Cloud:

6. Store the Elastic API key in Secret Manager.
7. Decide which Cloud Run services need direct Elastic access.

### Step 2. Add Elastic configuration to the repo

Primary files to extend:

- `services/api/src/visualsprint_api/config.py`
- `services/agents/src/visualsprint_agents/config.py`

The repo already has the first Elastic config pass in those files.

The remaining work is to:

- resolve real Secret Manager-backed API keys cleanly
- align local direct-key support with deployment-time secret injection
- thread tenant-aware settings through both the API and agents paths

### Step 3. Complete deterministic Elastic write-back in `services/api`

Current write seam already exists:

- `POST /api/meetings/{meeting_id}/outputs/register`
- `POST /api/meetings/{meeting_id}/final-report`

The repo now already contains a first write-back implementation in `services/api`.

The remaining work is to:

- harden secret handling
- add tenant propagation
- verify deployed write-back against the real Elastic project

### Step 4. Keep local mock search only as a fallback

The current route:

- `POST /api/meetings/{meeting_id}/memory/search-prior-outcomes`

already prefers Elastic search when configured and falls back to the local
development path otherwise.

That local fallback should remain only as a development or diagnostic surface.

### Step 5. Define the Elastic MCP tool contract

Tool:

- `search_prior_outcomes`

### Step 6. Wire the reasoning agent to Elastic MCP

The reasoning flow should call the tool before labeling recurring or reopened outcomes.

### Step 7. Validate end to end

Use:

- eval fixtures
- smoke route
- invocation audit
- deployed health checks

## What is still not done

After checking the repo and docs again, these are the main unfinished areas:

### Google Agent Builder gaps

- no confirmed live managed-agent invocation path is proven end to end through the hosted Google path yet
- no confirmed Gemini Enterprise registration proof is captured in the repo docs yet
- no confirmed Elastic MCP-connected reasoning run is proven end to end in the hosted managed runtime yet

### Backend and infrastructure gaps

- Elastic write-back and retrieval now exist in code, but still need real Secret Manager resolution, tenant propagation, and deployed validation
- the agents-side Elastic MCP client exists, but the live managed-agent reasoning path has not yet been proven end to end against the real Elastic project
- secrets and identity wiring are not fully finalized in code and deployment
- the real ingest/media/transcription production path is still separate follow-up work outside the core agent seam

### Product gaps

- the dashboard still needs full deployed-path validation against the managed runtime
- final report generation is not yet proven through real cloud-agent runtime
- the action-review layer exists, but the real Jira and Slack execution path still needs final validation if it is part of the demo

## Suggested execution order

1. Validate Elastic locally against the real backend write-back and search path.
2. Connect the Elastic MCP tool inside the hosted Google reasoning agent.
3. Complete Secret Manager wiring, service accounts, and tenant-scoping follow-ups.
4. Fill the final deployed env values, including control-plane and runtime settings.
5. Deploy or refresh the API and agents services on Cloud Run.
6. Run eval smoke, health checks, agent smoke, and invocation audit validation.
7. Prove one end-to-end recurring-memory path through the hosted managed runtime.

## Definition of done

The Google Agent Builder work is done when all of this is true:

- a real coded reasoning agent exists in ADK
- a real coded summary agent exists in ADK
- both are deployed to Vertex AI Agent Engine
- both are registered in the Gemini Enterprise app
- the deployed agents service is in configured cloud mode
- the reasoning path can invoke the real managed agent
- the summary path can invoke the real managed agent
- the reasoning flow can use Elastic MCP-backed historical retrieval
- the API smoke route succeeds against the configured cloud setup
- the dashboard can surface outputs derived from the real managed path

## Bottom line

The project is not starting from zero.

It already has:

- the correct deterministic backend split
- the shared contracts
- the adapter service shape
- deployment-facing env var structure
- smoke and eval scaffolding
- ADK agents and Elastic code paths
- browser-first capture and approval-based action review surfaces

What you need now is not a brand-new architecture.

What you need is:

1. validate the hosted Google path end to end
2. finish Elastic runtime hardening
3. finalize secrets, service identity, and tenant scoping
4. prove the recurring-memory demo path against deployed services

## Official references

- Gemini Enterprise: Create an app  
  https://docs.cloud.google.com/gemini/enterprise/docs/create-app
- Gemini Enterprise: Register and manage ADK agents  
  https://docs.cloud.google.com/gemini/enterprise/docs/register-and-manage-an-adk-agent
- Gemini Enterprise: Manage web app features  
  https://docs.cloud.google.com/gemini/enterprise/docs/manage-web-app-features
- Gemini Enterprise: Agent Gallery  
  https://docs.cloud.google.com/gemini/enterprise/docs/agent-gallery
- Gemini Enterprise: Agent Designer overview  
  https://docs.cloud.google.com/gemini/enterprise/docs/agent-designer
- Gemini Enterprise: Create an agent  
  https://docs.cloud.google.com/gemini/enterprise/docs/agent-designer/create-agent
- ADK: Agent Engine deployment  
  https://google.github.io/adk-docs/deploy/agent-engine/
- ADK: Standard deployment  
  https://google.github.io/adk-docs/deploy/agent-engine/deploy/
- Elastic Agent Builder MCP server  
  https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server
- Elastic MCP tools  
  https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools/mcp-tools
