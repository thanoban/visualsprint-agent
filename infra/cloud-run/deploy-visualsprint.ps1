param(
    [string]$ProjectId = "visualsprint-agent",
    [string]$ProjectNumber = "530780341550",
    [string]$Region = "us-west1",
    [string]$ArtifactRepository = "visualsprint",

    [string]$AgentsServiceName = "visualsprint-agents",
    [string]$ApiServiceName = "visualsprint-api",

    # Existing Cloud Run runtime service account.
    [string]$AgentsServiceAccount = "visualsprint-backend-service-a@visualsprint-agent.iam.gserviceaccount.com",
    [string]$ApiServiceAccount = "visualsprint-backend-service-a@visualsprint-agent.iam.gserviceaccount.com",

    [string]$ReasoningAgentId = "554162656492126208",
    [string]$SummaryAgentId = "6620511354560184320",
    [string]$ActionAgentId = "7293799498852073472",

    # Secret Manager secret names, not raw secret values.
    [string]$ElasticApiKeySecret = "ELASTICSEARCH_API_KEY",
    [string]$ElasticUrlSecret = "ELASTICSEARCH_URL",
    [string]$ElasticIndexSecret = "ELASTIC_INDEX_OUTCOMES",
    [string]$ElasticMcpUrlSecret = "ELASTIC_MCP_SERVER_URL",
    [string]$ControlPlaneUrl = "https://visualsprint-api-530780341550.us-west1.run.app",

    [string]$AllowedOrigins = "https://app.visualsprint.dev",
    [string]$ImageTag = "latest"
)

$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -ge 7) {
    $PSNativeCommandUseErrorActionPreference = $true
}

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

function Test-ServiceAccountExists {
    param(
        [string]$ProjectId,
        [string]$ServiceAccountEmail
    )

    $result = gcloud iam service-accounts list `
        --project $ProjectId `
        --filter "email=$ServiceAccountEmail" `
        --format "value(email)"

    return -not [string]::IsNullOrWhiteSpace($result)
}

function Test-ArtifactRepositoryExists {
    param(
        [string]$ProjectId,
        [string]$Region,
        [string]$Repository
    )

    $result = gcloud artifacts repositories list `
        --project $ProjectId `
        --location $Region `
        --filter "name~'$Repository'" `
        --format "value(name)"

    return -not [string]::IsNullOrWhiteSpace($result)
}

function Grant-SecretAccess {
    param(
        [string]$SecretName,
        [string]$ServiceAccountEmail
    )

    Write-Host "Granting Secret Manager access for $SecretName to $ServiceAccountEmail..."

    Invoke-Native "gcloud" @(
        "secrets", "add-iam-policy-binding", $SecretName,
        "--project", $ProjectId,
        "--member", "serviceAccount:$ServiceAccountEmail",
        "--role", "roles/secretmanager.secretAccessor",
        "--quiet"
    )
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

Write-Host "Setting GCP project..."
Invoke-Native "gcloud" @("config", "set", "project", $ProjectId)

Write-Host "Checking Docker..."
Invoke-Native "docker" @("version")

Write-Host "Configuring Docker authentication for Artifact Registry..."
Invoke-Native "gcloud" @("auth", "configure-docker", "$Region-docker.pkg.dev", "--quiet")

Write-Host "Checking Artifact Registry repository..."
if (-not (Test-ArtifactRepositoryExists -ProjectId $ProjectId -Region $Region -Repository $ArtifactRepository)) {
    throw "Missing Artifact Registry repository: $ArtifactRepository in $Region. Create it before deploying."
}

Write-Host "Checking Cloud Run service account..."
if (-not (Test-ServiceAccountExists -ProjectId $ProjectId -ServiceAccountEmail $AgentsServiceAccount)) {
    throw "Missing service account: $AgentsServiceAccount. Create it before deploying."
}

if (-not (Test-ServiceAccountExists -ProjectId $ProjectId -ServiceAccountEmail $ApiServiceAccount)) {
    throw "Missing service account: $ApiServiceAccount. Create it before deploying."
}

$requiredSecrets = @(
    $ElasticApiKeySecret,
    $ElasticUrlSecret,
    $ElasticIndexSecret,
    $ElasticMcpUrlSecret
) | Sort-Object -Unique

foreach ($secretName in $requiredSecrets) {
    Grant-SecretAccess -SecretName $secretName -ServiceAccountEmail $AgentsServiceAccount
    Grant-SecretAccess -SecretName $secretName -ServiceAccountEmail $ApiServiceAccount
}

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
    "VISUALSPRINT_ALLOWED_ORIGINS=$AllowedOrigins",
    "VISUALSPRINT_AGENT_REQUEST_TIMEOUT_SECONDS=30.0"
)

$agentsSecrets = "VISUALSPRINT_ELASTIC_API_KEY=$($ElasticApiKeySecret):latest,VISUALSPRINT_MCP_ENDPOINT=$($ElasticMcpUrlSecret):latest"

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
    "JIRA_BASE_URL=",
    "JIRA_API_TOKEN_SECRET=",
    "SLACK_BOT_TOKEN_SECRET=",
    "SLACK_DEFAULT_CHANNEL=#general",
    "VISUALSPRINT_ALLOWED_ORIGINS=$AllowedOrigins",
    "VISUALSPRINT_SERVICE_TIMEOUT_SECONDS=5.0"
)

$apiSecrets = "ELASTICSEARCH_URL=$($ElasticUrlSecret):latest,ELASTICSEARCH_API_KEY=$($ElasticApiKeySecret):latest,ELASTIC_INDEX_OUTCOMES=$($ElasticIndexSecret):latest,ELASTIC_MCP_SERVER_URL=$($ElasticMcpUrlSecret):latest"

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

$apiUrl = gcloud run services describe $ApiServiceName `
    --project $ProjectId `
    --region $Region `
    --format "value(status.url)"

if (-not $apiUrl) {
    throw "Unable to resolve the deployed API service URL."
}

$agentsEnvUpdate = Join-EnvVars @(
    "VISUALSPRINT_CONTROL_PLANE_URL=$apiUrl"
)

Write-Host "Updating agents service with the deployed control plane URL..."
Invoke-Native "gcloud" @(
    "run", "services", "update", $AgentsServiceName,
    "--project", $ProjectId,
    "--region", $Region,
    "--update-env-vars", $agentsEnvUpdate,
    "--quiet"
)

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Agents URL: $agentsUrl"
Write-Host "API URL:    $apiUrl"
