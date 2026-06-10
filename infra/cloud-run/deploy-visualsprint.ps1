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
    [string]$JiraApiTokenSecret = "",
    [string]$SlackBotTokenSecret = "SLACK_BOT_TOKEN_SECRET",
    [string]$ControlPlaneUrl = "https://visualsprint-api-530780341550.us-west1.run.app",
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

function Invoke-Native {
    param(
        [string]$FilePath,
        [string[]]$Arguments
    )

    & $FilePath @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw ("Command failed with exit code {0}: {1} {2}" -f $LASTEXITCODE, $FilePath, ($Arguments -join " "))
    }
}

function Join-EnvVars {
    param([string[]]$Pairs)

    return ($Pairs | Where-Object { $_ -and $_.Trim() }) -join ","
}

function Join-Secrets {
    param([string[]]$Pairs)

    return ($Pairs | Where-Object { $_ -and $_.Trim() }) -join ","
}

Require-Command "gcloud"
Require-Command "docker"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$agentsContext = Join-Path $repoRoot "services/agents"
$apiContext = Join-Path $repoRoot "services/api"

Set-Location $repoRoot

$agentsImage = "$Region-docker.pkg.dev/$ProjectId/$ArtifactRepository/agents:$ImageTag"
$apiImage = "$Region-docker.pkg.dev/$ProjectId/$ArtifactRepository/api:$ImageTag"

$reasoningResource = "projects/$ProjectNumber/locations/$Region/reasoningEngines/$ReasoningAgentId"
$summaryResource = "projects/$ProjectNumber/locations/$Region/reasoningEngines/$SummaryAgentId"
$actionResource = "projects/$ProjectNumber/locations/$Region/reasoningEngines/$ActionAgentId"

$reasoningQueryUrl = "https://$Region-aiplatform.googleapis.com/v1/${reasoningResource}:query"
$summaryQueryUrl = "https://$Region-aiplatform.googleapis.com/v1/${summaryResource}:query"
$actionQueryUrl = "https://$Region-aiplatform.googleapis.com/v1/${actionResource}:query"

Write-Host "Setting GCP project..."
Invoke-Native "gcloud" @("config", "set", "project", $ProjectId)

Write-Host "Configuring Docker authentication..."
Invoke-Native "gcloud" @("auth", "configure-docker", "$Region-docker.pkg.dev", "--quiet")

Write-Host "Building agents image..."
Invoke-Native "docker" @("build", "-t", $agentsImage, $agentsContext)

Write-Host "Pushing agents image..."
Invoke-Native "docker" @("push", $agentsImage)

Write-Host "Building API image..."
Invoke-Native "docker" @("build", "-t", $apiImage, $apiContext)

Write-Host "Pushing API image..."
Invoke-Native "docker" @("push", $apiImage)

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
    "VISUALSPRINT_CONTROL_PLANE_URL=$ControlPlaneUrl",
    "VISUALSPRINT_MCP_ENDPOINT=$ElasticMcpUrl",
    "VISUALSPRINT_ALLOWED_ORIGINS=$AllowedOrigins",
    "VISUALSPRINT_AGENT_REQUEST_TIMEOUT_SECONDS=4.0"
)

$agentsSecrets = Join-Secrets @(
    "VISUALSPRINT_ELASTIC_API_KEY=$ElasticMcpApiKeySecret:latest"
)

Write-Host "Deploying agents service..."
Invoke-Native "gcloud" @(
    "run", "deploy", $AgentsServiceName,
    "--project", $ProjectId,
    "--region", $Region,
    "--image", $agentsImage,
    "--service-account", $AgentsServiceAccount,
    "--allow-unauthenticated",
    "--set-env-vars", $agentsEnvVars,
    "--set-secrets=$agentsSecrets",
    "--quiet"
)

$agentsUrl = Invoke-Native "gcloud" @(
    "run", "services", "describe", $AgentsServiceName,
    "--project", $ProjectId,
    "--region", $Region,
    "--format", "value(status.url)"
)

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
    "VISUALSPRINT_SERVICE_TIMEOUT_SECONDS=5.0"
)

$apiSecrets = Join-Secrets @(
    "ELASTICSEARCH_API_KEY=$ElasticApiKeySecret:latest",
    $(if ($JiraApiTokenSecret) { "JIRA_API_TOKEN_SECRET=$JiraApiTokenSecret:latest" }),
    $(if ($SlackBotTokenSecret) { "SLACK_BOT_TOKEN_SECRET=$SlackBotTokenSecret:latest" })
)

Write-Host "Deploying API service..."
Invoke-Native "gcloud" @(
    "run", "deploy", $ApiServiceName,
    "--project", $ProjectId,
    "--region", $Region,
    "--image", $apiImage,
    "--service-account", $ApiServiceAccount,
    "--allow-unauthenticated",
    "--set-env-vars", $apiEnvVars,
    "--set-secrets=$apiSecrets",
    "--quiet"
)

$apiUrl = Invoke-Native "gcloud" @(
    "run", "services", "describe", $ApiServiceName,
    "--project", $ProjectId,
    "--region", $Region,
    "--format", "value(status.url)"
)

Write-Host "Updating agents service with the deployed control plane URL..."
Invoke-Native "gcloud" @(
    "run", "services", "update", $AgentsServiceName,
    "--project", $ProjectId,
    "--region", $Region,
    "--update-env-vars", "VISUALSPRINT_CONTROL_PLANE_URL=$apiUrl",
    "--quiet"
)

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Agents URL: $agentsUrl"
Write-Host "API URL:    $apiUrl"
