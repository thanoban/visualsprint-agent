# Google Cloud Agent Builder Plan

This document answers one question after analyzing the current repository:

What do we still need to do in Google Cloud Agent Builder for VisualSprint?

It is based on the code that exists today, not only on the target architecture in the root `README.md`.

## Short answer

The repo is already preparing the right inputs and outputs for an agent system, but the real Google Cloud agent layer is not wired yet.

Today the project has:

- a working web shell with browser capture and live dashboard surfaces
- a deterministic API/control plane with meeting, chunk, memory, and report routes
- stub ingest and media services
- a local stub `services/agents` service that returns deterministic mock reasoning and summary outputs

What is still missing is the production Agent Builder path:

1. Create the real Google Cloud agent application.
2. Create the chunk reasoning agent.
3. Create the meeting summary agent.
4. Connect the Elastic MCP tool for historical memory retrieval.
5. Connect backend action tools for output persistence and report finalization.
6. Replace the local stub agent logic with a Cloud-hosted adapter that calls the deployed agents.
7. Add auth, secrets, evaluation data, and deployment wiring.

## What the repo already gives us

### 1. Shared contracts already exist

The project already defines the product vocabulary and payload shapes in `packages/contracts/src/domain.ts`.

Important existing contracts:

- `ChunkInsight`
- `MeetingSummaryPacket`
- `RegisterAgentOutputsRequest`
- `FinalReport`
- `SearchPriorOutcomesRequest`

This is good news because Agent Builder work should follow these contracts instead of inventing new ones.

### 2. The control plane is already agent-ready

`services/api` already does the deterministic work that should stay outside the agent:

- meeting lifecycle
- capture session lifecycle
- chunk registration
- transcript and screen-event assembly
- meeting-state assembly
- persistence of agent outputs
- final report storage

That separation is the right design for Agent Builder.

### 3. Agent input payloads are already assembled

The API already builds the two main agent inputs:

- chunk reasoning input through the chunk insight pipeline
- end-of-meeting summary input through the summary packet pipeline

This means Agent Builder should consume assembled business context, not raw media or low-level lifecycle events.

### 4. The current `services/agents` service is only a stub

The current agent service is not using Google Cloud Agent Builder or Gemini yet.

Right now it:

- exposes `/api/reasoning/chunks/run`
- exposes `/api/summary/meetings/run`
- returns deterministic placeholder decisions, commitments, blockers, questions, and memory matches

This is useful for local UI progress, but it does not satisfy the real hackathon requirement by itself.

### 5. Memory is still mocked in the repo

The API already exposes a local `search-prior-outcomes` route, but the implementation is in-memory keyword matching.

That is a stand-in for the real production requirement:

- Elastic Serverless index
- Elastic Agent Builder tool
- Elastic MCP server
- historical hybrid search with relation labeling

## Important findings from the `origin/udula` docs review

The `origin/udula` branch added a helpful `docs/fixes.md`. The most useful findings to carry forward into the Agent Builder and Elastic plan are:

- the current output contracts still need to converge on the final agent-plus-Elastic shape
- mock reasoning is still coupled too closely to chunk upload completion
- verification should include a runtime smoke path, not only syntax checks

That means Elastic should not be treated as a last-mile add-on. We need to align the contract and the integration seam before wiring the real memory layer.

## Recommended production shape

The cleanest path is not to make `services/api` talk directly to Agent Builder everywhere.

Instead:

1. Keep `services/api` as the deterministic orchestrator.
2. Replace `services/agents` with a thin adapter service deployed on Cloud Run.
3. Have that adapter call the real Google Cloud agents.
4. Preserve the existing HTTP contract from `services/api` to `services/agents`.

Why this is the safest option:

- the API already expects `VISUALSPRINT_AGENTS_SERVICE_URL`
- the current integration seam is stable
- the web app and tests do not need a major rewrite
- we can swap mock logic for real cloud logic with minimal repo churn

