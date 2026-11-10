$ErrorActionPreference = 'Stop'
$projectDirectory = $PSScriptRoot
$backendDirectory = Join-Path $projectDirectory 'backend'
$frontendDirectory = Join-Path $projectDirectory 'frontend'
$backendPython = Join-Path $backendDirectory '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath (Join-Path $backendDirectory '.env'))) {
    Copy-Item -LiteralPath (Join-Path $backendDirectory '.env.example') -Destination (Join-Path $backendDirectory '.env')
}
if (-not (Test-Path -LiteralPath (Join-Path $frontendDirectory '.env.local'))) {
    Copy-Item -LiteralPath (Join-Path $frontendDirectory '.env.example') -Destination (Join-Path $frontendDirectory '.env.local')
}
if (-not (Test-Path -LiteralPath $backendPython)) {
    & uv venv --python 3.12 (Join-Path $backendDirectory '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'Unable to create Python environment. Install uv and Python 3.12.' }
}
& uv pip install --python $backendPython -r (Join-Path $backendDirectory 'requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
Push-Location $frontendDirectory
try {
    if (-not (Test-Path -LiteralPath 'node_modules')) {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
    }
} finally { Pop-Location }
$backendProcess = $null
$frontendProcess = $null
try {
    $backendProcess = Start-Process -FilePath $backendPython -ArgumentList '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000' -WorkingDirectory $backendDirectory -WindowStyle Hidden -PassThru
    $npmCommand = (Get-Command npm.cmd).Source
    $frontendProcess = Start-Process -FilePath $npmCommand -ArgumentList 'run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort' -WorkingDirectory $frontendDirectory -WindowStyle Hidden -PassThru
    Write-Host 'ClockIn: http://127.0.0.1:5173'
    Write-Host 'API docs: http://127.0.0.1:8000/docs'
    Write-Host 'Press Ctrl+C to stop both servers.'
    while ($true) {
        Start-Sleep -Seconds 2
        if ($backendProcess.HasExited -or $frontendProcess.HasExited) { throw 'A server stopped. Check that ports 8000 and 5173 are free and environment values are valid.' }
    }
} finally {
    foreach ($serverProcess in @($backendProcess, $frontendProcess)) {
        if ($serverProcess -and -not $serverProcess.HasExited) {
            & taskkill.exe /PID $serverProcess.Id /T /F 2>$null | Out-Null
        }
    }
}
