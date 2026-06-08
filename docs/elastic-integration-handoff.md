# Elastic Integration Handoff

This document isolates all Elastic-related setup, coding, and verification work for VisualSprint so another team member can continue it without re-analyzing the full project.

Use this together with:

- [Google Cloud Agent Builder plan](./google-cloud-agent-builder.md)
- [Fixes log](./fixes.md)

## Goal

Deliver the Elastic part of the architecture end to end:

1. outcome records are written from the backend into Elastic
2. historical search is exposed through the Elastic MCP tool
3. the Google Agent Builder reasoning flow uses that tool during chunk analysis
4. recurring or reopened issues can be demonstrated in the product

## Ownership boundary

This workstream is a good handoff to one teammate.

That person should own:

- Elastic Serverless project setup
- index design
- API key and secret setup
- backend write-back integration
- MCP tool definition
- Elastic-specific tests and smoke validation

They do not need to own:

- web UI polish
- full browser capture improvements
- summary-agent prompt tuning
- full Cloud Run deployment polish

## Current repo status

The repo already has the right seam, and the first Elastic code path now exists.

What exists now:

- `services/api` persists meeting outputs in memory
- `services/api` exposes `POST /api/meetings/{meeting_id}/memory/search-prior-outcomes`
- `services/api` can now attempt Elastic write-back on output registration and final-report persistence when Elastic config is present
- `services/api` now prefers Elastic-backed memory search when configured, with local fallback for development
- `services/agents` is no longer only a stub service
- `services/agents` now includes an Elastic MCP client and an ADK-side `search_prior_outcomes` tool path

What is missing:

- real Secret Manager-backed API key resolution instead of env-value-only shortcuts
- tenant propagation instead of the current default tenant placeholder
- real deployed MCP validation against the target Elastic project
- real managed-agent-time memory usage proven end to end

## Architecture decisions to keep

These decisions should stay stable while implementing Elastic.

1. `services/api` owns deterministic write-back.
2. `services/agents` stays the adapter boundary to cloud agents.
3. Elastic is the production historical memory layer.
4. The reasoning agent uses Elastic through MCP for retrieval.
5. The dashboard should render the same outcome shape that the backend stores and the agent emits.

## Workstream summary

The Elastic work should be done in this order:

1. align the canonical outcome contract
2. create Elastic project, index, and API key
3. add repo config and secrets wiring
4. complete backend write-back hardening in `services/api`
5. harden the MCP tool contract and config path
6. prove the reasoning agent calls the tool in the real managed path
7. add verification and smoke tests

## 1. Contract alignment before coding

Before touching Elastic, confirm the final record shape across:

- `packages/contracts/src/domain.ts`
- `services/api/src/visualsprint_api/models.py`
- `services/agents/src/visualsprint_agents/models.py`

The Elastic owner should confirm these fields exist in the final persisted model:

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

Also confirm:

- stable IDs are reused across updates
- memory relation labels are standardized
- evidence references are preserved

If this is not aligned first, the Elastic index and the agent output schema will drift.

## 2. Elastic portal setup

The Elastic owner should do the following in Elastic Cloud:

1. Create the Elasticsearch Serverless project.
2. Create the historical outcomes index.
3. Configure semantic search for outcome text fields.
4. Prepare the `search_prior_outcomes` tool.
5. Generate an API key for backend access.
6. Prepare MCP server connectivity details.

Store and share internally:

- project URL
- index name
- API key secret location
- MCP endpoint URL
- any Kibana or tool configuration notes

## 3. Google Cloud setup for Elastic secrets

Elastic secrets should not live in code or in the frontend.

The teammate should prepare:

- Secret Manager entry for the Elastic API key
- service-account access for whichever Cloud Run services need it

Recommended env vars for the repo:

- `ELASTICSEARCH_URL`
- `ELASTICSEARCH_API_KEY_SECRET`
- `ELASTICSEARCH_API_KEY`
- `ELASTIC_INDEX_OUTCOMES`
- `ELASTICSEARCH_INDEX`
- `ELASTIC_MCP_SERVER_URL`

Recommended placement:

- `services/api` uses `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY_SECRET` or `ELASTICSEARCH_API_KEY`, and `ELASTIC_INDEX_OUTCOMES` or `ELASTICSEARCH_INDEX`
- `services/agents` uses `ELASTIC_MCP_SERVER_URL` and any agent-runtime-specific settings

## 4. Repo files the Elastic owner should change

Primary files:

- `services/api/src/visualsprint_api/config.py`
- `services/api/src/visualsprint_api/repository.py`
- `services/agents/src/visualsprint_agents/config.py`

New files likely needed:

- `services/api/src/visualsprint_api/elastic_client.py`
- `services/api/src/visualsprint_api/elastic_models.py`
- `services/api/src/visualsprint_api/elastic_mapping.py`

