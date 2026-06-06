# VisualSprint

VisualSprint is a production-oriented multi-agent meeting intelligence platform for engineering teams. It captures live meeting audio and screen context, reasons across the conversation, checks organizational memory across past meetings, and produces structured outputs such as decisions, commitments, blockers, open questions, and a final evidence-backed report.

## Project Status

This repository is now in the early implementation stage.

- The repository now contains foundational product code for the web shell, shared contracts, and FastAPI control plane.
- The current implementation supports meeting session creation, local lifecycle transitions, browser capture session registration, chunk metadata tracking, mock transcript and reasoning outputs per chunk, and dashboard-to-API integration.
- Blob upload to object storage, real transcription, Elastic-backed memory retrieval, and full Google Agent Builder orchestration are still upcoming slices.

## What VisualSprint Does

VisualSprint is designed to observe engineering meetings, understand what happened, and convert the meeting into durable, actionable knowledge.

The intended platform will:

- capture browser-based meeting audio and shared-screen context
- process recordings in time-based chunks
- generate timestamped transcript segments with speaker context
- detect visual evidence such as code, terminals, diagrams, errors, and slides
- identify decisions, commitments, blockers, and open questions
- compare current meeting context with past meeting history
- produce a live dashboard during the meeting
- generate a structured final report immediately after the meeting ends

The product goal is not to create a better transcript. The goal is to create a trustworthy system of record for what the team actually decided, why it was decided, who owns follow-up work, and whether the same problem has already appeared before.

## Why This Fits The Google Cloud Rapid Agent Hackathon

VisualSprint is intentionally designed around the current hackathon rules and submission format.

Based on the official hackathon materials, the challenge requires teams to build a functional agent powered by Gemini and Google Cloud Agent Builder, integrate a partner MCP server, and solve a real-world challenge with reasoning, planning, and action rather than simple chat behavior. The submission also requires a hosted project URL, a public open-source repository with a visible license, a selected partner track, a completed Devpost submission, and an approximately 3-minute demo video.

The current official partner-track categories listed in the rules and resources are:

- Arize
- Elastic
- Fivetran
- GitLab
- MongoDB
- Dynatrace

VisualSprint is being planned for the **Elastic** category.

The rules also state that the project should be built using Google Cloud and the specific partner products relevant to the chosen track. For VisualSprint, that means the core agent experience should be built on Google Cloud with Google Agent Builder, while the cross-meeting memory layer should use Elastic products for the Elastic track.

VisualSprint fits that structure well because:

- it is agent-first rather than chatbot-first
- it uses multiple specialized agents with a clear orchestration layer
- it integrates a partner MCP server through the Elastic track
- it solves a concrete engineering workflow problem
- it has a clear live demo story and a strong post-meeting output

Verified deadline: **June 11, 2026 at 2:00 PM PDT**

## Why We Chose Google Agent Builder

We chose Google Agent Builder for two reasons: hackathon alignment and long-term platform fit.

First, the hackathon explicitly requires a functional agent powered by Gemini and Google Cloud Agent Builder. Choosing that stack is the most direct way to satisfy the contest rules without forcing a workaround.

Second, VisualSprint is not intended to be a single-prompt application. It is a multi-agent system with orchestration, structured tool use, memory lookups, and post-meeting synthesis. Google’s current agent platform direction supports custom agents, multi-step flows, deployment, and governance, which makes it a more credible long-term choice for a product that may later support multiple organizations, more connectors, and more complex workflow automation.

For VisualSprint, Google Agent Builder is the right choice because it gives us:

- a rule-compliant core stack for the hackathon
- a natural orchestration layer for multi-agent meeting analysis
- alignment with Gemini for reasoning and multimodal processing
- a path toward enterprise-grade scaling, governance, and managed agent operations

### How VisualSprint Will Use Google Agent Builder

Based on the official hackathon resources, Google Agent Builder is the low-code managed path for building agents with orchestration, grounding, and enterprise data connectivity. VisualSprint will use it as the managed agent layer rather than treating it as a side tool.

