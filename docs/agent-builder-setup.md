# Agent Builder Setup

This document expands the root [README](../README.md) with a practical setup path for the Google-managed agent layer in VisualSprint.

## Purpose

VisualSprint is not being built entirely inside Google Agent Builder.

We are using Google Agent Builder because:

- the hackathon requires a functional agent powered by Gemini and Google Cloud Agent Builder
- VisualSprint needs a managed orchestration layer for a multi-agent workflow
- Elastic MCP needs to be available as a tool inside the agent workflow
- the product still needs normal application services for capture, storage, APIs, and UI

## What Agent Builder Owns

Agent Builder should own:

- managed multi-step agent orchestration
- main-agent and subagent definitions
- Gemini-powered reasoning flow
- tool invocation rules
- managed preview and iteration loop
- deployment of the managed agent experience

## What Our Codebase Owns

Our codebase should own:

- browser capture
- meeting lifecycle APIs
- chunk registration
- upload lifecycle and storage
- dashboard rendering
- persistence and tenancy boundaries
- Elastic indexing preparation
- delivery of live and final report data to the UI

## Setup Steps

1. Create or select the Google Cloud project for VisualSprint.
2. Enable the Google Cloud services needed for Gemini Enterprise and managed agent setup.
3. Create the Gemini Enterprise app in Google Cloud.
4. Open the Gemini Enterprise app in the browser.
5. Click `Create agent`.
6. Choose `Proceed to builder` so the project starts in the flow builder.
7. Create the main agent:
   - Name: `VisualSprint Orchestrator`
   - Role: coordinate meeting analysis, tool use, and structured outputs
8. Add subagents:
   - `Transcript Agent`
   - `Vision Agent`
   - `Reasoning Agent`
   - `Memory Agent`
   - `Summary Agent`
9. Add tools and connections:
   - Elastic MCP tools for historical retrieval
   - our backend tool endpoints for deterministic product actions
10. Add detailed instructions:
    - process meeting context chunk by chunk
    - return structured output for decisions, commitments, blockers, and memory matches
    - query Elastic before finalizing recurring or unresolved issues
11. Use Preview to test the flow with sample meeting inputs.
12. Refine the instructions and tool descriptions until outputs are stable.
13. Create and deploy the managed agent once the flow is reliable.

## Recommended VisualSprint Agent Roles

### VisualSprint Orchestrator

- owns the high-level flow
- decides when to call subagents
- decides when to trigger memory lookup
- decides when to emit final structured output

### Transcript Agent

- reasons over transcript segments
- extracts speaker-aware conversational meaning

### Vision Agent

- reasons over screen context
- identifies visual evidence such as errors, code views, diagrams, or UI state

### Reasoning Agent

- combines transcript and visual evidence
- identifies decisions, commitments, blockers, and open questions

### Memory Agent

- queries Elastic MCP
- checks whether similar issues or promises appeared before

### Summary Agent

- builds the final meeting report after the meeting ends

## Why This Is Not Portal-Only

If we only build inside Agent Builder, we still would not have:

- live browser capture
- chunk upload handling
- persistent meeting storage
- live dashboard transport
- product-specific APIs
- tenant-scoped application boundaries

So the practical architecture is:

- Agent Builder for the managed agent flow
- FastAPI and web services for the product runtime

## Build Order

1. Finish deterministic backend contracts.
2. Build real ingestion and media-processing services.
3. Add Elastic-backed memory support.
4. Create the managed agent flow in Google Agent Builder.
5. Connect the agent to our backend tools.
6. Feed agent outputs into the VisualSprint dashboard.
7. Finalize deployment and submission assets.

## Official References

- [Hackathon rules](https://rapid-agent.devpost.com/rules)
- [Hackathon resources](https://rapid-agent.devpost.com/resources)
- [Create an agent](https://docs.cloud.google.com/gemini/enterprise/docs/agent-designer/create-agent)
- [Agents overview](https://docs.cloud.google.com/gemini/enterprise/docs/agents-overview)
- [Register ADK agents](https://docs.cloud.google.com/gemini/enterprise/docs/register-and-manage-an-adk-agent)
- [Elastic MCP docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server/)
