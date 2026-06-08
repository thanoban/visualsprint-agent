# VisualSprint Action Agent — Setup Guide

This document covers everything needed to run the Action Agent, Jira/Slack integration, and approval portal end-to-end.

---

## What was added

- **Action Agent** (4th agent): generates structured Jira and Slack recommendations from the final report
- **Approval portal**: dashboard panel to review, approve, reject, and execute recommendations
- **Execution stubs**: Jira and Slack clients that log locally and can be wired to real APIs in production
- **Backend routes**: `POST/GET /api/meetings/{id}/actions/recommendations`, `POST /approve`, `POST /reject`, `POST /execute`
- **Cloud Run YAML** for the API service plus updated agents YAML

---

## Required credentials and environment variables

### Google Cloud

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID` | GCP project ID | Google Cloud Console |
| `VISUALSPRINT_GOOGLE_CLOUD_LOCATION` | Deployment region | Example: `us-west1` |
| `VISUALSPRINT_AGENT_APPLICATION_ID` | Gemini Enterprise app ID | After creating the app in Agent Builder |
| `VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME` | Vertex AI Reasoning Engine resource | After deploying the Reasoning Agent via ADK |
| `VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME` | Vertex AI Reasoning Engine resource | After deploying the Summary Agent via ADK |
| `VISUALSPRINT_ACTION_ENGINE_RESOURCE_NAME` | Vertex AI Reasoning Engine resource | After deploying the Action Agent via ADK |

### Elastic

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `ELASTICSEARCH_URL` | Elasticsearch Serverless endpoint | Elastic Cloud Console |
| `ELASTICSEARCH_API_KEY_SECRET` | Elastic API key with write/read privileges | Elastic Cloud → API keys |
| `ELASTIC_INDEX_OUTCOMES` | Index name for historical outcomes | Example: `visualsprint-outcomes` |
| `ELASTIC_MCP_SERVER_URL` | Elastic MCP endpoint | `{KIBANA_URL}/api/agent_builder/mcp` |

### Jira

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `JIRA_BASE_URL` | Your Jira instance URL | Example: `https://yourcompany.atlassian.net` |
| `JIRA_API_TOKEN_SECRET` | Jira API token | Atlassian Account → Security → Create API token |

### Slack

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `SLACK_BOT_TOKEN_SECRET` | Slack Bot User OAuth Token | Slack API → Your Apps → OAuth & Permissions |
| `SLACK_DEFAULT_CHANNEL` | Default channel for Slack posts | Example: `#engineering` or `#general` |

### Cross-service

| Variable | Description | Example |
|----------|-------------|---------|
| `VISUALSPRINT_AGENTS_SERVICE_URL` | URL of the deployed agents service | `https://visualsprint-agents-...a.run.app` |
| `VISUALSPRINT_ALLOWED_ORIGINS` | CORS origins allowed by the API | `https://app.visualsprint.dev` |

---

## Google Secret Manager

Store these secrets in **Google Secret Manager** (not in code or env vars directly in production):

- `elastic-api-key` → map to `ELASTICSEARCH_API_KEY_SECRET`
- `jira-api-token` → map to `JIRA_API_TOKEN_SECRET`
- `slack-bot-token` → map to `SLACK_BOT_TOKEN_SECRET`

In Cloud Run, mount them via the `valueFrom` secret reference instead of plain `value`.

---

## Local development setup

### 1. Start the API

```bash
cd services/api
pip install -e .
uvicorn visualsprint_api.main:app --reload --port 8000
```

Required env (minimal):
```bash
export VISUALSPRINT_AGENTS_SERVICE_URL="http://127.0.0.1:8080"
```

### 2. Start the Agents service

```bash
cd services/agents
pip install -e .
uvicorn visualsprint_agents.main:app --reload --port 8080
```

### 3. Start the Web app

```bash
cd apps/web
npm install
npm run dev
```

### 4. Test the flow

1. Open `http://localhost:3000`
2. Create a meeting → **Start meeting**
3. Click **Begin browser capture** (or simulate chunks via the UI)
4. Let a few chunks process
5. Click **End meeting**
6. The final report generates automatically
7. Scroll to **Action recommendations** panel
8. Click **Generate recommendations**
9. You should see Jira/Slack suggestions with confidence and urgency badges
10. Click **Approve** on one, then **Execute**
11. Check the API console — you will see `[JIRA STUB]` or `[SLACK STUB]` logs

---

## Architecture reminder

```
Meeting
  ↓
Reasoning Agent (per chunk)
  ↓
Summary Agent (at meeting end)
  ↓
Action Agent (reads FinalReport)
  ↓
Persist Recommendations
  ↓
Approval Portal (human-in-the-loop)
  ↓
Execution Service
  ↓
Jira / Slack
```

The Action Agent **never** executes directly. All actions pass through:

1. Agent Recommendation
2. Backend Validation
3. User Approval
4. Execution Service

---

## Production wiring

To make Jira and Slack real (not stubs):

1. Fill `JIRA_BASE_URL` and `JIRA_API_TOKEN_SECRET`
2. Fill `SLACK_BOT_TOKEN_SECRET` and `SLACK_DEFAULT_CHANNEL`
3. Update `services/api/src/visualsprint_api/action_executors/jira_client.py` to call the Jira REST API
4. Update `services/api/src/visualsprint_api/action_executors/slack_client.py` to call `slack-sdk`

The stub architecture is intentionally ready for this — just replace `_execute_jira_stub` and `_execute_slack_stub` with real HTTP calls.

---

## Commit message for these changes

```
feat: action agent, jira/slack integration, approval portal

- Add Action Agent (4th agent) scaffold ADK + deterministic stub
- Add Jira and Slack recommendation schemas and execution stubs
- Add approval portal in dashboard with Approve/Reject/Execute flow
- Add backend routes for action lifecycle (generate, list, approve, reject, execute)
- Wire action agent into finalize_report pipeline
- Add Cloud Run YAML for API service and update agents YAML
- Document required credentials and local dev setup
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| "Generate recommendations" button disabled | Meeting not ended | End the meeting first |
| No recommendations appear | Agents service not running | Start `services/agents` on port 8080 |
| `[JIRA STUB]` / `[SLACK STUB]` in logs | No real credentials configured | Expected in local dev; fill secrets for production |
| `ImportError` on agents service | `google.adk` not installed | `pip install google-cloud-aiplatform[adk,agent_engines]` |
| Action agent config missing | Env var not set | Set `VISUALSPRINT_ACTION_ENGINE_RESOURCE_NAME` or run in `mock` mode |
