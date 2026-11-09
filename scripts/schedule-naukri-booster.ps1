# jobSuite - Windows Task Scheduler Hook for Naukri Daily Profile Booster
# Triggers daily at 08:55 AM IST with human jitter

$TaskName = "jobSuite_Naukri_9AM_Booster"
$NodePath = (Get-Command node).Source
$ScriptPath = Join-Path (Get-Location) "engine\run-booster.ts"
$WorkingDirectory = (Get-Location).Path

Write-Host "Registering Windows Task Scheduler Job: $TaskName" -ForegroundColor Cyan
Write-Host "Target Working Directory: $WorkingDirectory"
Write-Host "Node Executable: $NodePath"

# Command arguments: run via tsx
$Action = New-ScheduledTaskAction `
    -Execute "npx.cmd" `
    -Argument "tsx engine/run-booster.ts" `
    -WorkingDirectory $WorkingDirectory

# Trigger: Daily at 08:55 AM with +/- 15 min random delay
$Trigger = New-ScheduledTaskTrigger -Daily -At "08:55AM"
$Trigger.RandomDelay = [TimeSpan]::FromMinutes(15)

# Settings: Allow wake to run, stop if running more than 15 mins
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -WakeToRun `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

# Check if task already exists and unregister
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
    Write-Host "Updating existing Task Scheduler job..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "jobSuite: Naukri.com 9 AM Daily Profile Booster (Resume Re-upload & Headline Micro-Edit)"

Write-Host "Task successfully registered in Windows Task Scheduler!" -ForegroundColor Green
Write-Host "Schedule: Daily at 08:55 AM IST (+/- 15 min random jitter)" -ForegroundColor Green
