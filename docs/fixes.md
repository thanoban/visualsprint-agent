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
