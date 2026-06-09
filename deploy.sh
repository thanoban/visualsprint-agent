#!/usr/bin/env bash
#
# Deploy the VisualSprint control plane + agents adapter to Cloud Run.
# Canonical deploy path for the repo (the infra/cloud-run/*.yaml manifests are
# reference only). Reads non-secret config from .env; injects keys from Secret
# Manager via --set-secrets.
#
# Prereqs (one-time) — see docs/DEPLOY.md:
#   gcloud auth login && gcloud config set project visualsprint-agent
#   gcloud services enable run.googleapis.com aiplatform.googleapis.com \
#       secretmanager.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
#   printf '%s' 'ENCODED_BACKEND_KEY' | gcloud secrets create elastic-backend-key --data-file=-
#   printf '%s' 'ENCODED_MCP_KEY'     | gcloud secrets create elastic-mcp-key     --data-file=-
#   # service accounts + IAM (see DEPLOY.md)
#
# Then: cp .env.example .env, fill the REPLACE_* values, and run: bash deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
# shellcheck disable=SC1090
source "${SCRIPT_DIR}/.env"
set +a

: "${PROJECT_ID:?set PROJECT_ID in .env}"
: "${REGION:?set REGION in .env}"
ELASTIC_BACKEND_SECRET="${ELASTIC_BACKEND_SECRET:-elastic-backend-key}"
ELASTIC_MCP_SECRET="${ELASTIC_MCP_SECRET:-elastic-mcp-key}"
JIRA_TOKEN_SECRET="${JIRA_TOKEN_SECRET:-}"
SLACK_TOKEN_SECRET="${SLACK_TOKEN_SECRET:-}"

API_SECRETS="ELASTICSEARCH_API_KEY=${ELASTIC_BACKEND_SECRET}:latest"
if [[ -n "${JIRA_TOKEN_SECRET}" ]]; then
  API_SECRETS="${API_SECRETS},JIRA_API_TOKEN_SECRET=${JIRA_TOKEN_SECRET}:latest"
fi
if [[ -n "${SLACK_TOKEN_SECRET}" ]]; then
  API_SECRETS="${API_SECRETS},SLACK_BOT_TOKEN_SECRET=${SLACK_TOKEN_SECRET}:latest"
fi

echo ">> [1/3] Deploying visualsprint-api ..."
gcloud run deploy visualsprint-api \
  --source services/api \
  --project "${PROJECT_ID}" --region "${REGION}" \
  --allow-unauthenticated \
  --set-env-vars "^##^VISUALSPRINT_ENV=${VISUALSPRINT_ENV}##VISUALSPRINT_TRACK=${VISUALSPRINT_TRACK}##ELASTICSEARCH_URL=${ELASTICSEARCH_URL}##ELASTIC_INDEX_OUTCOMES=${ELASTIC_INDEX_OUTCOMES}##ELASTIC_MCP_SERVER_URL=${ELASTIC_MCP_SERVER_URL}##JIRA_BASE_URL=${JIRA_BASE_URL}##SLACK_DEFAULT_CHANNEL=${SLACK_DEFAULT_CHANNEL}##VISUALSPRINT_ALLOWED_ORIGINS=${VISUALSPRINT_ALLOWED_ORIGINS}" \
  --set-secrets "${API_SECRETS}"

API_URL="$(gcloud run services describe visualsprint-api --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"
echo ">> control plane: ${API_URL}"

echo ">> [2/3] Deploying visualsprint-agents (control plane = ${API_URL}) ..."
gcloud run deploy visualsprint-agents \
  --source services/agents \
  --project "${PROJECT_ID}" --region "${REGION}" \
  --service-account "${VISUALSPRINT_SERVICE_ACCOUNT_EMAIL}" \
  --allow-unauthenticated \
  --set-env-vars "^##^VISUALSPRINT_ENV=${VISUALSPRINT_ENV}##VISUALSPRINT_TRACK=${VISUALSPRINT_TRACK}##VISUALSPRINT_AGENT_MODE=${VISUALSPRINT_AGENT_MODE}##VISUALSPRINT_DEPLOYMENT_TARGET=${VISUALSPRINT_DEPLOYMENT_TARGET}##VISUALSPRINT_AGENT_RUNTIME_BACKEND=${VISUALSPRINT_AGENT_RUNTIME_BACKEND}##VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID=${VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID}##VISUALSPRINT_GOOGLE_CLOUD_PROJECT_NUMBER=${VISUALSPRINT_GOOGLE_CLOUD_PROJECT_NUMBER}##VISUALSPRINT_GOOGLE_CLOUD_LOCATION=${VISUALSPRINT_GOOGLE_CLOUD_LOCATION}##VISUALSPRINT_AGENT_APPLICATION_ID=${VISUALSPRINT_AGENT_APPLICATION_ID}##VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME=${VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME}##VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME=${VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME}##VISUALSPRINT_ACTION_ENGINE_RESOURCE_NAME=${VISUALSPRINT_ACTION_ENGINE_RESOURCE_NAME}##VISUALSPRINT_CONTROL_PLANE_URL=${API_URL}##VISUALSPRINT_ELASTIC_MCP_ENDPOINT=${VISUALSPRINT_ELASTIC_MCP_ENDPOINT}##VISUALSPRINT_REASONING_MODEL=${VISUALSPRINT_REASONING_MODEL}##VISUALSPRINT_SUMMARY_MODEL=${VISUALSPRINT_SUMMARY_MODEL}##VISUALSPRINT_ACTION_MODEL=${VISUALSPRINT_ACTION_MODEL}##VISUALSPRINT_ALLOWED_ORIGINS=${VISUALSPRINT_ALLOWED_ORIGINS}##VISUALSPRINT_AGENT_REQUEST_TIMEOUT_SECONDS=${VISUALSPRINT_AGENT_REQUEST_TIMEOUT_SECONDS}" \
  --set-secrets "VISUALSPRINT_ELASTIC_API_KEY=${ELASTIC_MCP_SECRET}:latest"

AGENTS_URL="$(gcloud run services describe visualsprint-agents --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"
echo ">> agents: ${AGENTS_URL}"

echo ">> [3/3] Pointing control plane at the agents service ..."
gcloud run services update visualsprint-api \
  --project "${PROJECT_ID}" --region "${REGION}" \
  --update-env-vars "VISUALSPRINT_AGENTS_SERVICE_URL=${AGENTS_URL}"

echo ">> Done. Validate:"
echo "   curl ${AGENTS_URL}/api/health"
echo "   curl ${API_URL}/api/meta"
echo "   curl -X POST ${API_URL}/api/meetings/MEETING_ID/agents/smoke?clientChunkId=CHUNK_ID"
echo "   curl ${API_URL}/api/meta/agents/invocations"
