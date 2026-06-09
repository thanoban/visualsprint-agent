param(
    [string]$ProjectId = "visualsprint-agent",
    [string]$ProjectNumber = "530780341550",
    [string]$Region = "us-west1",
    [string]$ArtifactRepository = "visualsprint",
    [string]$AgentsServiceName = "visualsprint-agents",
    [string]$ApiServiceName = "visualsprint-api",
    [string]$AgentsServiceAccount = "visualsprint-agents@visualsprint-agent.iam.gserviceaccount.com",
    [string]$ApiServiceAccount = "visualsprint-api@visualsprint-agent.iam.gserviceaccount.com",
    [string]$ReasoningAgentId = "554162656492126208",
    [string]$SummaryAgentId = "6620511354560184320",
    [string]$ActionAgentId = "7293799498852073472",
    [string]$ElasticUrl = "https://my-elasticsearch-project-ad6723.es.us-central1.gcp.elastic.cloud",
    [string]$ElasticMcpUrl = "https://my-elasticsearch-project-ad6723.kb.us-central1.gcp.elastic.cloud/api/agent_builder/mcp",
    [string]$ElasticIndex = "visualsprint-meeting-events",
    [string]$ElasticApiKeySecret = "ELASTICSEARCH_API_KEY",
    [string]$ElasticMcpApiKeySecret = "elastic-mcp-server",
    [string]$AllowedOrigins = "https://app.visualsprint.dev",
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$CommandName)

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Required command '$CommandName' was not found in PATH."
    }
}

function Join-EnvVars {
    param([string[]]$Pairs)

    return ($Pairs | Where-Object { $_ -and $_.Trim() }) -join ","
}

Require-Command "gcloud"
Require-Command "docker"

$agentsImage = "$Region-docker.pkg.dev/$ProjectId/$ArtifactRepository/agents:$ImageTag"
$apiImage = "$Region-docker.pkg.dev/$ProjectId/$ArtifactRepository/api:$ImageTag"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$agentsContext = Join-Path $repoRoot "services/agents"
$apiContext = Join-Path $repoRoot "services/api"
Set-Location $repoRoot

$reasoningResource = "projects/$ProjectNumber/locations/$Region/reasoningEngines/$ReasoningAgentId"
$summaryResource = "projects/$ProjectNumber/locations/$Region/reasoningEngines/$SummaryAgentId"
$actionResource = "projects/$ProjectNumber/locations/$Region/reasoningEngines/$ActionAgentId"

$reasoningQueryUrl = "https://$Region-aiplatform.googleapis.com/v1/${reasoningResource}:query"
$summaryQueryUrl = "https://$Region-aiplatform.googleapis.com/v1/${summaryResource}:query"
$actionQueryUrl = "https://$Region-aiplatform.googleapis.com/v1/${actionResource}:query"

gcloud config set project $ProjectId | Out-Null
gcloud auth configure-docker "$Region-docker.pkg.dev" --quiet | Out-Null

docker build -t $agentsImage $agentsContext
docker push $agentsImage

docker build -t $apiImage $apiContext
docker push $apiImage

$agentsEnvVars = Join-EnvVars @(
    "VISUALSPRINT_ENV=production",
    "VISUALSPRINT_TRACK=elastic",
    "VISUALSPRINT_AGENT_MODE=configured_cloud",
    "VISUALSPRINT_DEPLOYMENT_TARGET=cloud_run",
    "VISUALSPRINT_AGENT_RUNTIME_BACKEND=vertex_ai_reasoning_engine",
    "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_ID=$ProjectId",
    "VISUALSPRINT_GOOGLE_CLOUD_PROJECT_NUMBER=$ProjectNumber",
    "VISUALSPRINT_GOOGLE_CLOUD_LOCATION=$Region",
    "VISUALSPRINT_REASONING_AGENT_ID=$ReasoningAgentId",
    "VISUALSPRINT_SUMMARY_AGENT_ID=$SummaryAgentId",
    "VISUALSPRINT_ACTION_AGENT_ID=$ActionAgentId",
    "VISUALSPRINT_REASONING_ENGINE_RESOURCE_NAME=$reasoningResource",
    "VISUALSPRINT_SUMMARY_ENGINE_RESOURCE_NAME=$summaryResource",
    "VISUALSPRINT_ACTION_ENGINE_RESOURCE_NAME=$actionResource",
    "VISUALSPRINT_REASONING_QUERY_URL=$reasoningQueryUrl",
    "VISUALSPRINT_SUMMARY_QUERY_URL=$summaryQueryUrl",
    "VISUALSPRINT_ACTION_QUERY_URL=$actionQueryUrl",
    "VISUALSPRINT_AGENT_RUNTIME_SERVICE_ACCOUNT=service-530780341550@gcp-sa-aiplatform-re.iam.gserviceaccount.com",
    "VISUALSPRINT_MCP_ENDPOINT=$ElasticMcpUrl",
    "VISUALSPRINT_ALLOWED_ORIGINS=$AllowedOrigins",
    "VISUALSPRINT_AGENT_REQUEST_TIMEOUT_SECONDS=4.0"
)

gcloud run deploy $AgentsServiceName `
    --project $ProjectId `
    --region $Region `
    --image $agentsImage `
    --service-account $AgentsServiceAccount `
    --allow-unauthenticated `
    --set-env-vars $agentsEnvVars `
    --set-secrets "VISUALSPRINT_ELASTIC_API_KEY=$ElasticMcpApiKeySecret:latest"

$agentsUrl = gcloud run services describe $AgentsServiceName `
    --project $ProjectId `
    --region $Region `
    --format "value(status.url)"

if (-not $agentsUrl) {
    throw "Unable to resolve the deployed agents service URL."
}

$apiEnvVars = Join-EnvVars @(
    "VISUALSPRINT_ENV=production",
    "VISUALSPRINT_TRACK=elastic",
    "VISUALSPRINT_AGENTS_SERVICE_URL=$agentsUrl",
    "VISUALSPRINT_INGEST_SERVICE_URL=",
    "VISUALSPRINT_MEDIA_SERVICE_URL=",
    "ELASTICSEARCH_URL=$ElasticUrl",
    "ELASTIC_INDEX_OUTCOMES=$ElasticIndex",
    "ELASTIC_MCP_SERVER_URL=$ElasticMcpUrl",
    "JIRA_BASE_URL=",
    "JIRA_API_TOKEN_SECRET=",
    "SLACK_BOT_TOKEN_SECRET=",
    "SLACK_DEFAULT_CHANNEL=#general",
    "VISUALSPRINT_ALLOWED_ORIGINS=$AllowedOrigins",
    "VISUALSPRINT_SERVICE_TIMEOUT_SECONDS=0.5"
)

gcloud run deploy $ApiServiceName `
    --project $ProjectId `
    --region $Region `
    --image $apiImage `
    --service-account $ApiServiceAccount `
    --allow-unauthenticated `
    --set-env-vars $apiEnvVars `
    --set-secrets "ELASTICSEARCH_API_KEY=$ElasticApiKeySecret:latest"

$apiUrl = gcloud run services describe $ApiServiceName `
    --project $ProjectId `
    --region $Region `
    --format "value(status.url)"

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Agents URL: $agentsUrl"
Write-Host "API URL:    $apiUrl"
