@echo off
rem =====================================================================
rem   jobSuite - Windows Native AI Job Automation and Career-Ops
rem =====================================================================
title jobSuite Desktop App
cd /d "%~dp0"

echo =====================================================================
echo   jobSuite - Windows Native AI Job Automation and Career-Ops
echo =====================================================================

echo [1/3] Checking ports 4173 and 5173 for stale processes...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4173,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo [2/3] Starting Chrome CDP session if not running...
powershell -NoProfile -Command "try { $c = Get-NetTCPConnection -LocalPort 9222 -State Listen -ErrorAction Stop } catch { & '.\scripts\launch-chrome-cdp.ps1' }"

echo [3/3] Launching Engine and UI (Press Ctrl+C to stop both)...
start "" "http://localhost:5173"
npm run dev
