@echo off
setlocal
cd /d "%~dp0"
echo Opening Draw and Say learning page...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1"
if errorlevel 1 (
  echo Startup failed. See the message above.
  pause
)
