@echo off
title jobSuite Desktop App
echo ===================================================================
echo   jobSuite - Windows Native AI Job Automation & Career-Ops
echo   Running Local Engine (Port 4173) + React Desktop UI (Port 5173)
echo ===================================================================

cd /d "%~dp0"
start "jobSuite-Engine" /min cmd /c "npm run dev:engine"
timeout /t 2 /nobreak >nul
start "" "http://localhost:5173"
npm run dev:ui
