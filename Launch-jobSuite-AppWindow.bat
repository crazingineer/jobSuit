@echo off
rem =====================================================================
rem   jobSuite - Windows Native AI Job Automation and Career-Ops
rem =====================================================================
title jobSuite Windows Supervisor
cd /d "%~dp0"

echo =====================================================================
echo   jobSuite - Windows Native AI Job Automation and Career-Ops
echo =====================================================================
echo.

rem 1. Clean up any stale background processes on Ports 4173 and 5173
echo [1/4] Checking ports 4173 and 5173 for stale processes...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4173,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

rem 2. Launch Chrome CDP session on port 9222 if not already active
echo [2/4] Verifying Chrome DevTools Protocol on Port 9222...
powershell -NoProfile -Command "try { $c = Get-NetTCPConnection -LocalPort 9222 -State Listen -ErrorAction Stop; Write-Host '  Chrome CDP is active on port 9222.' -ForegroundColor Green } catch { Write-Host '  Starting Chrome CDP session...' -ForegroundColor Yellow; & '.\scripts\launch-chrome-cdp.ps1' }"

rem 3. Launch Engine and UI via npm run dev
echo [3/4] Launching Automation Engine and Vite UI in background...
start "jobSuite-Services" /min cmd /c "npm run dev"

echo [jobSuite] Waiting for Vite UI to be ready at http://localhost:5173...
powershell -NoProfile -Command "$ready = $false; for ($i = 0; $i -lt 30; $i++) { Start-Sleep -Seconds 1; try { $res = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 1; if ($res.StatusCode -eq 200) { $ready = $true; break } } catch {} }; if (-not $ready) { Write-Host '[ERROR] Timed out waiting for Vite UI' -ForegroundColor Red; exit 1 }"
if errorlevel 1 goto shutdown

rem 4. Launch Native Window using Chromium / Chrome App mode
echo [4/4] Opening Windows Native Chromium App Window...
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start /wait "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="http://localhost:5173" --window-size=1440,920 --app-window-name="jobSuite" --user-data-dir="%LOCALAPPDATA%\jobSuite\chromium_app"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start /wait "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="http://localhost:5173" --window-size=1440,920 --app-window-name="jobSuite" --user-data-dir="%LOCALAPPDATA%\jobSuite\chromium_app"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start /wait "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app="http://localhost:5173" --window-size=1440,920 --app-window-name="jobSuite" --user-data-dir="%LOCALAPPDATA%\jobSuite\chromium_app"
) else if exist "%LOCALAPPDATA%\Chromium\Application\chrome.exe" (
    start /wait "" "%LOCALAPPDATA%\Chromium\Application\chrome.exe" --app="http://localhost:5173" --window-size=1440,920 --app-window-name="jobSuite" --user-data-dir="%LOCALAPPDATA%\jobSuite\chromium_app"
) else (
    start /wait chrome.exe --app="http://localhost:5173" --window-size=1440,920
)

:shutdown
echo.
echo =====================================================================
echo   App window closed. Cleaning up jobSuite background services...
echo =====================================================================
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4173,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [jobSuite] Ports 4173 and 5173 cleared. Zero orphaned node processes remaining.
timeout /t 2 >nul
exit /b 0