## Elastic integration principles

Before the step-by-step work, these are the project rules we should follow for Elastic:

1. Elastic is the production memory layer, not a side cache.
2. Elastic writes stay deterministic and backend-owned.
3. Elastic reads for historical reasoning happen through the MCP-connected tool.
4. The same structured outcome shape should drive the agent, the API, the UI, and the Elastic index.
5. The adapter in `services/agents` should hide cloud-specific details from the rest of the repo.

For a teammate-ready Elastic-only handoff, use [elastic-integration-handoff.md](./elastic-integration-handoff.md).

## Exactly what to build in Google Cloud Agent Builder

### 1. Create the top-level agent application

In Google Cloud, create the VisualSprint agent application in Vertex AI Agent Builder.

Use it as the home for:

- agent configuration
- model selection
- tool definitions
- safety settings
- evaluation and previews
- deployment

Official docs:

- Vertex AI Agent Builder docs: https://docs.cloud.google.com/agent-builder

### 2. Create the chunk reasoning agent

This is the most important agent in the project.

Its job is to consume the existing `ChunkInsight` payload and produce structured outputs matching `RegisterAgentOutputsRequest`.

Input source from this repo:

- the payload returned by `GET /api/meetings/{meeting_id}/insights/chunks/{client_chunk_id}`

Expected responsibilities:

- inspect the transcript window
- inspect extracted screen evidence
- compare against running meeting state
- decide whether signals are new, updated, resolved, or reopened
- call memory lookup when a durable signal is detected
- return decisions, commitments, blockers, open questions, and memory matches

What the prompt/instructions must enforce:

- only emit durable outcomes
- avoid duplicates when the running state already contains the same issue
- cite transcript or screen evidence in reasoning
- use memory lookup before assigning relation labels like `new`, `recurring`, or `reopened`
- return schema-valid structured output only

### 3. Create the summary agent

This agent should consume the existing `MeetingSummaryPacket` payload and produce the final report.

Input source from this repo:

- the payload returned by `GET /api/meetings/{meeting_id}/summary-packet`

Expected responsibilities:

- write the executive summary
- consolidate decisions
- consolidate commitments with owners and due hints
- keep unresolved blockers visible
- keep open questions visible
- include memory-backed historical context only when it changes confidence or priority

Output target:

- `FinalReport`

### 4. Add the Elastic MCP tool connection

This is the partner-track-critical part.

The reasoning agent should not use the repo's local mock memory route in production for the hackathon story. It should use the Elastic MCP-connected tool.

Build or configure the following in Elastic:

- Serverless index for historical outcomes
- ELSER-backed semantic field
- tool named `search_prior_outcomes`
- MCP server endpoint and authentication

Then connect that tool inside Agent Builder so the reasoning agent can call it during chunk analysis.

Official references:

- Elastic MCP server docs: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server/
- Elastic hackathon resources: https://rapid-agent.devpost.com/details/elastic-resources

### 5. Add backend action tools

The agent needs a small set of deterministic actions.

Minimum tool surface:

- `register_outputs`
- `finalize_report`

Optional tool:

- `get_meeting_state`

Recommended mapping to existing repo endpoints:

- `register_outputs` -> `POST /api/meetings/{meeting_id}/outputs/register`
- `finalize_report` -> `POST /api/meetings/{meeting_id}/final-report`

Important note:

The repo is already designed so most context should be passed into the agent up front. Do not force the agent to fetch basic chunk context that the backend already has.

## Step-by-step work to integrate Elastic

This is the concrete repo plan for Elastic, not just the cloud-side plan.

The detailed teammate handoff version of this work lives in [elastic-integration-handoff.md](./elastic-integration-handoff.md).

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

Why first:

- Elastic index mapping should reflect the final shape
- Agent Builder structured output should validate against the same shape
- otherwise we will create avoidable translation debt

### Step 1. Create the Elastic project and credentials