Planned usage in this project:

- define the managed meeting-intelligence agent experience in Google Agent Builder
- use Gemini as the reasoning model behind the managed agent workflows
- connect the Elastic MCP server to the agent so historical memory tools are available inside the agent workflow
- use Agent Builder extensions and tool connections where the managed agent needs access to external APIs or controlled actions
- keep deterministic Python services outside the managed agent for capture intake, chunking, media preparation, signed uploads, retries, and state transitions
- use Cloud Run or Agent Runtime for custom Python services and tool backends that support the managed agent layer
- deploy the user-facing agent experience through Google Cloud deployment surfaces rather than relying on a local-only orchestration model

In other words, Google Agent Builder is planned as the official orchestration and managed agent surface, while FastAPI services remain the supporting deterministic platform around it.

### What Lives In Google Agent Builder Versus Our Repo

VisualSprint is **not** a portal-only project and it is **not** an API-only project. It is a hybrid build.

What we will configure in Google Agent Builder:

- the main managed VisualSprint agent
- the subagent flow and orchestration logic
- Gemini model selection for each agent step
- instructions, guardrails, and output behavior
- managed tool connections
- agent preview, iteration, and deployment setup

What we will build in our own repository:

- the browser capture experience in `apps/web`
- the FastAPI control plane and tool endpoints in `services/api`
- future ingestion and media services in `services/ingest` and `services/media`
- Elastic indexing support and historical memory preparation
- state persistence, uploads, retries, and dashboard delivery
- domain contracts, report shaping, and product UI

This split matters because the hackathon requires a functional agent powered by Gemini and Google Cloud Agent Builder, but the product itself still needs real capture, storage, APIs, and frontend surfaces outside the portal.

### VisualSprint Agent Builder Setup Plan

The recommended implementation path for this project is:

1. **Create the Google Cloud environment**
   - Create or select the Google Cloud project.
   - Enable the Google services required for Gemini Enterprise and the managed agent workflow.
   - Set up billing or hackathon credits before building further.
2. **Create the Gemini Enterprise app**
   - Open Gemini Enterprise in Google Cloud.
   - Create the app that will host the VisualSprint managed agents.
   - Treat this app as the top-level agent container for the project.
3. **Open Agent Designer and use the flow builder**
   - Start in the low-code builder instead of a prompt-only draft.
   - Use the flow builder because VisualSprint needs a multi-step, multi-agent flow rather than a single conversational prompt.
4. **Create the main VisualSprint orchestrator agent**
   - Name the main agent and describe it as the meeting-intelligence coordinator.
   - Select the Gemini model for orchestration and reasoning.
   - Add detailed instructions about chunk-based meeting processing, structured outputs, and tool-calling rules.
5. **Add the specialist subagents**
   - Transcript Agent for transcript interpretation and speaker-aware reasoning.
   - Vision Agent for screen-evidence reasoning.
   - Reasoning Agent for decisions, commitments, blockers, and open questions.
   - Memory Agent for Elastic lookups before final outputs are finalized.
   - Summary Agent for final report generation after the meeting ends.
6. **Connect Elastic MCP**
   - Use the Elastic partner tooling so the Memory Agent can search historical meeting intelligence.
   - Scope queries to the current tenant or workspace boundary from the start.
   - Use memory retrieval before marking a blocker or commitment as new or resolved.
7. **Connect our custom tool endpoints**
   - Expose FastAPI endpoints for deterministic actions the managed agent should call.
   - Examples: register agent outputs, fetch meeting state, finalize reports, and request current chunk context.
   - Keep uploads, retries, persistence, and queue handling outside the agent itself.
8. **Test in Agent Designer Preview**
   - Validate whether the agent flow is choosing the correct tools.
   - Check that outputs are structured and stable enough for dashboard use.
   - Refine prompts and tool descriptions until the flow is predictable.
9. **Deploy and share the managed agent**
   - Create the agent in Gemini Enterprise once the draft flow is stable.
   - Share or register the agent inside the Gemini Enterprise app as needed for the final hackathon experience.
