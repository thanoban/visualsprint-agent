# VisualSprint — Remaining Tasks (Launch Checklist)

A living checklist of what's left to take VisualSprint from "code complete" to a
live, submitted hackathon entry. Command details live in
[DEPLOY.md](./DEPLOY.md); known issues in [fixes.md](./fixes.md); Elastic setup
in [elastic-integration-handoff.md](./elastic-integration-handoff.md).

**Live topology:** project `visualsprint-agent` (`530780341550`); agents + Cloud
Run in **us-west1**; Elasticsearch project in **us-central1**.

---

## ✅ Already done

### Core architecture
- [x] Multi-service architecture: `services/api` (control plane), `services/agents`
      (reasoning + summary + action), `services/ingest`, `services/media`.
- [x] FastAPI control plane with full meeting lifecycle, SSE stream, capture session
      routes, chunk lifecycle state machine.
- [x] In-memory repository with capture chunk, transcript, screen-event, and
      reasoning record storage; `recentCaptureChunks` / `recentDecisions` etc.
      capped and served to the UI.
- [x] `npm run verify` green (45 tests).

### Capture (browser layer)
- [x] `getDisplayMedia` + `getUserMedia` capture in `apps/web/src/lib/capture.ts`.
- [x] `MediaRecorder` at 4s intervals; per-chunk register → upload-complete →
      reasoning-run flow in `use-browser-capture.ts`.
- [x] Capture phase state machine (`idle / requesting / recording / stopping`).
- [x] `StartCaptureSessionRequest` carries `hasDisplayVideo / hasDisplayAudio /
      hasMicrophoneAudio`; `CaptureSessionSummary` stored on meeting.
- [x] Capture readiness pre-flight checks in the setup UI.

### Agents + AI
- [x] ADK reasoning, summary, and action agent scaffolds with deployed app entrypoints
      under `services/agents/adk_apps/`.
- [x] Flag-gated cloud adapter: `VISUALSPRINT_AGENT_MODE=configured_cloud` +
      `vertex_ai_reasoning_engine` or `bridge` backend.
- [x] ADK persistence tools (`register_outputs`, `finalize_report`) wired to control
      plane; env-configurable Gemini model ids.
- [x] `ChunkInsight` assembler builds structured focus areas, attention flags, and
      memory queries from chunk context.
- [x] Deterministic template fallback for all three agents so local dev works
      without GCP.

### Elastic
- [x] Elastic write-back + search in `services/api`; `_sync_indexed_outcomes_to_elastic`
      on every reasoning record upsert.
- [x] Elastic MCP client in `services/agents` with `search_prior_outcomes` tool.
- [x] Elastic portal: outcomes index, ELSER semantic field, `search_prior_outcomes`
      tool, MCP endpoint, API keys.

### Action review + UI
- [x] Action agent (4th agent) — Jira + Slack recommendation scaffold in agents service.
- [x] Full approval portal in the web UI: generate / approve / reject / execute flow.
- [x] Action executor stubs for Jira and Slack in `services/api`.

### Deployment
- [x] Deploy assets: `.env.example`, `services/api/Dockerfile`,
      `services/agents/Dockerfile`, `deploy.sh`, `infra/cloud-run/*.yaml`, `DEPLOY.md`.

### Frontend (production UI)
- [x] Full feature-based Next.js architecture (landing, meetings list, setup, live
      session, hero report, actions portal, dev tools).
- [x] Evidence Ink / Parchment dual theme; SSE live region; toast feedback; mobile
      tabs; error boundaries; route-level loading skeletons.
- [x] Report evidence linking: clicking a decision/blocker highlights linked
      transcript and screen events.
- [x] Dev tools panel (`/dev`): chunk insight, summary packet, indexed outcomes
      preview, agent smoke, audit.

---

## ⬜ Remaining — real capture pipeline
> Full plan in [REAL_CAPTURE_PIPELINE.md](./REAL_CAPTURE_PIPELINE.md).

These items turn the deterministic-template capture flow into a real media pipeline.
They are independent of the operational steps below and can be done in parallel.

- [ ] **Phase 0 — Storage config:** provision GCS bucket `visualsprint-capture-media`
      with CORS for `PUT`; add `GCS_BUCKET`, `GOOGLE_CLOUD_PROJECT` settings to
      `services/ingest/config.py` and `services/media/config.py`; add
      `google-cloud-storage`, `google-cloud-speech` to ingest deps and
      `google-cloud-storage`, `google-genai`, `ffmpeg` to media deps.
- [ ] **Phase 1 — Real upload:** generate real GCS v4 signed PUT URLs in
      `services/ingest/uploads.py`; frontend `use-browser-capture.ts` PUTs the
      real `.webm` Blob to `uploadTarget.signedUrl` before calling
      `upload-complete`; add `displaySurface` detection + audio-coverage warning
      for window shares.
- [ ] **Phase 2 — Real transcription:** pass `storageObjectPath` to ingest;
      replace `build_transcript_segments` with GCS download + Google Speech-to-Text
      (with speaker diarization); keep template as fallback.
- [ ] **Phase 3 — Real vision:** pass `storageObjectPath` to media; replace
      `build_screen_events` with ffmpeg frame sampling + Gemini multimodal
      classification of `ScreenEventKind` / `summary`; keep template as fallback.
- [ ] **Phase 4 — Real reasoning (config only):** deploy ADK agents to Vertex
      Agent Engine; set `VISUALSPRINT_AGENT_MODE=configured_cloud` +
      `VISUALSPRINT_AGENT_RUNTIME_BACKEND=vertex_ai_reasoning_engine` + engine
      resource names; fix action-audit agent-id copy-paste bug in `action.py`.
- [ ] **Phase 5 — Ingest + media Cloud Run:** add Dockerfiles and Cloud Run
      manifests for ingest and media; wire `VISUALSPRINT_INGEST_SERVICE_URL` /
      `VISUALSPRINT_MEDIA_SERVICE_URL`; grant service accounts GCS + Speech +
      Vertex IAM.

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
- [ ] **Jira/Slack action executors** — confirm whether they're real or stubs; set
      `JIRA_*` / `SLACK_*` secrets if the demo includes the action agent.
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