In Elastic:

1. Create the Elasticsearch Serverless project.
2. Create the index for historical outcomes.
3. Create the semantic field strategy for `summary` plus key `detail`.
4. Generate an API key for server-side access.
5. Prepare the MCP server configuration and tool definition.

In Google Cloud:

6. Store the Elastic API key in Secret Manager.
7. Decide which Cloud Run services need direct Elastic access.

Minimum secrets/config we should plan for:

- `ELASTICSEARCH_URL`
- `ELASTICSEARCH_API_KEY_SECRET`
- `ELASTIC_INDEX_OUTCOMES`
- `ELASTIC_MCP_SERVER_URL`

### Step 2. Add Elastic configuration to the repo

Introduce config only at the service boundaries that need it.

Primary files to extend:

- `services/api/src/visualsprint_api/config.py`
- `services/agents/src/visualsprint_agents/config.py`

Recommended config split:

- `services/api` owns Elastic write-back configuration
- `services/agents` owns MCP or agent-runtime connectivity configuration

Do not spread Elastic access details into the web app.

### Step 3. Implement deterministic Elastic write-back in `services/api`

This is the first actual code integration slice.

Current write seam already exists:

- output registration in `POST /api/meetings/{meeting_id}/outputs/register`
- final report persistence in `POST /api/meetings/{meeting_id}/final-report`

Work to do:

1. Add an Elastic repository/client module under `services/api`.
2. Convert persisted outcome records into index documents.
3. Write each finalized or updated outcome into Elastic when outputs are registered.
4. Keep the local in-memory projection for development, but make Elastic the production historical store.
5. Preserve deterministic retries and idempotency where possible.

Primary code areas to touch:

- `services/api/src/visualsprint_api/repository.py`
- a new Elastic client module in `services/api/src/visualsprint_api/`

Index fields should include at least:

- `id`
- `tenant_id`
- `meeting_id`
- `record_type`
- `summary`
- `detail`
- `status`
- `owner_label`
- `speaker_label`
- `due_hint`
- `severity`
- `first_seen_chunk_id`
- `last_updated_chunk_id`
- `created_at`
- `updated_at`
- `evidence`

### Step 4. Keep local mock search only as a fallback

The current route:

- `POST /api/meetings/{meeting_id}/memory/search-prior-outcomes`

should stop being presented as the main production memory layer.

Recommended role after integration:

- local fallback for development
- backup diagnostic surface
- optional smoke-test helper

But for the hackathon-critical production path:

- the reasoning agent should use Elastic through MCP, not this local keyword matcher

### Step 5. Define the Elastic MCP tool contract

The tool name already fits the repo language:

- `search_prior_outcomes`

Tool input should map closely to existing request types:

- `recordType`
- `summary`
- `detail`
- `tenantId`
- optionally `meetingId`

Tool output should support:

- matched historical records
- scores
- enough fields for the reasoning agent to assign `new`, `recurring`, `reopened`, or `resolved_previously`

Important design rule:

- relation labels should be owned by one clear layer

Recommended choice:

- Elastic returns ranked candidates
- the reasoning agent assigns the final relation label using the candidates plus current meeting state

### Step 6. Wire the reasoning agent to Elastic MCP

Once the tool exists, update the real chunk reasoning agent so that it:

1. inspects chunk insight input
2. identifies durable candidate outcomes
3. calls `search_prior_outcomes`
4. compares matches with running state
5. emits structured outputs plus memory matches

This is where the partner-track value becomes real.

Verification target:

- for a blocker-like chunk, the agent should return a memory-backed result when Elastic contains a similar prior issue

### Step 7. Refactor `services/agents` into the cloud adapter

The current service returns deterministic placeholder data. Replace that behavior with:

1. input validation against current repo payloads
2. call to the deployed chunk reasoning agent
3. call to the deployed summary agent
4. response normalization back into repo-native schemas
5. health reporting that reflects cloud configuration state

