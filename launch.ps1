$ErrorActionPreference = 'Stop'
$learningUrl = 'http://127.0.0.1:8765'
function Test-LearningServer {
    try {
        $learningRequest = [System.Net.HttpWebRequest]::Create("$learningUrl/app.js")
        $learningRequest.Proxy = $null
        $learningRequest.Timeout = 1500
        $learningRequest.ReadWriteTimeout = 1500
        $learningResponse = $learningRequest.GetResponse()
        $learningReader = New-Object System.IO.StreamReader($learningResponse.GetResponseStream())
        return $learningReader.ReadToEnd().Contains('draw-say-pet-v1')
    } catch { return $false }
    finally { if ($learningReader) { $learningReader.Dispose() }; if ($learningResponse) { $learningResponse.Dispose() } }
}
if (-not (Test-LearningServer)) {
    $learningNode = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $learningNode -ArgumentList ('"' + (Join-Path $PSScriptRoot 'serve.cjs') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    for ($learningAttempt = 0; $learningAttempt -lt 20; $learningAttempt++) {
        Start-Sleep -Milliseconds 250
        if (Test-LearningServer) { break }
    }
}
if (Test-LearningServer) {
    Start-Process "$learningUrl/#practice"
} else {
    Write-Host 'Unable to start learning server. Check port 8765 and Node.js.'
    Read-Host 'Press Enter to close'
}
