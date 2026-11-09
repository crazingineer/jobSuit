@echo off
title jobSuite Native Window
cd /d "%~dp0"

echo [jobSuite] Launching Local Automation Engine...
start "jobSuite-Engine" /min cmd /c "npm run dev:engine"

echo [jobSuite] Launching Frontend Interface...
start "jobSuite-UI" /min cmd /c "npm run dev:ui"

echo [jobSuite] Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo [jobSuite] Opening Windows Native App Window...
start msedge.exe --app="http://localhost:5173" --window-size=1440,920 --app-window-name="jobSuite"