Files to replace or extend:

- `services/agents/src/visualsprint_agents/main.py`
- `services/agents/src/visualsprint_agents/reasoning.py`
- `services/agents/src/visualsprint_agents/summary.py`
- `services/agents/src/visualsprint_agents/config.py`

### Step 8. Split upload completion from real reasoning work

This is one of the best insights from the `origin/udula` fixes review.

The production flow should become:

1. chunk upload completes
2. deterministic services assemble transcript plus visual context
3. the agent adapter runs chunk reasoning
4. outputs are registered
5. Elastic write-back happens on persistence
6. the UI consumes the updated state

Keep that separation clean so Elastic and Agent Builder remain integrations, not invasive rewrites.

### Step 9. Add Elastic-specific verification

Before deployment, add tests for:

- indexing a decision into Elastic
- indexing an updated or reopened record
- agent response handling when Elastic returns no good matches
- agent response handling when Elastic returns recurring matches
- summary generation after prior memory-backed outputs were registered

Recommended levels:

- unit tests for document mapping
- service tests for the API write-back seam
- adapter tests for agent response normalization
- one end-to-end smoke path across API -> agents -> Elastic-backed memory

### Step 10. Update the submission story

Once Elastic is really wired, update:

- root `README.md`
- demo script
- Devpost copy

Make sure the story clearly says:

- deterministic services own capture and persistence
- Google Agent Builder owns reasoning and summarization
- Elastic MCP provides historical memory retrieval

## What is not done yet

After reviewing the full repo, these are the biggest gaps between the current codebase and the intended hackathon architecture.

### Agent Builder gaps

- no real Google Cloud agent has been created yet
- no Gemini-powered reasoning call exists in the codebase
- no Elastic MCP tool connection exists in the running implementation
- no Responsible AI or safety configuration exists yet
- no deployed agent resource is referenced anywhere

### Backend and infrastructure gaps

- no real Cloud Run deployment configuration is present in `infra/`
- no Agent Builder client or SDK integration exists in `services/agents`
- no Secret Manager wiring exists in code
- no Cloud SQL, GCS, Pub/Sub, or Memorystore integration exists yet
- no real Speech-to-Text integration exists yet
- no real Elastic write-back or retrieval implementation exists yet

### Product gaps

- the dashboard is showing mock-derived outputs, not cloud-agent outputs
- capture upload completion does not yet upload real media to cloud storage
- summary generation is still deterministic placeholder logic

## Suggested execution order

1. Align the canonical outcome contract across `packages/contracts`, `services/api`, and `services/agents`.
2. Add Elastic project, index, secrets, and repo config.
3. Implement deterministic Elastic write-back in `services/api`.
4. Convert `services/agents` into a Cloud adapter instead of deleting it.
5. Build the real chunk reasoning agent and wire Elastic MCP memory search.
6. Verify `register_outputs` plus Elastic indexing end to end.
7. Build the real summary agent after chunk reasoning is stable.
8. Add Elastic-specific evaluation runs and only then do final Cloud Run deployment polish.

## Definition of done for Agent Builder

We can say the Agent Builder work is truly done when all of this is true:

- a real deployed Google Cloud agent handles chunk reasoning
- a real deployed Google Cloud agent handles summary generation
- the reasoning agent uses the Elastic MCP tool during execution
- `services/api` receives real structured outputs through the existing agent-service seam
- the web dashboard shows agent-produced outcomes instead of stub outputs
- the final report is generated from the real summary agent
- at least one end-to-end meeting flow works against deployed cloud services

## Bottom line

The project is not starting from zero. The repo already has the correct seams, contracts, and UI surfaces for Agent Builder.

The main remaining work is to replace the stub `services/agents` implementation with a real Google Cloud Agent Builder integration and to attach the Elastic MCP tool as the production memory layer.

If we do that through the existing `services/agents` boundary, we can keep most of the rest of the repo intact and move much faster.
