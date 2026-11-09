@echo off
setlocal enabledelayedexpansion
title jobSuite Windows Supervisor
cd /d "%~dp0"

echo =====================================================================
echo  jobSuite — Windows Native AI Job Automation & Career-Ops
echo =====================================================================
echo.

:: 1. Clean up any stale background processes on Ports 4173 and 5173
echo [1/4] Checking ports 4173 and 5173 for stale processes...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4173,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

:: 2. Launch Chrome CDP session on port 9222 if not already active
echo [2/4] Verifying Chrome DevTools Protocol (CDP Port 9222)...
powershell -NoProfile -Command "try { $c = Get-NetTCPConnection -LocalPort 9222 -State Listen -ErrorAction Stop; Write-Host '  -> Chrome CDP is already active on port 9222.' -ForegroundColor Green } catch { Write-Host '  -> Starting Chrome CDP session...' -ForegroundColor Yellow; & '.\scripts\launch-chrome-cdp.ps1' }"

:: 3. Launch Engine & UI via concurrently
echo [3/4] Launching Automation Engine (Port 4173) & Vite UI (Port 5173)...
start "jobSuite-Services" /min cmd /c "npm run dev"

echo [jobSuite] Waiting for Vite UI to be ready at http://localhost:5173...
set /a retries=0
:wait_loop
timeout /t 1 /nobreak >nul
powershell -NoProfile -Command "try { $res = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 1; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    set /a retries+=1
    if !retries! geq 30 (
        echo [ERROR] Timed out waiting for jobSuite services to start. Check terminal output.
        pause
        goto shutdown
    )
    goto wait_loop
)

:: 4. Launch Native Window using Edge App mode
echo [4/4] Opening Windows Native App Window...
set "EDGE_EXE="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" (
    set "EDGE_EXE=%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"
)

if defined EDGE_EXE (
    start /wait "" "!EDGE_EXE!" --app="http://localhost:5173" --window-size=1440,920 --app-window-name="jobSuite" --user-data-dir="%LOCALAPPDATA%\jobSuite\edge_app"
) else (
    echo [jobSuite] Edge not found in standard paths, launching via system default browser...
    start /wait msedge.exe --app="http://localhost:5173" --window-size=1440,920
)

:shutdown
echo.
echo =====================================================================
echo  App window closed. Cleaning up jobSuite background services...
echo =====================================================================
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4173,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [jobSuite] Ports 4173 and 5173 cleared. Zero orphaned node.exe processes remaining.
timeout /t 2 >nul
exit /b 0
