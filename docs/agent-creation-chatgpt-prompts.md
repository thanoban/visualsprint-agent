# ChatGPT Prompts For Agent Creation

This document gives paste-ready prompts you can use in ChatGPT while creating VisualSprint agents in Google Cloud Agent Platform Studio or Gemini Enterprise.

Use this together with:

- [Google Cloud Agent Builder plan](./google-cloud-agent-builder.md)
- [Elastic integration handoff](./elastic-integration-handoff.md)

## Why this file exists

If ChatGPT does not know the full VisualSprint context, it can suggest the wrong kind of agent.

These prompts force the right context:

- VisualSprint is a meeting-intelligence product
- the backend already assembles structured inputs
- the agent should not own browser capture or raw ingestion
- the reasoning agent should use Elastic memory through `search_prior_outcomes`
- the final implementation path is `ADK -> Vertex AI Agent Engine -> Gemini Enterprise`
- the platform may later include an approval-based action recommendation or escalation review layer

## How to use this file

1. Open ChatGPT in a separate tab.
2. Paste one full prompt from this file.
3. Ask ChatGPT to produce the exact text you need for the Google agent creation screen.
4. Copy the resulting agent name, description, instructions, and test cases into Google Cloud.
5. Compare the result against the repo contracts before accepting it.

## Recommended agent set

For the best production setup, create these first:

1. `VisualSprint Reasoning Agent`
2. `VisualSprint Summary Agent`

If performance and critical-case handling are the priority, add one more focused layer:

3. `Action Recommendation / Escalation Review` subflow or agent

This third layer is useful because it separates:

- signal extraction
- meeting summarization
- downstream action recommendation

That makes it easier to:

- surface high-value Jira or Slack suggestions
- rank urgency and confidence
- require human approval before sending anything externally

## Prompt 1. Create the reasoning agent

Paste this into ChatGPT when you are creating the main chunk reasoning agent.

```text
You are helping me design a production-grade Google Cloud agent for a project called VisualSprint.

I need you to act like a senior AI architect and produce the exact content I should use while creating the agent in Google Cloud Agent Platform Studio / Gemini Enterprise / Agent Designer.

This is not a generic chatbot. It is a structured meeting-intelligence agent inside a larger product.

Project context:

- Product name: VisualSprint
- Purpose: turn raw meeting activity into durable, structured team records
- Current architecture:
  - `services/api` is the deterministic control plane
  - `services/agents` is the adapter boundary to cloud agents
  - `apps/web` is the dashboard and browser capture UI
  - shared contracts exist already in the repo
- The production direction is:
  - build agents in ADK
  - deploy to Vertex AI Agent Engine
  - register them in Gemini Enterprise
- Cost is not the priority. Quality and correctness matter more than cost.

Important architectural rules:

1. The agent does not own browser capture.
2. The agent does not own transcript chunk lifecycle.
3. The agent does not own direct database writes.
4. The agent does not invent missing context.
5. The agent receives already-assembled business context from the backend.
6. The agent must return structured outputs only.
7. The agent should use historical memory retrieval before labeling a signal as recurring or reopened.

What already exists in the product:

- a web UI with browser capture and meeting surfaces
- a deterministic API layer
- a chunk insight pipeline
- a meeting summary packet pipeline
- a local agents adapter
- ADK scaffolding in the repo
- a mocked memory search route that will later be replaced by Elastic MCP

This agent is the main chunk reasoning agent.

Its role:

- consume a single assembled chunk insight payload
- inspect transcript context and screen evidence together
- compare the chunk against current meeting state
- detect durable outcomes
- avoid duplicates
- use historical memory retrieval when needed
- emit structured outputs that match the repo contract

The input contract is conceptually named:

- `ChunkInsight`

The output contract is conceptually named:

- `RegisterAgentOutputsRequest`

The current ADK-side model naming in the repo is:

- input model: `ChunkInsightRequest`
- output model: `ReasoningRunResponse`

The reasoning agent must produce these categories when justified:

- decisions
- commitments
- blockers
- open questions
- memory matches
- resolved decision ids
- resolved commitment ids
- resolved blocker ids
- resolved open question ids

The reasoning agent should preserve these product behaviors:

- read transcript and screen evidence together before deciding durability
- prefer update, resolve, or reopen over duplicate net-new creation when the issue already exists
- use historical retrieval before assigning recurring or reopened labels
- return schema-valid structured output only
- never invent evidence that is missing from the input

The memory tool the agent should use is:

- `search_prior_outcomes`

That tool is expected to:

- retrieve ranked historical candidates from Elastic
- help the agent decide relations such as:
  - `new`
  - `recurring`
  - `reopened`
  - `resolved_previously`

The tool does not make the final reasoning decision by itself.
The agent should make the final relation decision using:

- current chunk context
- current meeting state
- retrieved historical matches

Non-goals for this reasoning agent:

- do not summarize the whole meeting
- do not rewrite the entire transcript
- do not persist data directly unless the platform flow explicitly includes a persistence tool
- do not create soft or weak signals that are not durable

What I want you to produce:

1. A recommended agent display name
2. A short agent description for the Google UI
3. A strong system instruction block suitable for Google agent creation
4. A list of explicit rules and guardrails
5. A suggested tool section describing `search_prior_outcomes`
6. A suggested tool section describing `register_outputs`
7. Suggested starter evaluation scenarios
8. A quality-first model recommendation without caring about cost
9. A final "copy-paste version" formatted cleanly for direct use in the Google agent creation form

Output format requirements:

- Use clear headings
- Keep the instruction block highly specific
- Make the instructions production-oriented, not generic
- Make the tool usage guidance explicit
- Include a section called `Do not do these things`
- Include a section called `Evaluation scenarios`
- Assume the backend already assembled the input and the agent should not ask the user for missing meeting data

Also make sure your final instructions are aligned with this exact behavior summary:

- Turn assembled chunk context into durable structured outputs while avoiding duplicate or weak signals.
- Read transcript and screen evidence together before deciding whether a signal is durable.
- Prefer updates, resolutions, or reopen events over duplicate net-new records when the running state already contains the issue.
- Use historical retrieval before assigning recurring or reopened memory relations.
- Return schema-valid structured outputs only.
- Do not invent evidence that is not present in the supplied chunk context.
```

