param(
    [int]$Port = 4173,
    [string]$Bind = "127.0.0.1",
    [switch]$ForceRestart
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\\..")).Path

function Get-Listener {
    try {
        return Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop | Select-Object -First 1
    } catch {
        return $null
    }
}

$listener = Get-Listener
if ($listener -and $ForceRestart) {
    try {
        Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
        Start-Sleep -Milliseconds 500
    } catch {}
    $listener = $null
}

if (-not $listener) {
    Start-Process -FilePath py -ArgumentList @("-m", "http.server", $Port, "--bind", $Bind) -WorkingDirectory $repoRoot -WindowStyle Hidden | Out-Null
    Start-Sleep -Seconds 2
    $listener = Get-Listener
}

if (-not $listener) {
    throw "Failed to start static server on http://$Bind`:$Port"
}

Write-Output ("Static server ready at http://{0}:{1}/ (PID {2})" -f $Bind, $Port, $listener.OwningProcess)
