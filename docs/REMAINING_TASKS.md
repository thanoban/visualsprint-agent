# VisualSprint — Remaining Tasks (Launch Checklist)

A living checklist of what is still left to take VisualSprint from "working repo" to a
fully launchable hackathon submission. Command details live in
[DEPLOY.md](./DEPLOY.md); known issues live in [fixes.md](./fixes.md); Elastic setup
is isolated in [elastic-integration-handoff.md](./elastic-integration-handoff.md).

**Live topology:** project `visualsprint-agent` (`530780341550`); Cloud Run and
agents run in **us-west1**; Elasticsearch project is in **us-central1**.

---

## ✅ Already done

### Core architecture
- [x] Multi-service architecture: `services/api` (control plane), `services/agents`
      (reasoning + summary + action), `services/ingest`, `services/media`.
- [x] FastAPI control plane with full meeting lifecycle, SSE stream, capture session
      routes, and chunk lifecycle state machine.
- [x] In-memory repository with capture chunk, transcript, screen-event, and
      reasoning record storage.
- [x] `npm run verify` green on the current repo snapshot.

### Capture and UI
- [x] Capture UI and browser-capture plumbing in `apps/web`.
- [x] Full feature-based Next.js architecture for landing, meetings list, setup,
      live session, report view, actions portal, and dev tools.
- [x] Evidence linking in the report UI.

### Agents and AI
- [x] ADK reasoning, summary, and action agent scaffolds with deployable app entrypoints.
- [x] Flag-gated cloud adapter: `VISUALSPRINT_AGENT_MODE=configured_cloud` plus
      `vertex_ai_reasoning_engine` or `bridge` runtime backend.
- [x] ADK persistence tools (`register_outputs`, `finalize_report`) wired to the control plane.
- [x] Deterministic template fallback for local development.

### Elastic and action review
- [x] Elastic write-back and search in `services/api`.
- [x] Elastic MCP client in `services/agents` with `search_prior_outcomes`.
- [x] Action review flow with Jira/Slack recommendation scaffolding and approval portal.

### Deployment
- [x] Dockerfiles, Cloud Run manifests, `.env.example`, `deploy.sh`, and deployment docs.

---

## ⬜ Remaining — real capture pipeline

> Full plan in [REAL_CAPTURE_PIPELINE.md](./REAL_CAPTURE_PIPELINE.md).

These items turn the deterministic-template capture flow into a real media pipeline.
They are independent of the operational steps below and can be worked in parallel.

- [ ] **Phase 0 — Storage config:** provision GCS bucket `visualsprint-capture-media`
      with CORS for `PUT`; add `GCS_BUCKET` and `GOOGLE_CLOUD_PROJECT` settings to
      `services/ingest/config.py` and `services/media/config.py`; add
      `google-cloud-storage` and `google-cloud-speech` to ingest deps and
      `google-cloud-storage`, `google-genai`, and `ffmpeg` to media deps.
- [ ] **Phase 1 — Real upload:** generate real GCS v4 signed PUT URLs in
      `services/ingest/uploads.py`; frontend `use-browser-capture.ts` uploads the
      real `.webm` Blob to `uploadTarget.signedUrl` before calling
      `upload-complete`; add `displaySurface` detection and an audio-coverage warning
      for window shares.
- [ ] **Phase 2 — Real transcription:** pass `storageObjectPath` to ingest; replace
      `build_transcript_segments` with GCS download plus Google Speech-to-Text
      (with speaker diarization); keep the template as fallback.
- [ ] **Phase 3 — Real vision:** pass `storageObjectPath` to media; replace
      `build_screen_events` with ffmpeg frame sampling plus Gemini multimodal
      classification of `ScreenEventKind` and `summary`; keep the template as fallback.
- [ ] **Phase 4 — Real reasoning (config only):** deploy ADK agents to Vertex
      Agent Engine; set `VISUALSPRINT_AGENT_MODE=configured_cloud` plus
      `VISUALSPRINT_AGENT_RUNTIME_BACKEND=vertex_ai_reasoning_engine` and the engine
      resource names; verify the action-audit agent-id copy-paste path.
- [ ] **Phase 5 — Ingest + media Cloud Run:** add Dockerfiles and Cloud Run
      manifests for ingest and media; wire `VISUALSPRINT_INGEST_SERVICE_URL` and
      `VISUALSPRINT_MEDIA_SERVICE_URL`; grant service accounts GCS, Speech, and Vertex IAM.

---

## ⬜ Remaining — operational (do in order)

> Full commands in [DEPLOY.md](./DEPLOY.md).

1. [ ] **Validate Elastic locally** — run `npm run dev:api` with
   `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY` (encoded), and
   `ELASTIC_INDEX_OUTCOMES`; register outputs, then call
   `POST /api/meetings/{id}/memory/search-prior-outcomes` and confirm a real Elastic
   hit instead of the local fallback.
2. [ ] **Connect the Elastic MCP tool inside the Google reasoning agent**
   (us-west1): add the MCP connection, register `search_prior_outcomes`, and test a
   blocker input.
3. [ ] **GCP secrets and service accounts:** create secrets `elastic-backend-key`
   and `elastic-mcp-key`; create service accounts; grant
   `secretmanager.secretAccessor` and `roles/aiplatform.user`.
4. [ ] **Fill `.env`** with the encoded backend and MCP keys plus
   `VISUALSPRINT_AGENT_APPLICATION_ID`. The agent ids, resource names, query URLs,
   project, region, and index should already be pre-filled.
5. [ ] **Deploy** with `bash deploy.sh` (deploy api -> agents with the control-plane
   URL -> point api at agents; keys injected from Secret Manager).
6. [ ] **Validate the seam** — `/api/health` should not say "mock", `/api/meta`
   should show agents reachable, `POST /api/meetings/{id}/agents/smoke` should
   succeed, and `/api/meta/agents/invocations` should show `vertex_ai` execution.
7. [ ] **Prove the recurring-memory demo** — register a blocker in one meeting,
   then a similar one in another, and verify `search_prior_outcomes` returns it as
   `recurring`.

---

## ⬜ Remaining — code follow-ups (optional polish; see fixes.md)

- [ ] **Tenant scoping** — currently hard-coded `"default"` in the Elastic layer;
      thread a real tenant id when multi-tenant support is needed.
- [ ] **Pick one agent runtime path as primary** (`vertex_ai_reasoning_engine`) and
      clearly label `bridge` as the optional fallback.
- [ ] **Jira/Slack action executors** — confirm whether they are real or stubs and
      set `JIRA_*` / `SLACK_*` secrets if the demo includes the action agent.
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

**Recommended next action:** do operational step **#1 (validate Elastic locally)**.
It’s quick and confirms the Elastic portal setup is wired correctly before any cloud deploy.
