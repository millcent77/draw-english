$ErrorActionPreference = 'Stop'
# Per-user registration, no administrator rights or startup background process.
$learningProtocolKey = 'HKCU:\Software\Classes\draw-say'
$learningLaunchScript = Join-Path $PSScriptRoot 'launch.ps1'
if (-not (Test-Path -LiteralPath $learningLaunchScript)) { throw 'Learning launcher is missing.' }
$learningPowerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$learningCommand = '"' + $learningPowerShell + '" -NoLogo -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $learningLaunchScript + '" -Practice'
New-Item -Path "$learningProtocolKey\shell\open\command" -Force | Out-Null
Set-Item -Path $learningProtocolKey -Value 'URL:Draw and Say Learning'
New-ItemProperty -Path $learningProtocolKey -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
Set-Item -Path "$learningProtocolKey\shell\open\command" -Value $learningCommand
Write-Host 'Installed draw-say://practice for this Windows user.'
