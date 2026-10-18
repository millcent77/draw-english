$ErrorActionPreference = 'Stop'
$learningUrl = 'http://127.0.0.1:8765'
$learningClient = $null
try {
    Write-Host 'Checking learning page...'
    Add-Type -AssemblyName System.Net.Http
    $learningHandler = New-Object System.Net.Http.HttpClientHandler
    $learningHandler.UseProxy = $false
    $learningClient = New-Object System.Net.Http.HttpClient($learningHandler)
    $learningClient.Timeout = [TimeSpan]::FromMilliseconds(800)
    function Test-LearningServer {
        try {
            $learningBody = $learningClient.GetStringAsync("$learningUrl/app.js").GetAwaiter().GetResult()
            $learningSongs = $learningClient.GetStringAsync("$learningUrl/songs-player.js").GetAwaiter().GetResult()
            $learningAudio = $learningClient.GetAsync("$learningUrl/assets/songs/twinkle.mp3", [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
            try { return $learningBody.Contains('draw-say-pet-v1') -and $learningSongs.Contains('INLINE_SINGING_PLAYER_V4') -and $learningAudio.IsSuccessStatusCode -and $learningAudio.Content.Headers.ContentType.MediaType -eq 'audio/mpeg' }
            finally { $learningAudio.Dispose() }
        } catch { return $false }
    }
    if (-not (Test-LearningServer)) {
        # Restart only a verified older instance of this app, never an unrelated port owner.
        try {
            $learningExisting = $learningClient.GetStringAsync("$learningUrl/app.js").GetAwaiter().GetResult()
            if ($learningExisting.Contains('draw-say-pet-v1')) {
                $learningListener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($learningListener) {
                    $learningOwner = Get-CimInstance Win32_Process -Filter "ProcessId=$($learningListener.OwningProcess)"
                    if ($learningOwner.Name -eq 'node.exe' -and $learningOwner.CommandLine -match 'serve\.cjs') {
                        Write-Host 'Restarting previous learning server for the update...'
                        Stop-Process -Id $learningOwner.ProcessId -ErrorAction Stop
                    }
                }
            }
        } catch { Write-Host 'No verified older learning server to restart.' }
        $learningNode = Get-Command node -ErrorAction SilentlyContinue
        if (-not $learningNode) { throw 'Node.js was not found. Install Node.js, then try again.' }
        Write-Host 'Starting learning server (up to 8 seconds)...'
        $learningProcess = Start-Process -FilePath $learningNode.Source -ArgumentList ('"' + (Join-Path $PSScriptRoot 'serve.cjs') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot 'learning-server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'learning-server-error.log')
        $learningClock = [System.Diagnostics.Stopwatch]::StartNew()
        do {
            if (Test-LearningServer) { break }
            if ($learningProcess.HasExited) {
                $learningError = Get-Content (Join-Path $PSScriptRoot 'learning-server-error.log') -Raw -ErrorAction SilentlyContinue
                throw "Learning server stopped. $learningError"
            }
            Start-Sleep -Milliseconds 200
        } while ($learningClock.Elapsed.TotalSeconds -lt 8)
    }
    if (-not (Test-LearningServer)) { throw 'Learning page did not respond. Port 8765 may be occupied or blocked. Check learning-server-error.log.' }
    Write-Host "Opening $learningUrl in your browser..."
    Start-Process $learningUrl
} catch {
    Write-Host "Unable to open learning page: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Page address: $learningUrl"
    Read-Host 'Press Enter to close'
    exit 1
} finally {
    if ($learningClient) { $learningClient.Dispose() }
}
