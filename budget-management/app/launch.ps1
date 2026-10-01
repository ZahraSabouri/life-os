param([switch]$NoOpen, [switch]$Stop, [int]$Port = 47831)
$ErrorActionPreference = 'Stop'
$budgetUrl = "http://127.0.0.1:$Port"
$budgetIdentity = 'zahra-budget-planner-local-v1'

function Get-BudgetHealth {
    try { Invoke-RestMethod -Uri "$budgetUrl/__planner/health" -TimeoutSec 2 }
    catch { $null }
}

$budgetHealth = Get-BudgetHealth
if ($budgetHealth -and $budgetHealth.app -ne $budgetIdentity) {
    throw 'Another application is using the planner address.'
}
if ($Stop) {
    if ($budgetHealth) {
        Invoke-RestMethod -Uri "$budgetUrl/__planner/stop" -Method Post -Headers @{'X-Planner-Action'='stop'} | Out-Null
    }
    exit 0
}
if ($budgetHealth -and $budgetHealth.directory -ne $PSScriptRoot) {
    throw 'A different copy of this planner is running. Stop that copy before opening this one.'
}
if (-not $budgetHealth) {
    $budgetNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $budgetNode) {
        throw 'Node.js is needed to run this local app. Install Node.js, then use Start Budget Management.cmd again.'
    }
    $budgetRuntime = Join-Path $PSScriptRoot '.local-runtime'
    New-Item -ItemType Directory -Path $budgetRuntime -Force | Out-Null
    $budgetServerPath = Join-Path $PSScriptRoot 'local-server.cjs'
    $env:BUDGET_PORT = "$Port"
    $budgetProcess = Start-Process -FilePath $budgetNode.Source -ArgumentList ('"' + $budgetServerPath + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $budgetRuntime 'server.log') -RedirectStandardError (Join-Path $budgetRuntime 'server-error.log')
    for ($budgetAttempt = 0; $budgetAttempt -lt 30; $budgetAttempt++) {
        $budgetHealth = Get-BudgetHealth
        if ($budgetHealth -and $budgetHealth.app -eq $budgetIdentity) { break }
        if ($budgetProcess.HasExited) { break }
        Start-Sleep -Milliseconds 100
    }
    if (-not $budgetHealth -or $budgetHealth.app -ne $budgetIdentity -or $budgetHealth.directory -ne $PSScriptRoot) {
        throw 'The planner could not start. Check .local-runtime\server-error.log in this folder.'
    }
}
if (-not $NoOpen) { Start-Process "$budgetUrl/" }