10. **Connect the managed agent to the product UI**
    - Keep the dashboard in our Next.js app.
    - Let the web app and backend drive meeting creation, live capture, and data display while the managed agent provides intelligence outputs.

### Agent Builder Implementation Steps For VisualSprint

When we start the actual managed-agent phase, the expected sequence inside Google Agent Builder is:

1. Open the Gemini Enterprise app.
2. Click `Create agent`.
3. Choose `Proceed to builder`.
4. Add the main agent node:
   - `Name`: `VisualSprint Orchestrator`
   - `Description`: coordinates meeting chunk reasoning and structured output generation
   - `Instructions`: explain chunk-by-chunk analysis, required JSON-like structured outputs, and tool-calling rules
5. Add subagents:
   - `Transcript Agent`
   - `Vision Agent`
   - `Reasoning Agent`
   - `Memory Agent`
   - `Summary Agent`
6. Add tools and data connections:
   - Elastic MCP tools for historical search
   - our backend endpoints for deterministic product actions
7. Preview the agent flow with sample meeting inputs.
8. Refine instructions until the outputs are reliable.
9. Create the agent and keep iterating as the product backend matures.

### Why We Are Not Building Only In The Portal

Using only the portal would leave major product responsibilities uncovered:

- browser media capture
- chunk upload handling
- durable database writes
- storage lifecycle management
- live dashboard transport
- product authentication and tenancy boundaries

So the portal is where we define and manage the **agent workflow**, while the repository is where we build the **actual software platform** around that workflow.

## Why We Chose The Elastic Track

Elastic is the selected partner track for this repository.

We chose Elastic because VisualSprint’s strongest differentiator is **cross-meeting memory**. Many meeting tools can summarize a single conversation. Very few can reliably tell a team that the same blocker was raised two sprints ago, the same action item was promised previously, or the same decision was reopened without closure.

That is where Elastic fits naturally:

- the Memory Agent can query prior decisions, blockers, and commitments across historical meetings
- meeting intelligence becomes searchable and reusable over time
- current meeting outputs gain institutional context instead of remaining isolated artifacts

This makes the product meaningfully different from transcript-first tools. Elastic is not a forced integration here; it is part of the product’s core value proposition.

The other current hackathon categories remain relevant reference options, but they are not the selected direction for this repo:

- Arize for evaluation and observability
- Fivetran for data movement and connected pipelines
- GitLab for secure DevSecOps and Duo Agent Platform workflows
- MongoDB for operational data and application persistence
- Dynatrace for runtime observability and production monitoring

Those are valid categories in the portal, but VisualSprint’s strongest fit is still Elastic because recurring meeting memory is central to the product itself.

## Production Architecture

VisualSprint is planned as a production-grade, event-driven system rather than a hackathon-only prototype architecture.

Primary platform choices:

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend services:** FastAPI and Python-based service boundaries
- **System of record:** Cloud SQL for PostgreSQL
- **Object storage:** Google Cloud Storage
- **Event processing:** Pub/Sub
- **Ephemeral live state:** Redis or Memorystore
- **Historical retrieval and memory:** Elastic
- **Agent runtime and orchestration:** Google Agent Builder with Gemini-centered workflows

Architecture principles:

- deterministic infrastructure for uploads, queues, state transitions, retries, and access control
- agentic intelligence for interpretation, synthesis, context matching, and report generation
- multi-tenant-ready domain boundaries from the beginning
- connector-based ingestion so future inputs can reuse the same processing pipeline

## Multi-Agent System Design

VisualSprint is designed as a hybrid platform. Agents own intelligence-heavy meeting workflows, while traditional services own reliability-critical infrastructure.

### Orchestrator Agent

The Orchestrator Agent manages per-meeting workflow execution. It coordinates chunk-level processing, dispatches work to specialist agents, aggregates outputs, and controls meeting-to-report lifecycle transitions.

### Transcript Agent

