# VisualSprint — Remaining Tasks (Launch Checklist)

A living checklist of what's left to take VisualSprint from "code complete" to a
live, submitted hackathon entry. Command details live in
[DEPLOY.md](./DEPLOY.md); known issues in [fixes.md](./fixes.md); Elastic setup
in [elastic-integration-handoff.md](./elastic-integration-handoff.md).

**Live topology:** project `visualsprint-agent` (`530780341550`); agents + Cloud
Run in **us-west1**; Elasticsearch project in **us-central1**.

---

## ✅ Already done
- [x] Multi-service architecture: `services/api` (control plane), `services/agents`
      (reasoning + summary + action), `services/ingest`, `services/media`.
- [x] Elastic write-back + search in `services/api`; Elastic MCP client in `services/agents`.
- [x] ADK agents + deployable apps; flag-gated cloud adapter (mock → bridge / vertex).
- [x] Deploy assets: `.env.example`, `services/*/Dockerfile`, `deploy.sh`,
      `infra/cloud-run/*.yaml`, `DEPLOY.md`.
- [x] ADK persistence tools wired to the control plane; env-configurable models.
- [x] `npm run verify` green (45 tests).
- [x] Elastic portal: outcomes index, semantic field, `search_prior_outcomes` tool,
      MCP endpoint, API keys.
- [x] Action Agent + approval portal: Jira/Slack integration with real REST API calls
      (creates issues in `SCRUM` project, posts to `#general-visualsprint-agent`).

---

## ⬜ Remaining — operational (do in order)
> Full commands in [DEPLOY.md](./DEPLOY.md).

1. [ ] **Validate Elastic locally** — `npm run dev:api` with `ELASTICSEARCH_URL` +
       `ELASTICSEARCH_API_KEY` (encoded) + `ELASTIC_INDEX_OUTCOMES`; register outputs,
       then `POST /api/meetings/{id}/memory/search-prior-outcomes` → expect a **real
       Elastic hit** (not the local fallback).
2. [ ] **Connect the Elastic MCP tool inside the Google reasoning agent** (us-west1):
       add the MCP connection → register `search_prior_outcomes` → test a blocker input.
3. [ ] **GCP secrets + service accounts**: create secrets `elastic-backend-key` and
       `elastic-mcp-key`; create service accounts; grant `secretmanager.secretAccessor`
       and `roles/aiplatform.user`.
4. [ ] **Fill `.env`** — the encoded backend + MCP keys and
       `VISUALSPRINT_AGENT_APPLICATION_ID` (agent ids / resource names / query URLs /
       project / region / index are pre-filled).
5. [ ] **Deploy** — `bash deploy.sh` (deploys api → agents with the control-plane URL →
       points api at agents; keys injected from Secret Manager; region us-west1).
6. [ ] **Validate the seam** — `/api/health` (not "mock"), `/api/meta` (agents
       reachable), `POST /api/meetings/{id}/agents/smoke` (source = `downstream_service`),
       `/api/meta/agents/invocations` (executionMode `vertex_ai`, status `success`).
7. [ ] **Prove the recurring-memory demo** — register a blocker in one meeting, then a
       similar one in another → `search_prior_outcomes` returns it as `recurring`.

---

## ⬜ Remaining — code follow-ups (optional polish; see fixes.md)
- [ ] **Tenant scoping** — currently hard-coded `"default"` in the Elastic layer;
      thread a real tenant id when multi-tenant is needed.
- [ ] **Pick one agent runtime path as primary** (`vertex_ai_reasoning_engine`) and
      clearly label `bridge` as the optional fallback.
- [x] **Jira/Slack action executors** — confirmed real (not stubs); tested live:
      creates Jira issues (SCRUM-5, SCRUM-6) and posts Slack messages. Secrets set
      in `.env` and documented in `ACTION_AGENT_SETUP.md`.
- [ ] **Optional:** rename `agent-creation-chatgpt-prompts.md` to a provider-neutral title.

---

## ⬜ Submission (mandatory hackathon items)
- [ ] Functional agent powered by **Gemini + Google Cloud Agent Builder** (deployed).
- [ ] **Elastic MCP** integration live (reasoning agent calls `search_prior_outcomes`).
- [ ] Google Cloud used exclusively; only Google Cloud AI + Elastic built-in AI.
- [ ] Runs on the **web** platform.
- [x] Public repo under an OSI-approved license (Apache-2.0).
- [ ] **Hosted project URL** (Cloud Run).
- [ ] **Demo video** ≤ 3 min (public, English/subtitled, shows it functioning).
- [ ] **Devpost form** complete; team ≤ 4.
- [ ] Submit **before June 11, 2026, 2:00 PM PDT**.

---

**Recommended next action:** do operational step **#1 (validate Elastic locally)** —
it's ~5 minutes and confirms the Elastic portal setup is wired correctly before any
cloud deploy.