## Prompt 2. Create the summary agent

Paste this into ChatGPT when you are creating the end-of-meeting summary agent.

```text
You are helping me design a production-grade Google Cloud summary agent for a project called VisualSprint.

I need content I can use directly while creating the agent in Google Cloud Agent Platform Studio / Gemini Enterprise / Agent Designer.

This is not a generic meeting summarizer. It is a structured final-report agent inside a larger meeting-intelligence architecture.

Project context:

- Product name: VisualSprint
- The product converts meeting activity into structured records
- `services/api` is the deterministic control plane
- `services/agents` is the cloud-agent adapter boundary
- the final runtime direction is ADK -> Vertex AI Agent Engine -> Gemini Enterprise
- quality matters more than cost

Architecture rules:

1. The summary agent receives assembled structured meeting context.
2. It should not parse raw browser capture on its own.
3. It should not behave like a free-form assistant.
4. It should return a structured final report payload.
5. It should preserve unresolved risks instead of hiding them in prose.

This agent is the final meeting summary agent.

Its role:

- consume an already-assembled meeting summary packet
- generate a final structured report
- consolidate durable outcomes
- preserve blockers and open questions
- include memory-backed context only when it improves confidence, urgency, or prioritization

The input contract is conceptually named:

- `MeetingSummaryPacket`

The output contract is conceptually named:

- `FinalReport`

The current ADK-side model naming in the repo is:

- input model: `SummaryPacketRequest`
- output model: `FinalReportDraft`

The summary agent should preserve these product behaviors:

- summarize durable outcomes rather than replaying the whole conversation
- keep commitments explicit with owners and due hints when present
- preserve unresolved blockers and open questions
- use historical memory only when it materially changes the report
- return a schema-valid final report payload

Non-goals:

- do not act like a chat assistant
- do not create new facts not present in the packet
- do not hide uncertainty
- do not collapse blockers into a polished but misleading executive summary

The final report should clearly handle:

- executive summary
- decisions
- commitments
- blockers
- open questions
- memory highlights when useful

What I want you to produce:

1. A recommended agent display name
2. A short description for the Google UI
3. A strong system instruction block
4. Explicit guardrails
5. Suggested tool guidance for `finalize_report`
6. Suggested evaluation scenarios
7. A quality-first model recommendation
8. A final clean copy-paste version for the Google creation form

Output requirements:

- Use clear headings
- Keep the instructions specific and production-oriented
- Include a section called `Do not do these things`
- Include a section called `Evaluation scenarios`
- Make it obvious that the agent works from a structured packet, not from raw media

Also align your final instructions with this behavior summary:

- Turn the assembled meeting summary packet into a final structured report that preserves durable outcomes and unresolved risks.
- Summarize durable outcomes rather than replaying the full discussion.
- Keep commitments explicit with owners and due hints when present.
- Preserve unresolved blockers and open questions instead of hiding them in prose.
- Use historical memory only when it changes confidence, priority, or urgency.
- Return a schema-valid final report payload.
```

## Prompt 3. Ask ChatGPT to review what you are about to paste into Google

Use this after ChatGPT gives you a draft, or after you write your own instructions.