The Transcript Agent converts audio into timestamped transcript segments with speaker context. Its output feeds both the live dashboard and downstream reasoning stages.

### Vision Agent

The Vision Agent analyzes extracted screen frames and detects contextual evidence such as code editors, terminal output, diagrams, slides, errors, and UI states. It only contributes when visual context is present.

### Reasoning Agent

The Reasoning Agent is responsible for understanding what the meeting actually means. It combines transcript and screen evidence to identify decisions, commitments, blockers, and open questions, including temporal reasoning across multiple chunks.

### Memory Agent

The Memory Agent queries Elastic through MCP-compatible tooling to retrieve relevant historical context before current outputs are finalized. It checks whether similar blockers, unresolved decisions, or repeated commitments already exist in prior meetings.

### Summary Agent

The Summary Agent runs when the meeting closes. It composes the final structured report using all accumulated evidence, including transcript insights, visual context, reasoning results, and historical matches.

### Agent Boundary

The multi-agent system does **not** replace the entire application runtime.

Deterministic services remain responsible for:

- authentication and tenant boundaries
- signed upload flows
- media lifecycle management
- queueing and retry behavior
- state persistence
- API delivery and dashboard transport

Agents remain responsible for:

- interpreting meeting content
- combining audio and visual evidence
- retrieving historical context
- resolving ambiguity
- assembling structured intelligence outputs

## Data And Storage Architecture

The planned data model is multi-tenant-ready, even if the first implementation focuses on a simpler single-user flow.

Core entities:

- `Organization`
- `Workspace`
- `User`
- `Meeting`
- `MeetingParticipant`
- `CaptureSession`
- `SourceConnector`
- `MediaChunk`
- `TranscriptSegment`
- `ScreenEvent`
- `DecisionRecord`
- `CommitmentRecord`
- `BlockerRecord`
- `MemoryMatch`
- `FinalReport`

Storage responsibilities:

- **Cloud SQL PostgreSQL:** system-of-record entities, tenant boundaries, meeting state, structured outputs, reports
- **Google Cloud Storage:** raw media, extracted artifacts, thumbnails, derived assets
- **Redis or Memorystore:** transient live state, stream cursors, in-flight coordination
- **Elastic:** searchable historical intelligence, retrieval indexing, memory matching

Every historical lookup and memory query should be tenant-scoped so future organizations can share the same platform safely without cross-customer data leakage.

## Live Dashboard And Report Experience

The dashboard is the main live proof surface for the product.

Planned live dashboard sections:

- top meeting bar with meeting name, elapsed time, participant context, and end control
- live metrics row for decisions, commitments, blockers, and visual events
- decisions panel showing emerging decisions with evidence references
- commitments and blockers panel showing ownership and risk flags
- Elastic memory match strip highlighting recurring historical context
- live transcript feed with timestamps and linked visual moments

When the meeting ends, the interface transitions into a final report view that consolidates:

- decision log
- commitment list with owners
- blocker list
- open questions
- memory-linked historical conflicts or repeats
- evidence-backed reasoning context

## Connector Strategy

VisualSprint is being designed with connector-based ingestion rather than a single hard-coded input path.

Planned connector roadmap:

- `browser_live_capture` as the first connector
- `recording_upload` as a future connector
- `document_link` as a future connector

All connectors should normalize into the same downstream processing pipeline so transcript analysis, visual reasoning, memory lookup, and reporting do not need separate architectures for each input source.

## Planned Repository Architecture

This repository is intentionally scaffolded for a long-term service-oriented monorepo layout.

```text
apps/
  web/
services/
  api/
  ingest/
  media/
  agents/
packages/
  contracts/
  sdk/
infra/
docs/
```

Intended responsibilities:

- `apps/web` for the product UI and browser capture experience
- `services/api` for control-plane and delivery APIs
- `services/ingest` for capture intake and chunk lifecycle handling
- `services/media` for extraction and media transformation workflows
- `services/agents` for orchestration and specialist agent execution
- `packages/contracts` for shared schemas and event contracts
- `packages/sdk` for reusable client and service integrations
- `infra` for future infrastructure definitions and deployment assets
- `docs` for supplementary documentation as implementation grows

