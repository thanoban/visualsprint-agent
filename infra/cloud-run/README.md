# VisualSprint Cloud Run Deployment

This folder contains the final deployment shape for the VisualSprint control plane and agents adapter.

## Services

- `visualsprint-agents`
  - Runs the FastAPI adapter in `services/agents`
  - Calls the deployed Agent Runtime reasoning, summary, and action agents in `us-west1`
  - Accepts backend-injected `memoryMatches`
  - Can also call Elastic MCP directly when the runtime secret is present

- `visualsprint-api`
  - Runs the deterministic control plane in `services/api`
  - Searches Elasticsearch before chunk-reasoning calls
  - Injects `memoryMatches` into `ChunkInsight`
  - Writes indexed outcomes back to `visualsprint-meeting-events`

## Images

- `us-west1-docker.pkg.dev/visualsprint-agent/visualsprint/agents:latest`
- `us-west1-docker.pkg.dev/visualsprint-agent/visualsprint/api:latest`

## Runtime values captured for this project

- Project ID: `visualsprint-agent`
- Project number: `530780341550`
- Region: `us-west1`
- Reasoning Agent Runtime: `projects/530780341550/locations/us-west1/reasoningEngines/554162656492126208`
- Summary Agent Runtime: `projects/530780341550/locations/us-west1/reasoningEngines/6620511354560184320`
- Action Agent Runtime: `projects/530780341550/locations/us-west1/reasoningEngines/7293799498852073472`
- Elasticsearch URL: `https://my-elasticsearch-project-ad6723.es.us-central1.gcp.elastic.cloud`
- Elastic MCP URL: `https://my-elasticsearch-project-ad6723.kb.us-central1.gcp.elastic.cloud/api/agent_builder/mcp`
- Outcomes index: `visualsprint-meeting-events`

## Secrets expected

- `ELASTICSEARCH_API_KEY`
- `elastic-mcp-server`

## Deploy

Run:

```powershell
pwsh ./infra/cloud-run/deploy-visualsprint.ps1
```

The script:

1. builds both containers
2. pushes them to Artifact Registry
3. deploys `visualsprint-agents`
4. reads the live agents URL from Cloud Run
5. deploys `visualsprint-api` with the correct `VISUALSPRINT_AGENTS_SERVICE_URL`
