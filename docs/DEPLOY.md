# VisualSprint Deployment Runbook

End-to-end steps to take VisualSprint live on the Elastic track. Companion docs:
[Agent Builder plan](./google-cloud-agent-builder.md),
[Elastic handoff](./elastic-integration-handoff.md),
[Action agent setup](./ACTION_AGENT_SETUP.md), [fixes log](./fixes.md).

> **Secrets:** never commit API keys. `.env` is gitignored; commit only
> `.env.example`. In Cloud Run, keys are injected from Secret Manager via
> `--set-secrets` (see `deploy.sh`). Rotate any key shared in plaintext.

**Live topology:** project `visualsprint-agent` (`530780341550`); the agents +
Cloud Run services run in **us-west1**; the Elasticsearch project is in
**us-central1** (different region is fine).

## 0. Prerequisites
```bash
gcloud auth login
gcloud config set project visualsprint-agent
gcloud services enable run.googleapis.com aiplatform.googleapis.com \
  secretmanager.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 1. Elastic: API key + outcomes index (us-central1)
Use the **encoded** key value wherever a key is needed.
```bash
ES_URL=https://my-elasticsearch-project-ad6723.es.us-central1.gcp.elastic.cloud
curl -X PUT "$ES_URL/visualsprint-outcomes" -H "Authorization: ApiKey ENCODED_BACKEND_KEY" \
  -H 'Content-Type: application/json' -d '{
  "mappings": { "properties": {
    "id":{"type":"keyword"}, "tenant_id":{"type":"keyword"},
    "meeting_id":{"type":"keyword"}, "meeting_title":{"type":"text"},
    "record_type":{"type":"keyword"}, "status":{"type":"keyword"},
    "summary":{"type":"text","copy_to":"semantic_text"},
    "detail":{"type":"text","copy_to":"semantic_text"},
    "owner_label":{"type":"keyword"}, "speaker_label":{"type":"keyword"},
    "due_hint":{"type":"keyword"}, "severity":{"type":"keyword"},
    "first_seen_chunk_id":{"type":"keyword"}, "last_updated_chunk_id":{"type":"keyword"},
    "created_at":{"type":"date"}, "updated_at":{"type":"date"},
    "evidence":{"type":"object","enabled":false},
    "semantic_text":{"type":"semantic_text"}
  }}
}'
```
(If ELSER/`semantic_text` isn't available, drop that field + the `copy_to`s — the
API's keyword search still works.)

## 2. Elastic Agent Builder MCP + `search_prior_outcomes`
In Kibana → Agent Builder: note the MCP endpoint
(`.../api/agent_builder/mcp`) and define `search_prior_outcomes`
(inputs `recordType, summary, detail, tenantId, meetingId`; hybrid query over
`visualsprint-outcomes`).

## 3. Connect MCP inside the Google reasoning agent
In the reasoning agent (us-west1) → Tools → add the Elastic MCP connection →
register `search_prior_outcomes` → test a blocker input returns a memory match.

## 4. Secret Manager + service accounts
```bash
printf '%s' 'ENCODED_BACKEND_KEY' | gcloud secrets create elastic-backend-key --data-file=-
printf '%s' 'ENCODED_MCP_KEY'     | gcloud secrets create elastic-mcp-key     --data-file=-
<<<<<<< HEAD
# optional (action executors are stubs today, but deploy.sh can inject them):
# printf '%s' 'JIRA_TOKEN'  | gcloud secrets create jira-api-token --data-file=-
# printf '%s' 'SLACK_TOKEN' | gcloud secrets create SLACK_BOT_TOKEN_SECRET --data-file=-
=======
# optional (action executors are stubs today):
# printf '%s' 'JIRA_TOKEN'  | gcloud secrets create jira-api-token --data-file=-
# printf '%s' 'SLACK_TOKEN' | gcloud secrets create slack-bot-token --data-file=-
>>>>>>> b63d2fcfef65d93c31e92538c565aaf431bc9c2c