## Implementation Phases

This repo now contains early implementation work, and the intended delivery path remains:

1. **Foundation and infrastructure**
   - repo standards, architecture docs, cloud environment design, shared contracts
2. **Live capture and ingestion**
   - browser capture flow, chunk uploads, meeting session lifecycle
3. **Transcript and vision pipeline**
   - audio transcription, frame extraction, visual event classification
4. **Agent orchestration and memory**
   - orchestrator, reasoning, Elastic-backed history checks, final report assembly
5. **Dashboard and report experience**
   - live meeting UI, post-meeting report UI, evidence linking
6. **Hardening and expansion**
   - multi-tenant controls, observability, connector growth, enterprise readiness

## Managed Agent Delivery Steps

The build sequence for the remaining hackathon-aligned work is:

1. Finish deterministic ingestion boundaries
   - formal chunk state transitions
   - persisted chunk identifiers
   - upload-ready lifecycle contracts
2. Replace mock processing with real services
   - audio transcription pipeline
   - frame extraction pipeline
   - structured intermediate records
3. Stand up Elastic-backed historical memory
   - index past meeting outputs
   - define the retrieval contract the Memory Agent will use
4. Build the managed agent flow in Google Agent Builder
   - create the app
   - create the orchestrator and subagents
   - wire Elastic MCP and backend tools
5. Connect agent outputs back to the dashboard
   - live decisions
   - commitments
   - blockers
   - memory matches
   - final report view
6. Prepare the hackathon submission package
   - hosted demo
   - public repo
   - demo video
   - Elastic track selection
   - final Devpost entry

## Open Questions

- Should VisualSprint remain fully open-source under Apache-2.0, or should the public repo stay open while future proprietary production modules live in separate private repositories?

## Hackathon Submission Checklist

- Build a functional agent powered by Gemini and Google Cloud Agent Builder
- Integrate a partner MCP server
- Demonstrate reasoning, planning, and action beyond simple chat
- Choose one official partner category from the current portal tracks
- Select the Elastic partner track
- Use Google Cloud plus the products relevant to the chosen partner track
- Publish a public repository with a visible open-source license
- Host a working project URL for the demo
- Complete the Devpost submission fields
- Record and submit an approximately 3-minute demo video
- Finalize all required materials before **June 11, 2026 at 2:00 PM PDT**

Current portal note as of **June 7, 2026**:

- the public resources and project gallery pages show six partner categories: Arize, Elastic, Fivetran, GitLab, MongoDB, and Dynatrace
- the rules page excerpt still lists five named partner tracks in its submission section
- VisualSprint is intentionally documented and built for the **Elastic** track

## Official Sources

- [Google Cloud Rapid Agent Hackathon overview](https://rapid-agent.devpost.com/)
- [Google Cloud Rapid Agent Hackathon resources](https://rapid-agent.devpost.com/resources)
- [Google Cloud Rapid Agent Hackathon rules](https://rapid-agent.devpost.com/rules)
- [Hackathon partner update](https://rapid-agent.devpost.com/updates/43941-the-challenge-is-live-meet-your-partners)
- [Elastic track resources](https://rapid-agent.devpost.com/details/elastic-resources)
- [Google Agent Builder guide](https://cloud.google.com/products/agent-builder)
- [Building and managing extensions](https://cloud.google.com/vertex-ai/docs/generative-ai/extensions/overview)
- [Agent Runtime overview](https://cloud.google.com/vertex-ai/docs/generative-ai/reasoning-engine/overview)
- [AI Agents for Gemini Enterprise](https://cloud.google.com/gemini-enterprise/agents)
- [Gemini Enterprise agents overview](https://docs.cloud.google.com/gemini/enterprise/docs/agents-overview)
- [Elastic Agent Builder MCP server docs](https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server/)
