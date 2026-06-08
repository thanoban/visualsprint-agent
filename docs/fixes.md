# Fixes Log

This document captures repo issues that affect the VisualSprint implementation path, especially the transition from local mock processing to real Google Agent Builder plus Elastic memory.

## Reviewed from `origin/udula`

The `origin/udula` docs branch had one especially useful document: `docs/fixes.md`.

The most important findings from that analysis are still relevant:

1. Runtime bugs can slip through `compileall`.
2. The implemented contracts are still more UI-shaped than final-agent-shaped.
3. Mock reasoning is still coupled to the upload-complete request path.

## Findings that matter for Elastic integration

### 1. Output-contract divergence

The architecture in the root README describes a canonical outcome shape with concepts like:

- stable cross-chunk IDs
- status transitions
- evidence references
- memory match relation labels
- tenant scoping

The current contracts in `packages/contracts/src/domain.ts` and the API models are close, but not fully aligned yet.

Why this matters:

- Elastic indexing should use the final canonical shape.
- Agent Builder output validation should use the same shape.
- The dashboard should render the same shape that Elastic stores and the agent emits.

### 2. Mock processing is still synchronous inside upload completion

Today the repo still lets chunk upload completion trigger local transcript/media/reasoning behavior directly in the same request path.

Why this matters:

- the production flow should split deterministic lifecycle handling from managed-agent reasoning
- Elastic write-back and lookup should hang off the clean post-processing seam
- this is easier to replace now than after more product code builds on the mock path

### 3. Verification is weaker than the final system needs

`npm run verify` is useful, but syntax checks alone will not catch integration regressions involving:

- agent payload shape drift
- Elastic indexing drift
- Secret Manager configuration issues
- tool-calling failures

Why this matters:

- Elastic integration needs at least one end-to-end smoke path
- the path should validate create meeting -> process chunk -> memory lookup -> register outputs -> final report

## Recommended follow-up

Use these findings as prerequisites for the Elastic integration plan in [google-cloud-agent-builder.md](./google-cloud-agent-builder.md):

1. align the canonical outcome contract first
2. keep the `services/api` to `services/agents` seam stable
3. move real reasoning and memory lookup behind that seam
4. add Elastic-specific smoke tests before deployment

## Branch review findings (main / thanoban) — 2026-06-08

Full read-only review of the Elastic + ADK work now on `main` (which also covers
`thanoban`). The architecture, the deterministic-vs-agent split, and the
end-to-end flow are correct, and the service test suite passes (38 tests). The
items below are integration/cleanup gaps to close before a live cloud demo —
not redesigns.

### 1. ADK persistence tools do not persist yet

`services/agents/src/visualsprint_agents/adk/tools/persistence.py` — `register_outputs`
and `finalize_report` return `{"status": "deferred", ...}` and never call the
control plane.

Why it matters:

- a deployed ADK reasoning/summary agent will "call" these tools, but nothing is
  written, so an end-to-end ADK demo cannot actually persist outputs or a report.

How to fix:

- implement the tools to POST to the deterministic control plane:
  - `register_outputs` -> `POST /api/meetings/{meetingId}/outputs/register`
  - `finalize_report` -> `POST /api/meetings/{meetingId}/final-report`
- inject the control-plane base URL via config (e.g. `VISUALSPRINT_CONTROL_PLANE_URL`)
  and keep the deferred no-op as the fallback when it is unset, so local tests stay green.

### 2. Two parallel agent execution paths

The agents service supports both a bridge / Vertex AI Reasoning Engine path
(`agent_runtime.py`) and the ADK deployable apps (`adk_apps/`, `adk/`). Both are
valid Google paths, but they overlap.

Why it matters:

- maintaining two runtimes doubles the integration surface and can make it unclear
  which path the demo actually uses.

How to fix:

- pick one as primary for the submission (ADK + Agent Engine is the most current
  Gemini Enterprise Agent Platform path) and clearly label the other as
  optional/fallback in `docs/google-cloud-agent-builder.md` and the agents README.

### 3. Elastic API key: secret name used as the key; no Secret Manager resolution

`services/api/src/visualsprint_api/elastic_client.py` sends
`config.elasticsearch_api_key_secret` directly as the `ApiKey` Authorization value,
but the env var (`ELASTICSEARCH_API_KEY_SECRET`) is named like a Secret Manager
reference, not the key itself.

Why it matters:

- it only works if the raw key is pasted into the "secret name" variable; it does
  not resolve a real Secret Manager secret, and the naming is misleading.

How to fix:

- add a direct `ELASTICSEARCH_API_KEY` for local/dev (the agents-side MCP client
  already uses this), and treat `ELASTICSEARCH_API_KEY_SECRET` as a Secret Manager
  resource name resolved at startup (or via Cloud Run `--set-secrets`). Use the
  resolved value in the `ApiKey` header.

### 4. Tenant is hard-coded to "default" in the Elastic layer

`elastic_mapping.py` and `elastic_client.py` use `tenant_id = "default"` for both
write-back and the search filter.

Why it matters:

- README principle 8 calls for tenant-scoped memory from the start; hard-coding
  blocks multi-tenant isolation later.

How to fix:

- thread a tenant id from the meeting/request (e.g. an `X-VisualSprint-Tenant`
  header or a meeting field) into the mapper and the search `term` filter; keep
  `"default"` as the fallback.

### 5. Docs contain machine-local absolute links

`docs/agent-creation-chatgpt-prompts.md` and `docs/elastic-integration-handoff.md`
link with paths like `/d:/PROJECTS/Startup/VisualSprint/docs/...`.

Why it matters:

- these links are broken on GitHub and in any other checkout, and they leak a local
  machine path in a public repo.

How to fix:

- replace them with repo-relative links, e.g. `./google-cloud-agent-builder.md` and
  `./elastic-integration-handoff.md`.

### 6. Developer-tooling doc naming

`docs/agent-creation-chatgpt-prompts.md` documents using ChatGPT to draft agent
prompts.

Why it matters:

- using a non-Google LLM as a *dev tool* is not a rules violation (the rules govern
  the product's AI, not authoring tooling), but the filename can momentarily confuse
  a judge skimming the repo.

How to fix (optional):

- rename/reframe to a provider-neutral title such as `agent-creation-prompts.md`, and
  add a one-line note clarifying these are setup prompts, not product AI.

### 7. Model name vs submission story

The ADK reasoning scaffold uses `model="gemini-flash-latest"`
(`adk/reasoning_agent.py`), while the root README markets "Gemini 3".

Why it matters:

- a reviewer may flag the mismatch between the narrative and the configured model.

How to fix:

- standardize on one model id and reflect it consistently across the README, the ADK
  scaffolds, and the demo script.