```text
Review the following Google Cloud agent definition for VisualSprint.

I need you to act as a strict production reviewer, not a creative writer.

Check whether the agent definition is aligned to this product architecture:

- VisualSprint is a meeting-intelligence platform
- `services/api` owns deterministic orchestration and persistence
- `services/agents` is the adapter boundary
- the agent receives structured backend-assembled input
- the reasoning agent should use `search_prior_outcomes` before assigning recurring or reopened memory relations
- the summary agent should preserve unresolved blockers and open questions
- the agent should return structured outputs only
- the agent should not invent missing evidence
- the production direction is ADK -> Vertex AI Agent Engine -> Gemini Enterprise

Please review the agent definition against these failure modes:

1. too generic
2. acts like a chatbot instead of a structured reasoning or summary agent
3. tries to own browser capture or raw ingestion
4. does not mention durable outcomes
5. does not mention duplicate avoidance
6. does not mention memory retrieval
7. is too prose-heavy and not schema-oriented
8. could produce hallucinated evidence
9. hides blockers or uncertainty

Return:

- a verdict: `good`, `needs changes`, or `wrong direction`
- the top problems in priority order
- a corrected version
- a final paste-ready version for Google Cloud
```

## Prompt 4. Create the action recommendation or escalation review subflow

Use this if you want one more high-value layer beyond reasoning and summary.

```text
You are helping me design a production-grade Google Cloud action recommendation and escalation review agent or subflow for a project called VisualSprint.

This is not the main reasoning agent and not the final summary agent.

Its purpose is to improve performance in critical situations by taking already-structured outputs and deciding what should be surfaced to the product portal for approval-based downstream action.

Project context:

- Product name: VisualSprint
- The platform converts meeting activity into structured outputs
- `services/api` owns deterministic orchestration, persistence, and external action endpoints
- `services/agents` is the cloud-agent adapter boundary
- the production direction is ADK -> Vertex AI Agent Engine -> Gemini Enterprise
- quality and performance matter more than cost

Important architectural rules:

1. This layer does not read raw browser capture.
2. This layer does not re-parse the full transcript as its main job.
3. This layer works from outputs already produced by earlier reasoning or summary stages.
4. This layer does not directly send Jira or Slack messages without human approval.
5. This layer should recommend, rank, explain, and gate actions.

Business need:

- if many important items are found during a meeting, the portal should show suggestions
- users can approve or reject those suggestions
- only approved items should be sent to Jira or Slack

This action recommendation layer should help identify:

- which blockers deserve escalation
- which commitments should become Jira candidates
- which decisions or updates should become Slack summary candidates
- which items are too uncertain and should stay in manual review

Suggested output categories:

- `suggest_for_jira`
- `suggest_for_slack`
- `suggest_for_escalation`
- `suggest_for_manual_review`

Each suggestion should ideally include:

- record id
- record type
- short title
- rationale
- urgency
- confidence
- recommended channel
- whether approval is required

This layer should optimize for:

- high precision on important downstream actions
- safe behavior in critical situations
- clear ranking and justification
- easy portal review by a human

Non-goals:

- do not create weak noisy suggestions
- do not duplicate all meeting records into action suggestions
- do not act like a general assistant
- do not send anything externally on your own
- do not replace the reasoning or summary agents

What I want you to produce:

1. A recommended agent or subflow name
2. A short description for the Google UI
3. A strong instruction block
4. Explicit guardrails
5. A recommended structured output shape
6. Suggested evaluation scenarios
7. A quality-first model recommendation
8. A final paste-ready Google Cloud version

Output requirements:

- Use clear headings
- Keep it production-oriented
- Make approval-based action gating explicit
- Include a section called `Do not do these things`
- Include a section called `Evaluation scenarios`
- Make it clear that this layer consumes structured outputs from earlier stages
```

## Prompt 5. Ask ChatGPT to produce a very short Google UI version

Use this when the Google UI field is short and you need a compressed version.

```text
Compress the following VisualSprint agent instructions into a short Google Cloud agent configuration version.

Requirements:

- keep the core architecture constraints
- preserve the most important guardrails
- keep memory retrieval behavior
- keep structured-output behavior
- do not turn it into a generic assistant prompt

Return:

1. short description
2. compact instructions
3. compact do-not-do list
4. compact evaluation checklist
```

## Recommended usage

If you are building the main production flow, use the prompts in this order:

1. use `Prompt 1` for the reasoning agent
2. use `Prompt 2` for the summary agent
3. optionally use `Prompt 4` for action recommendation or escalation review
4. use `Prompt 3` to review the draft before pasting into Google
5. use `Prompt 5` only if the Google UI field is too small

## What good output should look like

A good ChatGPT response should:

- clearly say the agent is not a generic chatbot
- mention structured input and structured output
- mention durability of signals
- mention duplicate avoidance
- mention memory retrieval through `search_prior_outcomes`
- preserve blockers and open questions
- keep Jira or Slack sending behind human approval
- avoid inventing missing evidence
- align with `services/api` and `services/agents` boundaries

If ChatGPT gives you something generic like:

- "help users understand meetings"
- "be a helpful assistant"
- "summarize discussions naturally"

that is the wrong direction for this project.