gcloud iam service-accounts create visualsprint-agents
SA_AG=visualsprint-agents@visualsprint-agent.iam.gserviceaccount.com
gcloud secrets add-iam-policy-binding elastic-mcp-key     --member="serviceAccount:$SA_AG" --role=roles/secretmanager.secretAccessor
gcloud projects add-iam-policy-binding visualsprint-agent --member="serviceAccount:$SA_AG" --role=roles/aiplatform.user
# (repeat secretAccessor on elastic-backend-key for the api service identity)
```

## 5. Configure repo env
```bash
cp .env.example .env
# Fill: the two encoded keys, VISUALSPRINT_AGENT_APPLICATION_ID. The agent ids,
# resource names, query URLs, project, region, and index are pre-filled.
```

## 6. Validate locally (optional)
```powershell
$env:ELASTICSEARCH_URL="https://my-elasticsearch-project-ad6723.es.us-central1.gcp.elastic.cloud"
$env:ELASTICSEARCH_API_KEY="ENCODED_BACKEND_KEY"
$env:ELASTIC_INDEX_OUTCOMES="visualsprint-outcomes"
npm run dev:api
# register outputs on a meeting, then:
#   POST /api/meetings/{id}/memory/search-prior-outcomes  -> expect a real Elastic hit
```

## 7. Deploy to Cloud Run
```bash
bash deploy.sh
```
`deploy.sh` deploys the api, then the agents (with `VISUALSPRINT_CONTROL_PLANE_URL`
<<<<<<< HEAD
= the api URL), then points the api at the agents URL. If `SLACK_TOKEN_SECRET`
or `JIRA_TOKEN_SECRET` are set in `.env`, those secrets are also injected into
the API service with Cloud Run `--set-secrets`. Region comes from `REGION` in
`.env` (us-west1).
=======
= the api URL), then points the api at the agents URL — keys injected from Secret
Manager. Region comes from `REGION` in `.env` (us-west1).

## 7.5 Redeploy the Vertex ADK agents from the correct entrypoints
The live fallback issue we verified on June 9, 2026 came from deploying the
Reasoning Engine resources against the wrong Python entrypoint. Do not point
Agent Engine at the FastAPI service module
`visualsprint_agents.main:app`.

Use the ADK app entrypoints instead:

- reasoning: `services/agents/adk_apps/visualsprint_reasoning_agent/agent.py`
- summary: `services/agents/adk_apps/visualsprint_summary_agent/agent.py`
- action: `services/agents/adk_apps/visualsprint_action_agent/agent.py`

The deployed object should be the ADK root agent exported from each app, not the
Cloud Run HTTP app.

Also make sure the Agent Engine deployment receives the runtime settings needed
by the tools:

- `VISUALSPRINT_CONTROL_PLANE_URL`
- `VISUALSPRINT_MCP_ENDPOINT`
- `VISUALSPRINT_ELASTIC_API_KEY`

If these are missing, the agents can exist in Vertex but still fail internally
or fall back in the Cloud Run adapter.
>>>>>>> b63d2fcfef65d93c31e92538c565aaf431bc9c2c

## 8. Validate the seam
```bash
AG=$(gcloud run services describe visualsprint-agents --region us-west1 --format='value(status.url)')
API=$(gcloud run services describe visualsprint-api   --region us-west1 --format='value(status.url)')
curl "$AG/api/health"                                  # health_note not "mock"
curl "$API/api/meta"                                    # agents reachable=true, mode=remote
curl -X POST "$API/api/meetings/MEETING_ID/agents/smoke?clientChunkId=CHUNK_ID"
curl "$API/api/meta/agents/invocations"                 # executionMode vertex_ai, status success
```

## 9. Prove the recurring-memory loop
Register a blocker in one meeting (→ Elastic), then a similar blocker in another →
`search_prior_outcomes` returns it with relation `recurring`.

## Env cheat-sheet (which key goes where)
| Need | Service | Env var | Source |
| --- | --- | --- | --- |
| Elastic write-back/search key | api | `ELASTICSEARCH_API_KEY` (used directly as `ApiKey`) | secret `elastic-backend-key` |
| Elastic MCP key | agents | `VISUALSPRINT_ELASTIC_API_KEY` (used directly as `ApiKey`) | secret `elastic-mcp-key` |
<<<<<<< HEAD
| Slack bot token | api | `SLACK_BOT_TOKEN_SECRET` | secret `SLACK_BOT_TOKEN_SECRET` |
=======
>>>>>>> b63d2fcfef65d93c31e92538c565aaf431bc9c2c
| MCP endpoint | agents | `VISUALSPRINT_ELASTIC_MCP_ENDPOINT` | Kibana `/api/agent_builder/mcp` |
| Control plane for ADK persistence | agents | `VISUALSPRINT_CONTROL_PLANE_URL` | deployed api URL (set by deploy.sh) |
| Agents service for control plane | api | `VISUALSPRINT_AGENTS_SERVICE_URL` | deployed agents URL (set by deploy.sh) |
| Agent model overrides | agents | `VISUALSPRINT_{REASONING,SUMMARY,ACTION}_MODEL` | default `gemini-flash-latest` |