Optional supporting files:

- tests for Elastic mapping and write-back under `services/api/tests/`

## 5. Backend coding tasks in `services/api`

This is the main code ownership for the Elastic teammate.

### Task A. Add Elastic config

Extend [config.py](../services/api/src/visualsprint_api/config.py) with:

- Elastic URL
- Elastic index name
- Elastic secret or API key setting
- optional enable/disable flag for local fallback

The initial config pass already exists.

The remaining work is to:

- add a clean direct-key path for local development where needed
- resolve secret-name inputs through deployment-time secret injection or Secret Manager
- keep the API and agents config naming aligned

### Task B. Add a small Elastic client

Create a focused client module that can:

- index or upsert outcome documents
- retrieve documents for diagnostics if needed
- stay isolated from business logic

Keep the client simple. It should not own meeting logic.

### Task C. Add mapping from outcome records to Elastic documents

The API currently stores decisions, commitments, blockers, and open questions in meeting state.

Add a mapper that converts those records into one canonical Elastic document shape.

The mapper should:

- normalize record type names
- preserve stable IDs
- preserve evidence references
- preserve status transitions
- include ownership and severity fields when present

### Task D. Hook Elastic write-back into output registration

The right seam is already present in:

- `POST /api/meetings/{meeting_id}/outputs/register`

When outputs are registered:

1. update the in-memory meeting state
2. build index documents for changed records
3. write or upsert those documents into Elastic

This keeps persistence deterministic and backend-owned.

The first implementation of this already exists in the repo.

The remaining work is to verify it against the real Elastic project and remove
the misleading "secret name as raw key" assumption.

### Task E. Keep local behavior usable for development

Do not fully remove local development fallback on the first pass.

Recommended behavior:

- local in-memory view remains for UI rendering
- Elastic write-back can be optional or no-op when config is absent
- retrieval route can remain for diagnostics, but should no longer be treated as the production memory layer

## 6. MCP tool definition tasks

The Elastic owner should define a tool named:

- `search_prior_outcomes`

Suggested tool input:

- `recordType`
- `summary`
- `detail`
- `tenantId`
- optionally `meetingId`

Suggested tool output:

- matched prior records
- scores
- enough metadata for the reasoning agent to decide:
  - `new`
  - `recurring`
  - `reopened`
  - `resolved_previously`

Recommended boundary:

- Elastic returns ranked candidates
- the reasoning agent assigns the final relation label

That keeps retrieval and reasoning responsibilities clean.

## 7. Agent integration tasks that depend on Elastic

The Elastic teammate may own this directly, or pair with the Agent Builder teammate.

Required outcome:

- the chunk reasoning agent calls `search_prior_outcomes` during real reasoning

Minimal behavior to verify:

1. a chunk contains a durable blocker candidate
2. Elastic contains a similar prior blocker
3. the reasoning agent calls the MCP tool
4. the final response includes a memory-backed result

## 8. Suggested implementation checklist

This is the practical checklist the other teammate can work through.

### Setup

- Create Elastic Serverless project
- Create outcome index
- Create API key
- Store API key in Google Secret Manager
- Record MCP endpoint details

### Backend config

- Add Elastic settings to `services/api`
- Add Elastic settings to `services/agents` if needed
- Document local env requirements

### Backend code

- Add Elastic client module
- Add outcome-to-index-document mapper
- Hook write-back into output registration
- Preserve local fallback behavior

### Agent and MCP

- Define `search_prior_outcomes`
- Connect MCP tool to Agent Builder
- Verify reasoning-agent usage

### Testing

- Add unit test for document mapping
- Add test for write-back on output registration
- Add test for update or reopened record indexing
- Add one smoke path for recurring-match retrieval

## 9. Acceptance criteria

The Elastic workstream is done when all of this is true:

- registering outputs writes real documents to Elastic
- updated or reopened records upsert correctly
- the index shape matches the agreed contract
- the reasoning agent can call the MCP tool
- a recurring or reopened issue can be demonstrated end to end
- local development still works without breaking the dashboard flow

## 10. Risks to watch

The teammate should watch for these likely issues:

- contract mismatch between UI models and indexed documents
- relation labels being assigned in two different places
- indexing every record but never reusing stable IDs
- mixing portal-only setup with missing repo code
- breaking local development while adding production config

## 11. Recommended handoff note to the teammate

You own the Elastic memory layer for VisualSprint.

Please focus on:

1. setting up Elastic Serverless and the MCP tool
2. adding deterministic write-back from `services/api`
3. keeping the schema aligned with the shared contracts
4. proving one recurring-memory demo path

Avoid changing unrelated UI or capture behavior unless required by the Elastic seam.
